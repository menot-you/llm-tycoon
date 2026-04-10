/**
 * ResourceBar — barra superior com tokens, tokens/s, era.
 */

import type { GameState } from '../../engine/state/GameState';
import { ERAS_BY_ID } from '../../data/eras';
import { formatInt, formatRate } from '../../lib/numbers';
import type { Grid } from '../Grid';
import { drawBox } from '../widgets/Box';

export function drawResourceBar(
  grid: Grid,
  x: number,
  y: number,
  width: number,
  state: GameState,
  productionPerSecond: number
): void {
  drawBox(grid, x, y, width, 3);

  const era = ERAS_BY_ID[state.era];
  const tokens = `Tokens: ${formatInt(state.resources.tokens)}`;
  const rate = `(${formatRate(productionPerSecond)})`;
  const eraText = `Era ${state.era}/8 — ${era.name}`;

  grid.writeText(x + 2, y + 1, tokens);
  grid.writeText(x + 2 + tokens.length + 1, y + 1, rate);
  grid.writeText(x + width - 2 - eraText.length, y + 1, eraText);
}
