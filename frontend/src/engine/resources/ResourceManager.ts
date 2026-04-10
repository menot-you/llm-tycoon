/**
 * ResourceManager — aplica produção/consumo dos 6 recursos por tick.
 *
 * Recursos:
 * - tokens: produção principal (buildings × multipliers)
 * - compute: subproduto, usado em treino
 * - data: qualidade dos dados (afeta upgrades)
 * - funding: ganho de hype + multiplicadores
 * - hype: decai 5%/min, afeta funding
 * - hallucinations: cresce com produção, drena tokens
 */

import { ERAS_BY_ID } from '../../data/eras';
import {
  HALLUCINATION_DRAIN_FACTOR,
  HALLUCINATION_GROWTH_RATE,
  HYPE_DECAY_PER_SECOND,
} from '../../lib/constants';
import type { BuildingManager } from '../buildings/BuildingManager';
import type { UpgradeManager } from '../upgrades/UpgradeManager';
import type { GameState } from '../state/GameState';

export class ResourceManager {
  constructor(
    private buildings: BuildingManager,
    private upgrades: UpgradeManager
  ) {}

  /** Tokens/s efetivos (com todos os multiplicadores). */
  getEffectiveTokenRate(state: GameState): number {
    const baseRate = this.buildings.getTotalProduction(state);
    const mult = this.upgrades.getTokensMultiplier(state);
    const eraMult = this.getEraMultiplier(state);
    const prestigeMult = 1 + state.insightPoints * 0.05;
    const hallucinationDrain = state.resources.hallucinations * HALLUCINATION_DRAIN_FACTOR;
    const gross = baseRate * mult * eraMult * prestigeMult;
    return Math.max(0, gross - gross * hallucinationDrain);
  }

  /** Compute/s — 30% da produção de tokens. */
  getComputeRate(state: GameState): number {
    return this.getEffectiveTokenRate(state) * 0.3;
  }

  /** Hype/s — gain base dos upgrades + log do token rate. */
  getHypeRate(state: GameState): number {
    const fromUpgrades = this.upgrades.getHypeGain(state);
    const fromProduction = Math.log10(Math.max(1, this.getEffectiveTokenRate(state))) * 0.5;
    return fromUpgrades + fromProduction;
  }

  /** Funding/s — gerado pelo hype com multiplicador. */
  getFundingRate(state: GameState): number {
    const hype = state.resources.hype;
    const mult = this.upgrades.getFundingMultiplier(state);
    return Math.log10(Math.max(1, hype)) * 10 * mult;
  }

  /** Multiplicador da era atual. */
  private getEraMultiplier(state: GameState): number {
    const def = ERAS_BY_ID[state.era];
    return def?.productionMultiplier ?? 1;
  }

  /**
   * Um tick: aplica produção/consumo pros 6 recursos.
   * delta em segundos.
   */
  tick(state: GameState, delta: number): void {
    const tokenRate = this.getEffectiveTokenRate(state);
    const computeRate = this.getComputeRate(state);
    const hypeRate = this.getHypeRate(state);
    const fundingRate = this.getFundingRate(state);

    const tokens = tokenRate * delta;
    state.resources.tokens += tokens;
    state.totalTokensEarned += tokens;
    state.resources.compute += computeRate * delta;

    // Hype com decay
    state.resources.hype += hypeRate * delta;
    state.resources.hype *= Math.pow(1 - HYPE_DECAY_PER_SECOND, delta);
    if (state.resources.hype < 0) state.resources.hype = 0;

    // Funding acumulado do hype
    state.resources.funding += fundingRate * delta;

    // Alucinações crescem com a produção gross
    const baseGrowth = tokenRate * HALLUCINATION_GROWTH_RATE * delta;
    const reduction = this.upgrades.getHallucinationReduction(state);
    state.resources.hallucinations += baseGrowth * (1 - reduction);
    // Cap em 1.0 (100% drain)
    if (state.resources.hallucinations > 1) state.resources.hallucinations = 1;

    // Data acumula lentamente proporcional ao compute
    state.resources.data += computeRate * 0.01 * delta;
  }

  /** Adiciona tokens manualmente (clique). */
  addTokens(state: GameState, amount: number): void {
    state.resources.tokens += amount;
    state.totalTokensEarned += amount;
  }
}
