/**
 * Typewriter — anima texto char por char no tempo.
 */

export class Typewriter {
  private text = '';
  private elapsed = 0;
  private charsPerSecond: number;
  private done = false;

  constructor(charsPerSecond = 30) {
    this.charsPerSecond = charsPerSecond;
  }

  start(text: string): void {
    this.text = text;
    this.elapsed = 0;
    this.done = false;
  }

  update(delta: number): void {
    if (this.done) return;
    this.elapsed += delta;
    if (this.elapsed * this.charsPerSecond >= this.text.length) {
      this.done = true;
    }
  }

  /** Retorna o texto visível até agora. */
  current(): string {
    if (this.done) return this.text;
    const visibleChars = Math.floor(this.elapsed * this.charsPerSecond);
    return this.text.substring(0, visibleChars) + '▊';
  }

  isDone(): boolean {
    return this.done;
  }
}
