/**
 * ticker.ts — fixed-step game loop usando requestAnimationFrame.
 *
 * Acumula delta time e dispara N ticks/s mesmo se o framerate variar.
 * O render é separado e roda toda frame.
 */

import { TICK_DELTA, TICK_RATE } from '../lib/constants';

export type TickCallback = (delta: number) => void;
export type RenderCallback = () => void;

export class Ticker {
  private rafId = 0;
  private lastTime = 0;
  private accumulator = 0;
  private running = false;

  constructor(
    private onTick: TickCallback,
    private onRender: RenderCallback
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.loop();
  }

  stop(): void {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  private loop = (): void => {
    if (!this.running) return;

    const now = performance.now();
    let frameDelta = (now - this.lastTime) / 1000; // segundos
    this.lastTime = now;

    // Cap pra evitar spiral of death (e.g. tab voltou após horas)
    if (frameDelta > 0.25) frameDelta = 0.25;

    this.accumulator += frameDelta;

    // Fixed-step ticks
    while (this.accumulator >= TICK_DELTA) {
      this.onTick(TICK_DELTA);
      this.accumulator -= TICK_DELTA;
    }

    // Render toda frame
    this.onRender();

    this.rafId = requestAnimationFrame(this.loop);
  };

  /** Tick rate atual (debug). */
  get tickRate(): number {
    return TICK_RATE;
  }
}
