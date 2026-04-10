/**
 * Leaderboard panel — top players + ações de espionagem.
 */

import type { LeaderboardEntry } from '../../network/PhoenixClient';
import { formatInt } from '../../lib/numbers';
import type { Grid } from '../Grid';
import type { BorderSet } from '../themes';
import { drawBox } from '../widgets/Box';
import { drawButton, type ButtonHitBox } from '../widgets/Button';

const ACTIONS = [
  { id: 'steal_data', label: 'STEAL' },
  { id: 'sabotage_compute', label: 'SABO' },
  { id: 'fud_campaign', label: 'FUD' },
];

export function drawLeaderboard(
  grid: Grid,
  x: number,
  y: number,
  width: number,
  height: number,
  entries: LeaderboardEntry[],
  selectedTargetId: string | null,
  status: string,
  hoveredId: string | null,
  border?: BorderSet
): ButtonHitBox[] {
  drawBox(grid, x, y, width, height, { title: `LEADERBOARD [${status}]`, border });

  const hitboxes: ButtonHitBox[] = [];
  const innerX = x + 2;
  const maxRow = y + height - 4;

  if (entries.length === 0) {
    grid.writeText(innerX, y + 2, '(waiting for leaderboard data...)');
    return hitboxes;
  }

  let row = y + 2;
  for (let i = 0; i < entries.length && row <= maxRow; i++) {
    const e = entries[i];
    const rank = `#${(i + 1).toString().padStart(2, '0')}`;
    const name = e.display_name.padEnd(14).substring(0, 14);
    const era = `E${e.era}`;
    const score = formatInt(e.capability_score).padStart(8);
    const share = `${e.market_share.toFixed(1)}%`.padStart(6);
    const selector = selectedTargetId === e.player_id ? '►' : ' ';
    const line = `${selector}${rank} ${name} ${era} ${score} ${share}`;
    grid.writeText(innerX, row, line.substring(0, width - 4));

    const targetId = `target:${e.player_id}`;
    const targetHb = drawButton(grid, x + width - 8, row, 'SEL', targetId, {
      hovered: hoveredId === targetId,
    });
    hitboxes.push(targetHb);
    row += 1;
  }

  // Ações contra o alvo selecionado
  if (selectedTargetId) {
    const actionRow = y + height - 2;
    grid.writeText(innerX, actionRow, 'ACTIONS:');
    let ax = innerX + 10;
    for (const a of ACTIONS) {
      const id = `act:${a.id}`;
      const hb = drawButton(grid, ax, actionRow, a.label, id, {
        hovered: hoveredId === id,
      });
      hitboxes.push(hb);
      ax += a.label.length + 6;
    }
  }

  return hitboxes;
}

export function parseTargetButton(id: string): string | null {
  if (!id.startsWith('target:')) return null;
  return id.slice('target:'.length);
}

export function parseActionButton(id: string): string | null {
  if (!id.startsWith('act:')) return null;
  return id.slice('act:'.length);
}
