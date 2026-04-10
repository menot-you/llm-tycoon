/**
 * ProgressBar — barra ASCII com chars Unicode block.
 *
 * ████████████░░░░░░░░ 60%
 */

import type { Grid } from '../Grid';

const FILLED = '█';
const EMPTY = '░';

export interface ProgressBarOptions {
  showPercent?: boolean;
  filledChar?: string;
  emptyChar?: string;
}

export function drawProgressBar(
  grid: Grid,
  x: number,
  y: number,
  width: number,
  progress: number, // 0-1
  options: ProgressBarOptions = {}
): void {
  const filled = options.filledChar ?? FILLED;
  const empty = options.emptyChar ?? EMPTY;
  const showPercent = options.showPercent ?? false;

  const clamped = Math.max(0, Math.min(1, progress));

  const barWidth = showPercent ? width - 5 : width; // " 100%" = 5 chars
  if (barWidth <= 0) return;

  const filledCount = Math.floor(clamped * barWidth);

  for (let i = 0; i < barWidth; i++) {
    grid.setChar(x + i, y, i < filledCount ? filled : empty);
  }

  if (showPercent) {
    const pct = Math.floor(clamped * 100);
    const pctStr = pct === 100 ? '100%' : ` ${pct.toString().padStart(2, ' ')}%`;
    grid.writeText(x + barWidth + 1, y, pctStr);
  }
}
