/**
 * AsciiRenderer — desenha o Grid no Canvas via fillText().
 *
 * Usa monospace font, então cada char tem largura/altura fixa.
 * Pretext é usado pra medir o cellWidth uma única vez (zero DOM reflow).
 */

import { FONT_SIZE, LINE_HEIGHT, MONOSPACE_FONT } from '../lib/constants';
import type { Grid } from './Grid';
import { themeForEra, type EraTheme } from './themes';

export class AsciiRenderer {
  private ctx: CanvasRenderingContext2D;
  private cellWidth = 0;
  private cellHeight = 0;
  private dpr: number;
  theme: EraTheme;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2d context not available');
    this.ctx = ctx;
    this.dpr = window.devicePixelRatio || 1;
    this.theme = themeForEra(1);
    this.measureCell();
  }

  setTheme(theme: EraTheme): void {
    this.theme = theme;
  }

  /** Mede o tamanho de uma célula char usando o ctx do canvas. */
  private measureCell(): void {
    this.ctx.font = `${this.theme.fontWeight} ${FONT_SIZE}px ${MONOSPACE_FONT}`;
    const metrics = this.ctx.measureText('M');
    this.cellWidth = metrics.width;
    this.cellHeight = FONT_SIZE * LINE_HEIGHT;
  }

  /**
   * Ajusta o tamanho do canvas em pixels para caber `cols × rows` chars.
   * Aplica devicePixelRatio para HiDPI.
   */
  resizeForGrid(cols: number, rows: number): void {
    const cssWidth = Math.ceil(cols * this.cellWidth);
    const cssHeight = Math.ceil(rows * this.cellHeight);

    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;
    this.canvas.width = Math.floor(cssWidth * this.dpr);
    this.canvas.height = Math.floor(cssHeight * this.dpr);

    this.ctx.scale(this.dpr, this.dpr);
    this.ctx.font = `${this.theme.fontWeight} ${FONT_SIZE}px ${MONOSPACE_FONT}`;
    this.ctx.textBaseline = 'top';
  }

  /** Desenha o grid completo no canvas. */
  render(grid: Grid): void {
    // Background
    this.ctx.fillStyle = this.theme.background;
    this.ctx.fillRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);

    // Foreground text
    this.ctx.fillStyle = this.theme.foreground;
    this.ctx.font = `${this.theme.fontWeight} ${FONT_SIZE}px ${MONOSPACE_FONT}`;
    this.ctx.textBaseline = 'top';

    const lines = grid.toLines();
    for (let y = 0; y < lines.length; y++) {
      this.ctx.fillText(lines[y], 0, y * this.cellHeight);
    }

    grid.markRendered();
  }

  /** Converte coordenadas pixel → grid cell. Útil pro InputManager. */
  pixelToCell(px: number, py: number): { col: number; row: number } {
    return {
      col: Math.floor(px / this.cellWidth),
      row: Math.floor(py / this.cellHeight),
    };
  }

  getCellSize(): { width: number; height: number } {
    return { width: this.cellWidth, height: this.cellHeight };
  }
}
