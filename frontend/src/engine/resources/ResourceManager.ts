/**
 * ResourceManager — aplica produção/consumo de recursos por tick.
 *
 * Wave 1: só tokens. Wave 2 expande pra 6 recursos.
 */

import type { GameState } from '../state/GameState';
import type { BuildingManager } from '../buildings/BuildingManager';

export class ResourceManager {
  constructor(private buildings: BuildingManager) {}

  /**
   * Aplica um tick de produção. delta em segundos.
   * Tokens produzidos = tokens/s × delta.
   */
  tick(state: GameState, delta: number): void {
    const tokensPerSecond = this.buildings.getTotalProduction(state);
    const produced = tokensPerSecond * delta;
    state.resources.tokens += produced;
    state.totalTokensEarned += produced;
  }

  /** Adiciona tokens manualmente (clique do player, etc). */
  addTokens(state: GameState, amount: number): void {
    state.resources.tokens += amount;
    state.totalTokensEarned += amount;
  }
}
