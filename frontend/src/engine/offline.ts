/**
 * Offline progress calculator.
 *
 * Dado o timestamp do último save, calcula quanto tempo passou e
 * credita produção proporcional com eficiência 50-80%.
 */

import {
  OFFLINE_BASE_EFFICIENCY,
  OFFLINE_MAX_EFFICIENCY,
  OFFLINE_MAX_HOURS,
} from '../lib/constants';
import type { GameState } from './state/GameState';

export interface OfflineReport {
  offlineSeconds: number;
  tokensEarned: number;
  efficiency: number;
  capped: boolean;
}

/**
 * Calcula e aplica progresso offline no state.
 * Retorna relatório pra mostrar pro player.
 */
export function applyOfflineProgress(
  state: GameState,
  tokenRatePerSecond: number,
  now: number = Date.now()
): OfflineReport {
  const elapsedMs = now - state.lastTick;
  if (elapsedMs <= 0) {
    return { offlineSeconds: 0, tokensEarned: 0, efficiency: 0, capped: false };
  }

  const maxMs = OFFLINE_MAX_HOURS * 60 * 60 * 1000;
  const cappedMs = Math.min(elapsedMs, maxMs);
  const offlineSeconds = cappedMs / 1000;
  const capped = elapsedMs > maxMs;

  // Eficiência sobe com insightPoints (max 0.8)
  const prestigeBoost = Math.min(0.3, state.insightPoints * 0.01);
  const efficiency = Math.min(OFFLINE_MAX_EFFICIENCY, OFFLINE_BASE_EFFICIENCY + prestigeBoost);

  const tokensEarned = tokenRatePerSecond * offlineSeconds * efficiency;
  state.resources.tokens += tokensEarned;
  state.totalTokensEarned += tokensEarned;
  state.lastTick = now;

  return { offlineSeconds, tokensEarned, efficiency, capped };
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h${Math.floor((seconds % 3600) / 60)}m`;
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  return `${d}d${h}h`;
}
