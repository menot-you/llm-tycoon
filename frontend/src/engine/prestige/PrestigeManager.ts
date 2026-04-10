/**
 * PrestigeManager — reset + insight points + permanent upgrades.
 */

import {
  PERMANENT_UPGRADES,
  PERMANENT_UPGRADES_BY_ID,
  type PermanentUpgradeDef,
} from '../../data/permanentUpgrades';
import { insightPointsFromPrestige } from '../resources/formulas';
import { createInitialState, type GameState } from '../state/GameState';

export class PrestigeManager {
  /** Pontos que o player receberia se prestigiasse agora. */
  previewPoints(state: GameState): number {
    return insightPointsFromPrestige(state.totalTokensEarned);
  }

  /** True se pode prestigiar (>=1 ponto). */
  canPrestige(state: GameState): boolean {
    return this.previewPoints(state) >= 1;
  }

  /**
   * Executa prestige. Mutaciona state:
   * - reset resources, buildings, upgrades, era
   * - preserva: prestigeCount, insightPoints, permanentUpgrades, playerId, displayName
   * - aplica bônus de starting_tokens, etc.
   */
  prestige(state: GameState): { pointsGained: number } {
    const points = this.previewPoints(state);
    if (points < 1) return { pointsGained: 0 };

    const preservedPermanent = [...state.permanentUpgrades];
    const preservedInsight = state.insightPoints + points;
    const preservedPrestigeCount = state.prestigeCount + 1;
    const preservedPlayerId = state.playerId;
    const preservedName = state.displayName;

    // Reset tudo
    const fresh = createInitialState();
    fresh.permanentUpgrades = preservedPermanent;
    fresh.insightPoints = preservedInsight;
    fresh.prestigeCount = preservedPrestigeCount;
    fresh.playerId = preservedPlayerId;
    fresh.displayName = preservedName;

    // Aplica bônus de permanent upgrades no state fresh
    this.applyStartBonuses(fresh);

    // Copia props do fresh pro state in-place
    Object.assign(state, fresh);
    return { pointsGained: points };
  }

  private applyStartBonuses(state: GameState): void {
    for (const id of state.permanentUpgrades) {
      const def = PERMANENT_UPGRADES_BY_ID[id];
      if (!def) continue;
      if (def.effect === 'start_tokens') {
        state.resources.tokens += def.value;
      }
    }
  }

  /** Quanto desse permanente já foi comprado (pra stacks). */
  getStacks(state: GameState, id: string): number {
    return state.permanentUpgrades.filter((x) => x === id).length;
  }

  canBuy(state: GameState, def: PermanentUpgradeDef): boolean {
    if (state.insightPoints < def.cost) return false;
    const stacks = this.getStacks(state, def.id);
    if (def.maxStacks && stacks >= def.maxStacks) return false;
    return true;
  }

  buyPermanent(state: GameState, id: string): boolean {
    const def = PERMANENT_UPGRADES_BY_ID[id];
    if (!def) return false;
    if (!this.canBuy(state, def)) return false;
    state.insightPoints -= def.cost;
    state.permanentUpgrades.push(id);
    return true;
  }

  /** Multiplicador permanente aplicado na produção (usado pelo ResourceManager). */
  getProductionMultiplier(state: GameState): number {
    let mult = 1;
    for (const id of state.permanentUpgrades) {
      const def = PERMANENT_UPGRADES_BY_ID[id];
      if (def?.effect === 'production_mult') mult *= def.value;
    }
    return mult;
  }

  /** Bônus permanente de offline efficiency (0-0.3). */
  getOfflineBonus(state: GameState): number {
    let bonus = 0;
    for (const id of state.permanentUpgrades) {
      const def = PERMANENT_UPGRADES_BY_ID[id];
      if (def?.effect === 'offline_efficiency') bonus += def.value;
    }
    return Math.min(0.3, bonus);
  }

  /** Lista todos os permanent upgrades (com status). */
  listAll(): PermanentUpgradeDef[] {
    return PERMANENT_UPGRADES;
  }
}
