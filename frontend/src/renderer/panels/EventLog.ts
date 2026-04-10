/**
 * EventLog — scrollback de eventos do jogo (buy, prestige, events aleatórios).
 */

import type { Grid } from '../Grid';
import type { BorderSet } from '../themes';
import { drawBox } from '../widgets/Box';

export interface LogEntry {
  message: string;
  timestamp: number;
  kind: 'info' | 'warn' | 'crit' | 'good';
}

const PREFIX = {
  info: '  ',
  good: '+ ',
  warn: '! ',
  crit: '✗ ',
};

export class EventLogStore {
  private entries: LogEntry[] = [];
  private max: number;

  constructor(max = 50) {
    this.max = max;
  }

  push(message: string, kind: LogEntry['kind'] = 'info'): void {
    this.entries.push({ message, timestamp: Date.now(), kind });
    if (this.entries.length > this.max) this.entries.shift();
  }

  getRecent(n: number): LogEntry[] {
    return this.entries.slice(-n);
  }

  clear(): void {
    this.entries = [];
  }
}

export function drawEventLog(
  grid: Grid,
  x: number,
  y: number,
  width: number,
  height: number,
  store: EventLogStore,
  border?: BorderSet
): void {
  drawBox(grid, x, y, width, height, { title: 'EVENTS', border });
  const rows = height - 2;
  const entries = store.getRecent(rows);
  const innerX = x + 2;
  const innerWidth = width - 4;

  // Draw bottom-up (mais recente embaixo)
  for (let i = 0; i < entries.length; i++) {
    const e = entries[entries.length - 1 - i];
    const line = `${PREFIX[e.kind]}${e.message}`;
    grid.writeText(innerX, y + height - 2 - i, line.substring(0, innerWidth));
  }
}
