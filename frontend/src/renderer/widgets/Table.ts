/**
 * Table — tabela ASCII com colunas alinhadas.
 *
 *   col1    col2     col3
 *   ────    ────     ────
 *   foo     bar      baz
 */

import type { Grid } from '../Grid';

export interface TableColumn {
  label: string;
  width: number;
  align?: 'left' | 'right';
}

export function drawTable(
  grid: Grid,
  x: number,
  y: number,
  columns: TableColumn[],
  rows: string[][]
): void {
  // Header
  let col = x;
  for (const c of columns) {
    const label = c.label.substring(0, c.width);
    const padded =
      c.align === 'right'
        ? label.padStart(c.width, ' ')
        : label.padEnd(c.width, ' ');
    grid.writeText(col, y, padded);
    col += c.width + 1;
  }

  // Separator
  col = x;
  for (const c of columns) {
    grid.writeText(col, y + 1, '─'.repeat(c.width));
    col += c.width + 1;
  }

  // Rows
  for (let r = 0; r < rows.length; r++) {
    col = x;
    for (let i = 0; i < columns.length; i++) {
      const c = columns[i];
      const cell = (rows[r][i] ?? '').substring(0, c.width);
      const padded =
        c.align === 'right'
          ? cell.padStart(c.width, ' ')
          : cell.padEnd(c.width, ' ');
      grid.writeText(col, y + 2 + r, padded);
      col += c.width + 1;
    }
  }
}
