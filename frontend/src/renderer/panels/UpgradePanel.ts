/**
 * UpgradePanel — lista de upgrades disponíveis.
 */

import type { UpgradeManager } from '../../engine/upgrades/UpgradeManager';
import type { GameState } from '../../engine/state/GameState';
import { formatInt } from '../../lib/numbers';
import type { Grid } from '../Grid';
import { drawBox } from '../widgets/Box';
import { drawButton, type ButtonHitBox } from '../widgets/Button';

export function drawUpgradePanel(
  grid: Grid,
  x: number,
  y: number,
  width: number,
  height: number,
  state: GameState,
  upgrades: UpgradeManager,
  hoveredId: string | null
): ButtonHitBox[] {
  drawBox(grid, x, y, width, height, { title: 'UPGRADES' });

  const hitboxes: ButtonHitBox[] = [];
  let row = y + 2;
  const innerX = x + 2;
  const innerRight = x + width - 2;
  const maxRow = y + height - 2;

  const available = upgrades.getAvailable(state);
  if (available.length === 0) {
    grid.writeText(innerX, row, '(nenhum upgrade disponível — avance de era)');
    return hitboxes;
  }

  for (const def of available) {
    if (row > maxRow) break;
    const name = `${def.name}`;
    grid.writeText(innerX, row, name);

    const desc = def.description;
    const descMax = innerRight - innerX - 2;
    grid.writeText(innerX, row + 1, desc.substring(0, descMax));

    const canAfford = upgrades.canAfford(state, def.id);
    const cost = `${formatInt(def.cost)} ${def.costResource}`;
    const buttonId = `upgrade:${def.id}`;
    const buttonLabel = 'BUY';
    const buttonWidth = buttonLabel.length + 4;
    const buttonX = innerRight - buttonWidth;
    const costX = buttonX - cost.length - 2;

    grid.writeText(costX, row, cost);
    const hb = drawButton(grid, buttonX, row, buttonLabel, buttonId, {
      hovered: hoveredId === buttonId,
      disabled: !canAfford,
    });
    hitboxes.push(hb);

    row += 3;
  }

  return hitboxes;
}

export function parseUpgradeButtonId(id: string): string | null {
  if (!id.startsWith('upgrade:')) return null;
  return id.slice('upgrade:'.length);
}
