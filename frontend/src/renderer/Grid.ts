/**
 * Grid — buffer 2D de caracteres ASCII.
 *
 * É a abstração core do renderer. Panels e widgets escrevem chars
 * no grid, e o AsciiRenderer converte o grid em texto desenhado no Canvas.
 *
 * Dirty tracking permite skip de re-render quando nada mudou.
 */

const SPACE = ' ';

export class Grid {
  private buffer: string[][];
  private dirty = false;

  constructor(
    public cols: number,
    public rows: number
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

  /** Lê um caractere. Fora dos limites retorna espaço. */
  getChar(x: number, y: number): string {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return SPACE;
    return this.buffer[y][x];
  }

  /** Escreve um caractere. Fora dos limites é noop. */
  setChar(x: number, y: number, ch: string): void {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return;
    if (this.buffer[y][x] !== ch) {
      this.buffer[y][x] = ch;
      this.dirty = true;
    }
  }

  /** Escreve uma string horizontal. Trunca se ultrapassar a largura. */
  writeText(x: number, y: number, text: string): void {
    for (let i = 0; i < text.length; i++) {
      this.setChar(x + i, y, text[i]);
    }
  }

  /** Limpa o grid pra espaços. */
  clear(): void {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        this.buffer[y][x] = SPACE;
      }
    }
    this.dirty = true;
  }

  /** True se algum char foi alterado desde o último markRendered. */
  isDirty(): boolean {
    return this.dirty;
  }

  /** Marca o grid como renderizado (limpa flag dirty). */
  markRendered(): void {
    this.dirty = false;
  }

  /** Exporta as linhas como array de strings. */
  toLines(): string[] {
    return this.buffer.map((row) => row.join(''));
  }

  /**
   * Redimensiona o grid preservando o conteúdo que ainda cabe.
   * Útil pra responsive (window resize).
   */
  resize(newCols: number, newRows: number): void {
    const oldBuffer = this.buffer;
    const oldCols = this.cols;
    const oldRows = this.rows;

    this.buffer = Grid.makeBuffer(newCols, newRows);
    this.cols = newCols;
    this.rows = newRows;
    this.dirty = true;

    const copyCols = Math.min(oldCols, newCols);
    const copyRows = Math.min(oldRows, newRows);
    for (let y = 0; y < copyRows; y++) {
      for (let x = 0; x < copyCols; x++) {
        this.buffer[y][x] = oldBuffer[y][x];
      }
    }
  }
}
