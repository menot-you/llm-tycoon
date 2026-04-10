/**
 * BuildingManager — gerencia compra e produção de buildings.
 *
 * Stateless: opera sobre o GameState. Decisões de balancing vêm de
 * data/buildings.ts e formulas.ts.
 */

import { BUILDINGS_BY_ID, type BuildingId } from '../../data/buildings';
import { buildingCost, buildingProduction } from '../resources/formulas';
import type { GameState } from '../state/GameState';

export interface BuyResult {
  success: boolean;
  reason?: string;
  cost?: number;
}

export class BuildingManager {
  /** Quantos buildings desse tipo o player tem. */
  getOwned(state: GameState, id: BuildingId): number {
    return state.buildings[id] ?? 0;
  }

  /** Custo do PRÓXIMO building desse tipo. */
  getCost(state: GameState, id: BuildingId): number {
    const def = BUILDINGS_BY_ID[id];
    if (!def) return Infinity;
    const owned = this.getOwned(state, id);
    return buildingCost(def.baseCost, def.costGrowth, owned);
  }

  /** True se o player tem tokens pra comprar e a era permite. */
  canAfford(state: GameState, id: BuildingId): boolean {
    const def = BUILDINGS_BY_ID[id];
    if (!def) return false;
    if (state.era < def.eraRequired) return false;
    return state.resources.tokens >= this.getCost(state, id);
  }

  /** Compra um building. Mutaciona o state. */
  buy(state: GameState, id: BuildingId): BuyResult {
    const def = BUILDINGS_BY_ID[id];
    if (!def) return { success: false, reason: 'building inexistente' };
    if (state.era < def.eraRequired) {
      return { success: false, reason: `requer era ${def.eraRequired}` };
    }

    const cost = this.getCost(state, id);
    if (state.resources.tokens < cost) {
      return { success: false, reason: 'tokens insuficientes', cost };
    }

    state.resources.tokens -= cost;
    state.buildings[id] = (state.buildings[id] ?? 0) + 1;
    return { success: true, cost };
  }

  /** Produção total de tokens/segundo somando todos os buildings. */
  getTotalProduction(state: GameState): number {
    let total = 0;
    for (const def of Object.values(BUILDINGS_BY_ID)) {
      const owned = this.getOwned(state, def.id);
      if (owned > 0) {
        total += buildingProduction(def.baseProduction, owned);
      }
    }
    return total;
  }
}
