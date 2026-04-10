/**
 * Grid — buffer 2D de caracteres ASCII.
 *
 * Panels/widgets escrevem chars no grid, e o AsciiRenderer desenha
 * tudo no Canvas via ctx.fillText() monospace.
 */

const SPACE = " ";

export class Grid {
  private buffer: string[][];

  constructor(
    public cols: number,
    public rows: number,
  ) {
    this.buffer = Grid.makeBuffer(cols, rows);
  }

  private static makeBuffer(cols: number, rows: number): string[][] {
    const buf: string[][] = new Array(rows);
    for (let y = 0; y < rows; y++) {
      buf[y] = new Array(cols).fill(SPACE);
    }
    return buf;
  }

  getChar(x: number, y: number): string {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return SPACE;
    return this.buffer[y][x];
  }

  setChar(x: number, y: number, ch: string): void {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return;
    this.buffer[y][x] = ch;
  }

  writeText(x: number, y: number, text: string): void {
    for (let i = 0; i < text.length; i++) {
      this.setChar(x + i, y, text[i]);
    }
  }

  clear(): void {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        this.buffer[y][x] = SPACE;
      }
    }
  }

  toLines(): string[] {
    return this.buffer.map((row) => row.join(""));
  }
}
