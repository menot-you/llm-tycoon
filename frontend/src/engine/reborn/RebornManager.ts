/**
 * RebornManager — segundo layer de progressão.
 *
 * Reset total de resources + buildings + upgrades + permanents, mas preserva
 * rebornCount, rebornPoints, unlockedPerks e mlStepsTrained.
 *
 * O "killer feature" é a integração com o ML service Python: os weights
 * do nano-transformer persistem entre reborns, então cada reborn começa
 * com um modelo mais inteligente.
 */

import { PERKS, PERKS_BY_ID, type PerkDef } from '../../data/perks';
import { createInitialState, type GameState } from '../state/GameState';

export interface RebornResult {
  rpGained: number;
  newRebornCount: number;
}

export class RebornManager {
  /**
   * RP ganho num reborn:
   *   RP = floor(sqrt(totalPrestigesAllTime * max_era_reached))
   *
   * Você precisa ter atingido pelo menos era 7 OU 3 prestiges no run atual
   * pra poder rebornar.
   */
  previewPoints(state: GameState): number {
    const maxEra = Math.max(state.era, 1);
    const totalPrestiges = state.totalPrestigesAllTime + state.prestigeCount;
    return Math.floor(Math.sqrt(totalPrestiges * maxEra));
  }

  canReborn(state: GameState): boolean {
    if (state.era < 7 && state.prestigeCount < 3) return false;
    return this.previewPoints(state) >= 1;
  }

  /**
   * Executa o reborn:
   * - Soma prestigeCount ao totalPrestigesAllTime
   * - Gera RP
   * - Reset completo, preserva rebornCount/Points/Perks/ML
   * - Aplica perk effects de início (start_ip, second_wind, etc)
   */
  reborn(state: GameState): RebornResult {
    const rpGained = this.previewPoints(state);
    if (rpGained < 1) return { rpGained: 0, newRebornCount: state.rebornCount };

    // Preserva
    const preserved = {
      rebornCount: state.rebornCount + 1,
      rebornPoints: state.rebornPoints + rpGained,
      unlockedPerks: [...state.unlockedPerks],
      totalPrestigesAllTime: state.totalPrestigesAllTime + state.prestigeCount,
      mlStepsTrained: state.mlStepsTrained,
      mlCapabilityScore: state.mlCapabilityScore,
      playerId: state.playerId,
      displayName: state.displayName,
    };

    // Reset completo
    const fresh = createInitialState();
    Object.assign(fresh, preserved);

    // Aplica start bonuses dos perks
    this.applyStartBonuses(fresh);

    // Copia pro state in-place
    Object.assign(state, fresh);

    return { rpGained, newRebornCount: preserved.rebornCount };
  }

  private applyStartBonuses(state: GameState): void {
    for (const id of state.unlockedPerks) {
      const def = PERKS_BY_ID[id];
      if (!def) continue;
      if (def.effect === 'start_ip') {
        state.insightPoints += def.value;
      } else if (def.effect === 'second_wind') {
        state.buildings.ifelse_bot = (state.buildings.ifelse_bot ?? 0) + 3;
        state.buildings.markov_chain = (state.buildings.markov_chain ?? 0) + 2;
      }
    }
  }

  getStacks(state: GameState, id: string): number {
    return state.unlockedPerks.filter((x) => x === id).length;
  }

  canBuy(state: GameState, def: PerkDef): boolean {
    if (state.rebornPoints < def.cost) return false;
    const stacks = this.getStacks(state, def.id);
    if (def.maxStacks && stacks >= def.maxStacks) return false;
    return true;
  }

  buyPerk(state: GameState, id: string): boolean {
    const def = PERKS_BY_ID[id];
    if (!def) return false;
    if (!this.canBuy(state, def)) return false;
    state.rebornPoints -= def.cost;
    state.unlockedPerks.push(id);
    return true;
  }

  listAll(): PerkDef[] {
    return PERKS;
  }

  // ============================================================
  // Perk effect accessors (chamados pelo ResourceManager/GameEngine)
  // ============================================================

  /** Multiplicador de produção vindo do ML memory. */
  getNeuralMultiplier(state: GameState): number {
    let mult = 1;
    for (const id of state.unlockedPerks) {
      const def = PERKS_BY_ID[id];
      if (def?.effect === 'neural_mult') {
        mult *= 1 + def.value * state.mlStepsTrained;
      }
    }
    return mult;
  }

  /** Multiplicador composto por reborn count. */
  getCompoundPrestigeMultiplier(state: GameState): number {
    let rate = 0;
    for (const id of state.unlockedPerks) {
      const def = PERKS_BY_ID[id];
      if (def?.effect === 'compound_prestige') rate += def.value;
    }
    return Math.pow(1 + rate, state.rebornCount);
  }

  /** Tokens/s automáticos vindos do auto_click perk. */
  getAutoClickRate(state: GameState): number {
    let total = 0;
    for (const id of state.unlockedPerks) {
      const def = PERKS_BY_ID[id];
      if (def?.effect === 'auto_click') total += def.value;
    }
    return total;
  }

  /** Tokens extra por clique. */
  getClickBonus(state: GameState): number {
    let total = 0;
    for (const id of state.unlockedPerks) {
      const def = PERKS_BY_ID[id];
      if (def?.effect === 'click_multi') total += def.value;
    }
    return total;
  }

  /** Fator de desconto em custo de buildings (0-0.95). */
  getBuildingDiscount(state: GameState): number {
    let total = 0;
    for (const id of state.unlockedPerks) {
      const def = PERKS_BY_ID[id];
      if (def?.effect === 'cheaper_buildings') total += def.value;
    }
    return Math.min(0.95, total);
  }

  /** Desconto no threshold de avanço de era (0-0.9). */
  getEraDiscount(state: GameState): number {
    let total = 0;
    for (const id of state.unlockedPerks) {
      const def = PERKS_BY_ID[id];
      if (def?.effect === 'era_discount') total += def.value;
    }
    return Math.min(0.9, total);
  }

  /** Se o player tem Offline Master. */
  hasOfflineMaster(state: GameState): boolean {
    return state.unlockedPerks.includes('offline_master');
  }

  hasOracle(state: GameState): boolean {
    return state.unlockedPerks.includes('oracle');
  }
}
