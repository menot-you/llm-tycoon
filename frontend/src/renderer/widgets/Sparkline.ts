/**
 * Sparkline — mini gráfico ASCII usando chars Unicode block.
 *
 * Exemplo: ▁▂▃▅▆█▇▅▃▂
 */

import type { Grid } from '../Grid';

const BLOCKS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

export function drawSparkline(
  grid: Grid,
  x: number,
  y: number,
  width: number,
  values: number[]
): void {
  if (values.length === 0 || width <= 0) return;

  const start = Math.max(0, values.length - width);
  const window = values.slice(start);
  const max = Math.max(...window, 1);
  const min = Math.min(...window, 0);
  const range = max - min || 1;

  for (let i = 0; i < width; i++) {
    if (i >= window.length) {
      grid.setChar(x + i, y, ' ');
      continue;
    }
    const v = window[i];
    const norm = (v - min) / range;
    const idx = Math.min(BLOCKS.length - 1, Math.max(0, Math.floor(norm * BLOCKS.length)));
    grid.setChar(x + i, y, BLOCKS[idx]);
  }
}
