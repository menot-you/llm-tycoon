/**
 * BuildingPanel — lista de buildings disponíveis pra comprar.
 *
 * Cada building é uma linha com:
 * - asciiIcon + nome
 * - quantidade owned
 * - custo do próximo
 * - botão [BUY]
 *
 * Retorna a lista de hitboxes pros buttons (pro InputManager).
 */

import { BUILDINGS, type BuildingId } from '../../data/buildings';
import type { BuildingManager } from '../../engine/buildings/BuildingManager';
import type { GameState } from '../../engine/state/GameState';
import { formatInt } from '../../lib/numbers';
import type { Grid } from '../Grid';
import type { BorderSet } from '../themes';
import { drawBox } from '../widgets/Box';
import { drawButton, type ButtonHitBox } from '../widgets/Button';

export function drawBuildingPanel(
  grid: Grid,
  x: number,
  y: number,
  width: number,
  height: number,
  state: GameState,
  buildings: BuildingManager,
  hoveredId: string | null,
  border?: BorderSet
): ButtonHitBox[] {
  drawBox(grid, x, y, width, height, { title: 'BUILDINGS', border });

  const hitboxes: ButtonHitBox[] = [];
  let row = y + 2;
  const innerX = x + 2;
  const innerWidth = width - 4;

  for (const def of BUILDINGS) {
    if (row >= y + height - 1) break;
    if (state.era < def.eraRequired) {
      // Mostra como bloqueado
      const locked = `${def.asciiIcon} ${def.name}  [LOCKED — Era ${def.eraRequired}]`;
      grid.writeText(innerX, row, locked.padEnd(innerWidth).substring(0, innerWidth));
      row += 1;
      continue;
    }

    const owned = buildings.getOwned(state, def.id);
    const cost = buildings.getCost(state, def.id);
    const canAfford = buildings.canAfford(state, def.id);

    const left = `${def.asciiIcon} ${def.name}  x${owned}`;
    grid.writeText(innerX, row, left);

    const costText = `cost: ${formatInt(cost)}`;
    const buttonId = `buy:${def.id}`;
    const buttonLabel = 'BUY';
    const buttonWidth = buttonLabel.length + 4; // [►...◄]

    // Coluna do button (alinhado à direita)
    const buttonX = x + width - 2 - buttonWidth;
    const costX = buttonX - costText.length - 2;

    grid.writeText(costX, row, costText);

    const hb = drawButton(grid, buttonX, row, buttonLabel, buttonId, {
      hovered: hoveredId === buttonId,
      disabled: !canAfford,
    });
    hitboxes.push(hb);
    row += 1;
  }

  return hitboxes;
}

export function parseBuyButtonId(id: string): BuildingId | null {
  if (!id.startsWith('buy:')) return null;
  return id.slice(4) as BuildingId;
}
