/**
 * App — Preact shell mínimo.
 *
 * Monta o canvas, instancia o engine + renderer + input manager,
 * e amarra o render loop. Toda lógica de UI é ASCII desenhado no canvas.
 */

import { useEffect, useRef } from 'preact/hooks';

import { GRID_COLS, GRID_ROWS } from '../lib/constants';
import { GameEngine } from '../engine/GameEngine';
import { Grid } from '../renderer/Grid';
import { AsciiRenderer } from '../renderer/AsciiRenderer';
import { InputManager } from '../input/InputManager';
import { drawResourceBar } from '../renderer/panels/ResourceBar';
import { drawBuildingPanel, parseBuyButtonId } from '../renderer/panels/BuildingPanel';
import { drawBox } from '../renderer/widgets/Box';
import { drawButton, type ButtonHitBox } from '../renderer/widgets/Button';
import { formatInt } from '../lib/numbers';

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine();
    const renderer = new AsciiRenderer(canvas);
    const grid = new Grid(GRID_COLS, GRID_ROWS);
    renderer.resizeForGrid(GRID_COLS, GRID_ROWS);

    const input = new InputManager(canvas, renderer);
    let frameHitboxes: ButtonHitBox[] = [];

    input.onClickHandler((id) => {
      if (id === 'click_token') {
        engine.click();
        return;
      }
      const buildingId = parseBuyButtonId(id);
      if (buildingId) {
        engine.buyBuilding(buildingId);
      }
    });

    const draw = () => {
      grid.clear();
      const state = engine.state;
      const productionPerSecond = engine.buildings.getTotalProduction(state);

      // Top: resource bar
      drawResourceBar(grid, 0, 0, GRID_COLS, state, productionPerSecond);

      // Center: clicker
      const centerX = Math.floor(GRID_COLS / 2);
      const centerY = 12;
      drawBox(grid, centerX - 20, 4, 40, 9, { title: 'YOUR MODEL' });
      const tokensStr = formatInt(state.resources.tokens);
      grid.writeText(centerX - Math.floor(tokensStr.length / 2), 7, tokensStr);
      grid.writeText(centerX - 6, 8, 'TOKENS GENERATED');
      const clickHb = drawButton(
        grid,
        centerX - 9,
        10,
        'GENERATE TOKEN',
        'click_token',
        { hovered: input.getHoveredId() === 'click_token' }
      );

      // Bottom: building panel
      const panelY = 14;
      const panelHeight = GRID_ROWS - panelY;
      const buildingHitboxes = drawBuildingPanel(
        grid,
        0,
        panelY,
        GRID_COLS,
        panelHeight,
        state,
        engine.buildings,
        input.getHoveredId()
      );

      frameHitboxes = [clickHb, ...buildingHitboxes];
      input.setHitboxes(frameHitboxes);

      renderer.render(grid);
    };

    engine.start(draw);

    return () => {
      engine.stop();
      input.destroy();
    };
  }, []);

  return <canvas ref={canvasRef} />;
}
