/**
 * EraProgress — barra de progresso pra próxima era.
 */

import type { EraManager } from '../../engine/eras/EraManager';
import type { GameState } from '../../engine/state/GameState';
import { ERAS_BY_ID } from '../../data/eras';
import { formatInt } from '../../lib/numbers';
import type { Grid } from '../Grid';
import { drawProgressBar } from '../widgets/ProgressBar';

export function drawEraProgress(
  grid: Grid,
  x: number,
  y: number,
  width: number,
  state: GameState,
  eras: EraManager
): void {
  const progress = eras.progressToNext(state);
  const current = ERAS_BY_ID[state.era];
  const nextId = state.era < 8 ? state.era + 1 : null;
  const next = nextId ? ERAS_BY_ID[nextId as 1] : null;

  const label = next
    ? `${current.title} → ${next.title}`
    : `${current.title} (máximo)`;
  grid.writeText(x, y, label.substring(0, width));

  drawProgressBar(grid, x, y + 1, width, progress, { showPercent: true });

  if (next) {
    const info = `${formatInt(state.totalTokensEarned)} / ${formatInt(next.unlockThreshold)} tokens earned`;
    grid.writeText(x, y + 2, info.substring(0, width));
  }
}
