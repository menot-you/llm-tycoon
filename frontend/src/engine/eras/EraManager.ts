/**
 * EraManager — promove o player de era quando atinge o threshold.
 *
 * Emite evento quando há mudança (consumido pelo EventLog).
 */

import { ERAS, ERAS_BY_ID, type EraId } from '../../data/eras';
import type { RebornManager } from '../reborn/RebornManager';
import type { GameState } from '../state/GameState';

export interface EraAdvance {
  from: EraId;
  to: EraId;
}

export class EraManager {
  constructor(private reborn?: RebornManager) {}

  private effectiveThreshold(state: GameState, raw: number): number {
    const discount = this.reborn?.getEraDiscount(state) ?? 0;
    return raw * (1 - discount);
  }

  /** Verifica se o player pode avançar e aplica. Retorna o novo era se houve mudança. */
  checkAdvance(state: GameState): EraAdvance | null {
    const current = state.era;
    if (current >= 8) return null;

    const nextId = (current + 1) as EraId;
    const next = ERAS_BY_ID[nextId];
    if (!next) return null;

    if (state.totalTokensEarned >= this.effectiveThreshold(state, next.unlockThreshold)) {
      state.era = nextId;
      return { from: current, to: nextId };
    }
    return null;
  }

  /** Progresso pra próxima era (0-1). */
  progressToNext(state: GameState): number {
    if (state.era >= 8) return 1;
    const current = ERAS_BY_ID[state.era];
    const next = ERAS_BY_ID[(state.era + 1) as EraId];
    if (!next) return 1;
    const nextThreshold = this.effectiveThreshold(state, next.unlockThreshold);
    const currentThreshold = this.effectiveThreshold(state, current.unlockThreshold);
    const range = nextThreshold - currentThreshold;
    const progress = state.totalTokensEarned - currentThreshold;
    return Math.max(0, Math.min(1, progress / range));
  }

  getAllEras() {
    return ERAS;
  }
}
