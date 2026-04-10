/**
 * AIChatPanel — balão de chat do modelo no canto inferior.
 *
 * Usa Typewriter pra animar char por char. Texto wrapa em múltiplas linhas.
 */

import type { Typewriter } from '../effects/Typewriter';
import type { Grid } from '../Grid';
import type { BorderSet } from '../themes';
import { drawBox } from '../widgets/Box';

function wrapLines(text: string, width: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + (current ? ' ' : '') + word).length > width) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function drawAIChat(
  grid: Grid,
  x: number,
  y: number,
  width: number,
  height: number,
  typewriter: Typewriter,
  speakerLabel: string,
  border?: BorderSet
): void {
  drawBox(grid, x, y, width, height, {
    title: speakerLabel,
    border,
  });

  const innerX = x + 2;
  const innerWidth = width - 4;
  const maxRows = height - 3;

  const text = typewriter.current();
  const lines = wrapLines(text, innerWidth).slice(0, maxRows);

  for (let i = 0; i < lines.length; i++) {
    grid.writeText(innerX, y + 2 + i, lines[i]);
  }
}
