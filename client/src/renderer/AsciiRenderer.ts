/**
 * AsciiRenderer — desenha o Grid no Canvas via fillText().
 *
 * Monospace font, HiDPI support via devicePixelRatio.
 */

import { FONT_SIZE, LINE_HEIGHT, MONOSPACE_FONT } from "../lib/constants";
import type { Grid } from "./Grid";

export interface Theme {
  background: string;
  foreground: string;
  accent: string;
  dim: string;
}

export const DEFAULT_THEME: Theme = {
  background: "#0a0e14",
  foreground: "#b3b1ad",
  accent: "#39bae6",
  dim: "#475266",
};

export class AsciiRenderer {
  private ctx: CanvasRenderingContext2D;
  private cellWidth = 0;
  private cellHeight = 0;
  private dpr: number;
  public theme: Theme;

  constructor(
    private canvas: HTMLCanvasElement,
    theme: Theme = DEFAULT_THEME,
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2d context not available");
    this.ctx = ctx;
    this.dpr = window.devicePixelRatio || 1;
    this.theme = theme;
    this.measureCell();
  }

  private measureCell(): void {
    this.ctx.font = `${FONT_SIZE}px ${MONOSPACE_FONT}`;
    const metrics = this.ctx.measureText("M");
    this.cellWidth = metrics.width;
    this.cellHeight = FONT_SIZE * LINE_HEIGHT;
  }

  resizeForGrid(cols: number, rows: number): void {
    const cssWidth = Math.ceil(cols * this.cellWidth);
    const cssHeight = Math.ceil(rows * this.cellHeight);

    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;
    this.canvas.width = Math.floor(cssWidth * this.dpr);
    this.canvas.height = Math.floor(cssHeight * this.dpr);

    this.ctx.scale(this.dpr, this.dpr);
    this.ctx.font = `${FONT_SIZE}px ${MONOSPACE_FONT}`;
    this.ctx.textBaseline = "top";
  }

  render(grid: Grid): void {
    this.ctx.fillStyle = this.theme.background;
    this.ctx.fillRect(
      0,
      0,
      this.canvas.width / this.dpr,
      this.canvas.height / this.dpr,
    );

    this.ctx.fillStyle = this.theme.foreground;
    this.ctx.font = `${FONT_SIZE}px ${MONOSPACE_FONT}`;
    this.ctx.textBaseline = "top";

    const lines = grid.toLines();
    for (let y = 0; y < lines.length; y++) {
      this.ctx.fillText(lines[y], 0, y * this.cellHeight);
    }
  }

  pixelToCell(px: number, py: number): { col: number; row: number } {
    return {
      col: Math.floor(px / this.cellWidth),
      row: Math.floor(py / this.cellHeight),
    };
  }
}
