/**
 * Glitch — substitui chars aleatórios por chars parecidos.
 *
 * Intensidade controla quantos chars são trocados por frame.
 * Usado em eras 4+ (subtil) até 8 (caótico).
 */

import type { Grid } from '../Grid';

const GLITCH_CHARS = '▓▒░█▄▀▐▌║═╬▚▞▛▜▟▙';
const ASCII_GLITCH = '!@#$%^&*()_+=-[]{}|\\<>?';

export class Glitch {
  private intensity = 0;

  setIntensity(value: number): void {
    this.intensity = Math.max(0, Math.min(1, value));
  }

  /**
   * Aplica o glitch sobre o grid. Percorre os cells dirty e troca alguns chars.
   * Nunca toca em chars de espaço (mantém layout).
   */
  apply(grid: Grid): void {
    if (this.intensity <= 0) return;

    const total = grid.cols * grid.rows;
    const swaps = Math.floor(total * this.intensity * 0.003);

    for (let i = 0; i < swaps; i++) {
      const x = Math.floor(Math.random() * grid.cols);
      const y = Math.floor(Math.random() * grid.rows);
      const current = grid.getChar(x, y);
      if (current === ' ') continue;

      const pool = Math.random() < 0.5 ? GLITCH_CHARS : ASCII_GLITCH;
      const ch = pool[Math.floor(Math.random() * pool.length)];
      grid.setChar(x, y, ch);
    }
  }
}
