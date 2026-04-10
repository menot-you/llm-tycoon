/**
 * PrestigePanel — mostra IP atual, preview de pontos, lista de permanent upgrades.
 */

import type { PrestigeManager } from '../../engine/prestige/PrestigeManager';
import type { GameState } from '../../engine/state/GameState';
import { formatInt } from '../../lib/numbers';
import type { Grid } from '../Grid';
import { drawBox } from '../widgets/Box';
import { drawButton, type ButtonHitBox } from '../widgets/Button';

export function drawPrestigePanel(
  grid: Grid,
  x: number,
  y: number,
  width: number,
  height: number,
  state: GameState,
  prestige: PrestigeManager,
  hoveredId: string | null
): ButtonHitBox[] {
  drawBox(grid, x, y, width, height, { title: 'PRESTIGE' });

  const hitboxes: ButtonHitBox[] = [];
  const innerX = x + 2;
  const innerRight = x + width - 2;

  grid.writeText(innerX, y + 2, `Insight Points: ${state.insightPoints}`);
  grid.writeText(innerX, y + 3, `Prestige count: ${state.prestigeCount}`);
  const preview = prestige.previewPoints(state);
  grid.writeText(innerX, y + 4, `Se prestigiar agora: +${preview} IP`);

  if (prestige.canPrestige(state)) {
    const hb = drawButton(grid, innerRight - 18, y + 4, 'NEW PARADIGM', 'prestige:go', {
      hovered: hoveredId === 'prestige:go',
    });
    hitboxes.push(hb);
  } else {
    const needed = formatInt(1_000_000);
    grid.writeText(innerRight - 30, y + 4, `(precisa ${needed} total tokens)`);
  }

  // Permanent upgrades list
  let row = y + 6;
  grid.writeText(innerX, row, '── Permanent Upgrades ──');
  row += 1;
  const maxRow = y + height - 2;

  for (const def of prestige.listAll()) {
    if (row >= maxRow) break;
    const stacks = prestige.getStacks(state, def.id);
    const canBuy = prestige.canBuy(state, def);
    const status = def.maxStacks
      ? ` [${stacks}/${def.maxStacks}]`
      : stacks > 0
        ? ` [${stacks}]`
        : '';
    grid.writeText(innerX, row, `${def.name}${status}`);
    grid.writeText(innerX, row + 1, def.description.substring(0, width - 6));

    const id = `perm:${def.id}`;
    const label = `${def.cost}IP`;
    const buttonWidth = label.length + 4;
    const buttonX = innerRight - buttonWidth;
    const hb = drawButton(grid, buttonX, row, label, id, {
      hovered: hoveredId === id,
      disabled: !canBuy,
    });
    hitboxes.push(hb);
    row += 3;
  }

  return hitboxes;
}

export function parsePermanentUpgradeId(id: string): string | null {
  if (!id.startsWith('perm:')) return null;
  return id.slice('perm:'.length);
}
