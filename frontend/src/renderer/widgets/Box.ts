/**
 * Box — desenha uma caixa ASCII com bordas customizáveis.
 *
 * O border charset muda por era — passado via theme.
 */

import type { Grid } from '../Grid';
import type { BorderSet } from '../themes';

const DEFAULT_BORDER: BorderSet = {
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  horizontal: '─',
  vertical: '│',
  titleDashL: '─',
  titleDashR: '─',
};

export interface BoxOptions {
  title?: string;
  border?: BorderSet;
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
  const b = options.border ?? DEFAULT_BORDER;

  // Cantos
  grid.setChar(x, y, b.topLeft);
  grid.setChar(x + width - 1, y, b.topRight);
  grid.setChar(x, y + height - 1, b.bottomLeft);
  grid.setChar(x + width - 1, y + height - 1, b.bottomRight);

  // Bordas horizontais
  for (let i = 1; i < width - 1; i++) {
    grid.setChar(x + i, y, b.horizontal);
    grid.setChar(x + i, y + height - 1, b.horizontal);
  }

  // Bordas verticais
  for (let j = 1; j < height - 1; j++) {
    grid.setChar(x, y + j, b.vertical);
    grid.setChar(x + width - 1, y + j, b.vertical);
  }

  // Title (opcional)
  if (options.title && width > options.title.length + 2) {
    grid.writeText(x + 2, y, ` ${options.title} `);
  }
}
