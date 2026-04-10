/**
 * UpgradeManager — compra e aplica efeitos de upgrades.
 *
 * Os efeitos são aplicados multiplicativamente no ResourceManager.
 */

import { UPGRADES, UPGRADES_BY_ID, type UpgradeDef } from '../../data/upgrades';
import type { GameState } from '../state/GameState';

export interface BuyUpgradeResult {
  success: boolean;
  reason?: string;
}

export class UpgradeManager {
  /** Lista os upgrades disponíveis pra comprar agora (era compatível, não comprados). */
  getAvailable(state: GameState): UpgradeDef[] {
    return UPGRADES.filter(
      (u) => state.era >= u.eraRequired && !state.upgrades.includes(u.id)
    );
  }

  has(state: GameState, id: string): boolean {
    return state.upgrades.includes(id);
  }

  canAfford(state: GameState, id: string): boolean {
    const def = UPGRADES_BY_ID[id];
    if (!def) return false;
    if (state.era < def.eraRequired) return false;
    if (state.upgrades.includes(id)) return false;
    return state.resources[def.costResource] >= def.cost;
  }

  buy(state: GameState, id: string): BuyUpgradeResult {
    const def = UPGRADES_BY_ID[id];
    if (!def) return { success: false, reason: 'upgrade inexistente' };
    if (state.upgrades.includes(id)) return { success: false, reason: 'já comprado' };
    if (state.era < def.eraRequired) {
      return { success: false, reason: `requer era ${def.eraRequired}` };
    }
    if (state.resources[def.costResource] < def.cost) {
      return { success: false, reason: 'recursos insuficientes' };
    }

    state.resources[def.costResource] -= def.cost;
    state.upgrades.push(id);
    return { success: true };
  }

  /** Multiplicador de tokens derivado de todos os upgrades de tokens_mult. */
  getTokensMultiplier(state: GameState): number {
    let mult = 1;
    for (const id of state.upgrades) {
      const def = UPGRADES_BY_ID[id];
      if (!def) continue;
      for (const eff of def.effects) {
        if (eff.kind === 'tokens_mult') mult *= eff.value;
      }
    }
    return mult;
  }

  /** Fator de redução de alucinação acumulado (0 a 0.95). */
  getHallucinationReduction(state: GameState): number {
    let reduction = 0;
    for (const id of state.upgrades) {
      const def = UPGRADES_BY_ID[id];
      if (!def) continue;
      for (const eff of def.effects) {
        if (eff.kind === 'hallucination_reduction') {
          reduction += eff.value;
        }
      }
    }
    return Math.min(0.95, reduction);
  }

  /** Bonus de hype por segundo dos upgrades. */
  getHypeGain(state: GameState): number {
    let gain = 0;
    for (const id of state.upgrades) {
      const def = UPGRADES_BY_ID[id];
      if (!def) continue;
      for (const eff of def.effects) {
        if (eff.kind === 'hype_gain') gain += eff.value;
      }
    }
    return gain;
  }

  /** Multiplicador de funding. */
  getFundingMultiplier(state: GameState): number {
    let mult = 1;
    for (const id of state.upgrades) {
      const def = UPGRADES_BY_ID[id];
      if (!def) continue;
      for (const eff of def.effects) {
        if (eff.kind === 'funding_mult') mult *= eff.value;
      }
    }
    return mult;
  }
}
