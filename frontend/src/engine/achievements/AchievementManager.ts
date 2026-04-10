/**
 * AchievementManager — checa e desbloqueia achievements a cada tick.
 */

import {
  ACHIEVEMENTS,
  ACHIEVEMENTS_BY_ID,
  type AchievementDef,
} from '../../data/achievements';
import type { GameState } from '../state/GameState';

export interface AchievementUnlock {
  def: AchievementDef;
}

export class AchievementManager {
  /** Verifica todos os achievements não-desbloqueados. Retorna os novos. */
  check(state: GameState): AchievementUnlock[] {
    const newUnlocks: AchievementUnlock[] = [];
    for (const def of ACHIEVEMENTS) {
      if (state.achievements.includes(def.id)) continue;
      if (def.check(state)) {
        state.achievements.push(def.id);
        newUnlocks.push({ def });
      }
    }
    return newUnlocks;
  }

  /** Unlock manual (usado por easter eggs). */
  unlock(state: GameState, id: string): AchievementUnlock | null {
    if (state.achievements.includes(id)) return null;
    const def = ACHIEVEMENTS_BY_ID[id];
    if (!def) return null;
    state.achievements.push(id);
    return { def };
  }

  total(): number {
    return ACHIEVEMENTS.length;
  }

  count(state: GameState): number {
    return state.achievements.length;
  }

  listAll(): AchievementDef[] {
    return ACHIEVEMENTS;
  }
}
