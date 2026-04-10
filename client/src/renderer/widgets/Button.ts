/**
 * Button — clickable ASCII button.
 */

import type { Grid } from "../Grid";

export interface ButtonState {
  hovered?: boolean;
  disabled?: boolean;
}

export interface ButtonHitBox {
  x: number;
  y: number;
  width: number;
  height: number;
  id: string;
}

export function drawButton(
  grid: Grid,
  x: number,
  y: number,
  label: string,
  id: string,
  state: ButtonState = {},
): ButtonHitBox {
  const { hovered = false, disabled = false } = state;
  const open = disabled ? "(" : "[";
  const close = disabled ? ")" : "]";
  const leftMark = hovered && !disabled ? "►" : " ";
  const rightMark = hovered && !disabled ? "◄" : " ";
  const text = `${open}${leftMark}${label}${rightMark}${close}`;
  grid.writeText(x, y, text);
  return { x, y, width: text.length, height: 1, id };
}
