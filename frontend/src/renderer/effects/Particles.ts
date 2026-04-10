/**
 * Particles — tokens voando como efeito visual ASCII.
 *
 * Cada partícula é um char que sobe + decai com o tempo.
 */

import type { Grid } from '../Grid';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  char: string;
}

const CHARS = ['*', '+', '·', '•', 'T', 'K'];

export class ParticleSystem {
  private particles: Particle[] = [];

  spawn(x: number, y: number, count = 5): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 8 - 4,
        age: 0,
        life: 0.6 + Math.random() * 0.4,
        char: CHARS[Math.floor(Math.random() * CHARS.length)],
      });
    }
  }

  update(delta: number): void {
    for (const p of this.particles) {
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.vy += 20 * delta; // gravidade
      p.age += delta;
    }
    this.particles = this.particles.filter((p) => p.age < p.life);
  }

  draw(grid: Grid): void {
    for (const p of this.particles) {
      const col = Math.floor(p.x);
      const row = Math.floor(p.y);
      grid.setChar(col, row, p.char);
    }
  }

  clear(): void {
    this.particles = [];
  }

  get count(): number {
    return this.particles.length;
  }
}
