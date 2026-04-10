/**
 * Matrix rain — efeito background sutil.
 *
 * Colunas de chars aleatórios caindo. Renderizado no grid antes dos panels.
 */

import type { Grid } from '../Grid';

const CHARS = '01{}[]()<>+-=*/?!@#$%&アイウエオカキクケコ';

interface Drop {
  col: number;
  y: number;
  speed: number;
  length: number;
}

export class MatrixRain {
  private drops: Drop[] = [];
  private densityPct: number;

  constructor(
    private cols: number,
    private rows: number,
    densityPct = 0.15
  ) {
    this.densityPct = densityPct;
    const dropCount = Math.floor(cols * densityPct);
    for (let i = 0; i < dropCount; i++) {
      this.spawnDrop();
    }
  }

  private spawnDrop(): void {
    this.drops.push({
      col: Math.floor(Math.random() * this.cols),
      y: -Math.floor(Math.random() * this.rows),
      speed: 3 + Math.random() * 8,
      length: 2 + Math.floor(Math.random() * 5),
    });
  }

  update(delta: number): void {
    for (const d of this.drops) {
      d.y += d.speed * delta;
      if (d.y - d.length > this.rows) {
        d.col = Math.floor(Math.random() * this.cols);
        d.y = -Math.floor(Math.random() * 10);
        d.speed = 3 + Math.random() * 8;
      }
    }
  }

  /** Desenha apenas nos chars que ainda estão vazios (não sobrescreve UI). */
  draw(grid: Grid): void {
    for (const d of this.drops) {
      for (let i = 0; i < d.length; i++) {
        const row = Math.floor(d.y) - i;
        if (row < 0 || row >= this.rows) continue;
        const existing = grid.getChar(d.col, row);
        if (existing !== ' ') continue; // não sobrescreve UI
        const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
        grid.setChar(d.col, row, ch);
      }
    }
  }

  resize(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
    this.drops = [];
    const dropCount = Math.floor(cols * this.densityPct);
    for (let i = 0; i < dropCount; i++) {
      this.spawnDrop();
    }
  }
}
