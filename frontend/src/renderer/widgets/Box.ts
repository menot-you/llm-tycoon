/**
 * Box — desenha uma caixa ASCII com bordas Unicode.
 *
 *   ┌─────────┐
 *   │  Title  │
 *   ├─────────┤
 *   │ content │
 *   └─────────┘
 */

import type { Grid } from '../Grid';

const BORDERS = {
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  horizontal: '─',
  vertical: '│',
  cross: '┼',
  teeDown: '┬',
  teeUp: '┴',
  teeRight: '├',
  teeLeft: '┤',
} as const;

export interface BoxOptions {
  title?: string;
}

export function drawBox(
  grid: Grid,
  x: number,
  y: number,
  width: number,
  height: number,
  options: BoxOptions = {}
): void {
  if (width < 2 || height < 2) return;

  // Cantos
  grid.setChar(x, y, BORDERS.topLeft);
  grid.setChar(x + width - 1, y, BORDERS.topRight);
  grid.setChar(x, y + height - 1, BORDERS.bottomLeft);
  grid.setChar(x + width - 1, y + height - 1, BORDERS.bottomRight);

  // Bordas horizontais
  for (let i = 1; i < width - 1; i++) {
    grid.setChar(x + i, y, BORDERS.horizontal);
    grid.setChar(x + i, y + height - 1, BORDERS.horizontal);
  }

  // Bordas verticais
  for (let j = 1; j < height - 1; j++) {
    grid.setChar(x, y + j, BORDERS.vertical);
    grid.setChar(x + width - 1, y + j, BORDERS.vertical);
  }

  // Title (opcional)
  if (options.title && width > options.title.length + 2) {
    grid.writeText(x + 2, y, ` ${options.title} `);
  }
}
