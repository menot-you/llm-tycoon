/**
 * Box — caixa ASCII com bordas Unicode ou custom.
 */

import type { Grid } from "../Grid";

export interface BorderSet {
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
  horizontal: string;
  vertical: string;
}

export const LIGHT_BORDERS: BorderSet = {
  topLeft: "┌",
  topRight: "┐",
  bottomLeft: "└",
  bottomRight: "┘",
  horizontal: "─",
  vertical: "│",
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
  options: BoxOptions = {},
): void {
  if (width < 2 || height < 2) return;
  const b = options.border ?? LIGHT_BORDERS;

  grid.setChar(x, y, b.topLeft);
  grid.setChar(x + width - 1, y, b.topRight);
  grid.setChar(x, y + height - 1, b.bottomLeft);
  grid.setChar(x + width - 1, y + height - 1, b.bottomRight);

  for (let i = 1; i < width - 1; i++) {
    grid.setChar(x + i, y, b.horizontal);
    grid.setChar(x + i, y + height - 1, b.horizontal);
  }
  for (let j = 1; j < height - 1; j++) {
    grid.setChar(x, y + j, b.vertical);
    grid.setChar(x + width - 1, y + j, b.vertical);
  }

  if (options.title && width > options.title.length + 4) {
    grid.writeText(x + 2, y, ` ${options.title} `);
  }
}
