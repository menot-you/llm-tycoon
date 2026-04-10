/**
 * ResourceBar — top bar com todos os 6 recursos + era.
 */

import type { GameState } from '../../engine/state/GameState';
import { ERAS_BY_ID } from '../../data/eras';
import { formatInt, formatRate } from '../../lib/numbers';
import type { Grid } from '../Grid';
import { drawBox } from '../widgets/Box';

export interface ResourceRates {
  tokens: number;
  compute: number;
  hype: number;
  funding: number;
  hallucinationPct: number; // 0-1
}

export function drawResourceBar(
  grid: Grid,
  x: number,
  y: number,
  width: number,
  state: GameState,
  rates: ResourceRates
): void {
  drawBox(grid, x, y, width, 4);

  const era = ERAS_BY_ID[state.era];
  const eraText = `Era ${state.era}/8 — ${era.name}`;

  // Linha 1: tokens destacado + era
  const tokens = `TOKENS ${formatInt(state.resources.tokens)} ${formatRate(rates.tokens)}`;
  grid.writeText(x + 2, y + 1, tokens);
  grid.writeText(x + width - 2 - eraText.length, y + 1, eraText);

  // Linha 2: recursos secundários
  const compute = `compute ${formatInt(state.resources.compute)}`;
  const data = `data ${formatInt(state.resources.data)}`;
  const funding = `$ ${formatInt(state.resources.funding)}`;
  const hype = `hype ${formatInt(state.resources.hype)}`;
  const hallucinationPct = Math.floor(rates.hallucinationPct * 100);
  const halluc = `alucinação ${hallucinationPct}%`;

  const segments = [compute, data, funding, hype, halluc];
  const total = segments.join('  ').length;
  const startX = Math.max(x + 2, x + Math.floor((width - total) / 2));
  grid.writeText(startX, y + 2, segments.join('  '));
}
