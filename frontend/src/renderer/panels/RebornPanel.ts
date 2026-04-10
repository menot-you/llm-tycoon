/**
 * RebornPanel — modal com status do reborn + lista de perks.
 */

import type { RebornManager } from '../../engine/reborn/RebornManager';
import type { GameState } from '../../engine/state/GameState';
import { formatInt } from '../../lib/numbers';
import type { Grid } from '../Grid';
import type { BorderSet } from '../themes';
import { drawBox } from '../widgets/Box';
import { drawButton, type ButtonHitBox } from '../widgets/Button';

export function drawRebornPanel(
  grid: Grid,
  x: number,
  y: number,
  width: number,
  height: number,
  state: GameState,
  reborn: RebornManager,
  hoveredId: string | null,
  border?: BorderSet
): ButtonHitBox[] {
  drawBox(grid, x, y, width, height, { title: 'REBORN', border });

  const hitboxes: ButtonHitBox[] = [];
  const innerX = x + 2;
  const innerRight = x + width - 2;

  // Header: stats
  grid.writeText(innerX, y + 2, `Reborn Count: ${state.rebornCount}`);
  grid.writeText(innerX + 24, y + 2, `Reborn Points: ${state.rebornPoints}`);
  grid.writeText(
    innerX + 52,
    y + 2,
    `ML Steps: ${state.mlStepsTrained}`
  );

  grid.writeText(
    innerX,
    y + 3,
    `Total Prestiges (all time): ${state.totalPrestigesAllTime + state.prestigeCount}`
  );

  const preview = reborn.previewPoints(state);
  if (reborn.canReborn(state)) {
    grid.writeText(innerX, y + 5, `▶ Reborn agora: +${preview} RP (reseta TUDO, mantém perks + ML)`);
    const hb = drawButton(grid, innerRight - 18, y + 5, 'REBORN NOW', 'reborn:go', {
      hovered: hoveredId === 'reborn:go',
    });
    hitboxes.push(hb);
  } else {
    grid.writeText(
      innerX,
      y + 5,
      '✗ Requer Era 7+ OU 3+ prestiges na run atual'
    );
  }

  // Perks list
  let row = y + 7;
  grid.writeText(innerX, row, '── Permanent Perks ──');
  row += 1;
  const maxRow = y + height - 2;

  for (const def of reborn.listAll()) {
    if (row >= maxRow - 1) break;
    const stacks = reborn.getStacks(state, def.id);
    const canBuy = reborn.canBuy(state, def);
    const status = def.maxStacks
      ? ` [${stacks}/${def.maxStacks}]`
      : stacks > 0
        ? ` [${stacks}]`
        : '';
    grid.writeText(innerX, row, `${def.name}${status}`);
    grid.writeText(
      innerX,
      row + 1,
      def.description.substring(0, width - 20)
    );

    const id = `perk:${def.id}`;
    const label = `${def.cost}RP`;
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

export function parsePerkButtonId(id: string): string | null {
  if (!id.startsWith('perk:')) return null;
  return id.slice('perk:'.length);
}
