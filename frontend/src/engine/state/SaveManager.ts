/**
 * SaveManager — persiste GameState em localStorage.
 *
 * Auto-save a cada N segundos. Migrations por version field.
 * Calcula offline progress no load.
 */

import { AUTO_SAVE_INTERVAL_MS } from '../../lib/constants';
import { createInitialState, SAVE_VERSION, type GameState } from './GameState';

const STORAGE_KEY = 'llm-tycoon-save-v1';

export class SaveManager {
  private autoSaveInterval: ReturnType<typeof setInterval> | null = null;

  load(): GameState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createInitialState();
      const parsed = JSON.parse(raw) as GameState;
      return this.migrate(parsed);
    } catch (err) {
      console.error('Failed to load save, starting fresh:', err);
      return createInitialState();
    }
  }

  save(state: GameState): void {
    try {
      state.lastTick = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('Failed to save:', err);
    }
  }

  startAutoSave(getState: () => GameState): void {
    this.stopAutoSave();
    this.autoSaveInterval = setInterval(() => {
      this.save(getState());
    }, AUTO_SAVE_INTERVAL_MS);
  }

  stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  wipe(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /** Migra saves antigos pra versão atual. */
  private migrate(state: GameState): GameState {
    if (state.version === SAVE_VERSION) return state;

    // v1 -> v2: adiciona campos de reborn
    if (state.version === 1) {
      const migrated: GameState = {
        ...createInitialState(),
        ...state,
        version: 2,
        rebornCount: 0,
        rebornPoints: 0,
        unlockedPerks: [],
        totalPrestigesAllTime: state.prestigeCount ?? 0,
        mlStepsTrained: 0,
        mlCapabilityScore: 0,
      };
      return migrated;
    }

    console.warn(`Save version ${state.version} ≠ ${SAVE_VERSION}, resetando`);
    return createInitialState();
  }
}
