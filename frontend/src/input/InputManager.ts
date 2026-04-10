/**
 * InputManager — converte eventos do mouse em interações com o grid ASCII.
 *
 * Mantém uma lista de hit-boxes (de Buttons) e dispara callbacks no clique
 * ou no hover.
 */

import type { ButtonHitBox } from '../renderer/widgets/Button';
import type { AsciiRenderer } from '../renderer/AsciiRenderer';

export type ClickHandler = (id: string) => void;

export class InputManager {
  private hitboxes: ButtonHitBox[] = [];
  private hoveredId: string | null = null;
  private clickHandler: ClickHandler | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private renderer: AsciiRenderer
  ) {
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('click', this.onClick);
    this.canvas.style.cursor = 'crosshair';
  }

  destroy(): void {
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('click', this.onClick);
  }

  /** Atualiza a lista de hit-boxes (chamado a cada frame pelo render). */
  setHitboxes(boxes: ButtonHitBox[]): void {
    this.hitboxes = boxes;
  }

  onClickHandler(fn: ClickHandler): void {
    this.clickHandler = fn;
  }

  getHoveredId(): string | null {
    return this.hoveredId;
  }

  private onMouseMove = (e: MouseEvent): void => {
    const cell = this.toCell(e);
    const hovered = this.hitTest(cell.col, cell.row);
    this.hoveredId = hovered?.id ?? null;
    this.canvas.style.cursor = hovered ? 'pointer' : 'crosshair';
  };

  private onClick = (e: MouseEvent): void => {
    const cell = this.toCell(e);
    const hit = this.hitTest(cell.col, cell.row);
    if (hit && this.clickHandler) {
      this.clickHandler(hit.id);
    }
  };

  private toCell(e: MouseEvent): { col: number; row: number } {
    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    return this.renderer.pixelToCell(px, py);
  }

  private hitTest(col: number, row: number): ButtonHitBox | null {
    for (const box of this.hitboxes) {
      if (
        col >= box.x &&
        col < box.x + box.width &&
        row >= box.y &&
        row < box.y + box.height
      ) {
        return box;
      }
    }
    return null;
  }
}
