/**
 * App — Preact shell. Monta canvas, engine, renderer, input, particles, matrix.
 */

import { useEffect, useRef } from 'preact/hooks';

import { GRID_COLS, GRID_ROWS } from '../lib/constants';
import { GameEngine } from '../engine/GameEngine';
import { BUILDINGS_BY_ID } from '../data/buildings';
import { UPGRADES_BY_ID } from '../data/upgrades';
import { Grid } from '../renderer/Grid';
import { AsciiRenderer } from '../renderer/AsciiRenderer';
import { InputManager } from '../input/InputManager';
import { drawResourceBar } from '../renderer/panels/ResourceBar';
import {
  drawBuildingPanel,
  parseBuyButtonId,
} from '../renderer/panels/BuildingPanel';
import {
  drawUpgradePanel,
  parseUpgradeButtonId,
} from '../renderer/panels/UpgradePanel';
import { EventLogStore, drawEventLog } from '../renderer/panels/EventLog';
import { drawBox } from '../renderer/widgets/Box';
import { drawButton, type ButtonHitBox } from '../renderer/widgets/Button';
import { drawSparkline } from '../renderer/widgets/Sparkline';
import { ParticleSystem } from '../renderer/effects/Particles';
import { MatrixRain } from '../renderer/effects/Matrix';
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
    const particles = new ParticleSystem();
    const matrix = new MatrixRain(GRID_COLS, GRID_ROWS, 0.08);
    const events = new EventLogStore(50);
    events.push('Bem-vindo ao LLM Tycoon. Clique em GENERATE TOKEN pra começar.', 'info');

    const rateHistory: number[] = [];
    let lastHistoryUpdate = 0;
    let lastTime = performance.now();

    input.onClickHandler((id) => {
      if (id === 'click_token') {
        engine.click();
        particles.spawn(GRID_COLS / 2, 10, 3);
        return;
      }
      const buildingId = parseBuyButtonId(id);
      if (buildingId) {
        const ok = engine.buyBuilding(buildingId);
        const def = BUILDINGS_BY_ID[buildingId];
        if (ok && def) events.push(`comprou ${def.name}`, 'good');
        return;
      }
      const upgradeId = parseUpgradeButtonId(id);
      if (upgradeId) {
        const ok = engine.buyUpgrade(upgradeId);
        const def = UPGRADES_BY_ID[upgradeId];
        if (ok && def) events.push(`upgrade: ${def.name}`, 'good');
      }
    });

    const draw = () => {
      const now = performance.now();
      const frameDelta = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      const state = engine.state;
      const tokenRate = engine.resources.getEffectiveTokenRate(state);
      const computeRate = engine.resources.getComputeRate(state);
      const hypeRate = engine.resources.getHypeRate(state);
      const fundingRate = engine.resources.getFundingRate(state);

      // Histórico pro sparkline (a cada 200ms)
      if (now - lastHistoryUpdate > 200) {
        rateHistory.push(tokenRate);
        if (rateHistory.length > 80) rateHistory.shift();
        lastHistoryUpdate = now;
      }

      matrix.update(frameDelta);
      particles.update(frameDelta);

      grid.clear();

      // Top: resource bar expandida (4 linhas)
      drawResourceBar(grid, 0, 0, GRID_COLS, state, {
        tokens: tokenRate,
        compute: computeRate,
        hype: hypeRate,
        funding: fundingRate,
        hallucinationPct: state.resources.hallucinations,
      });

      // Center clicker box
      const centerX = Math.floor(GRID_COLS / 2);
      drawBox(grid, centerX - 22, 5, 44, 8, { title: 'YOUR MODEL' });
      const tokensStr = formatInt(state.resources.tokens);
      grid.writeText(centerX - Math.floor(tokensStr.length / 2), 7, tokensStr);
      grid.writeText(centerX - 8, 8, 'TOKENS GENERATED');
      drawSparkline(grid, centerX - 20, 9, 40, rateHistory);
      const clickHb = drawButton(
        grid,
        centerX - 9,
        11,
        'GENERATE TOKEN',
        'click_token',
        { hovered: input.getHoveredId() === 'click_token' }
      );

      // Left side: buildings
      const panelY = 14;
      const panelHeight = GRID_ROWS - panelY - 8;
      const leftWidth = Math.floor(GRID_COLS * 0.58);
      const buildingHitboxes = drawBuildingPanel(
        grid,
        0,
        panelY,
        leftWidth,
        panelHeight,
        state,
        engine.buildings,
        input.getHoveredId()
      );

      // Right side: upgrades
      const rightX = leftWidth + 1;
      const rightWidth = GRID_COLS - rightX;
      const upgradeHitboxes = drawUpgradePanel(
        grid,
        rightX,
        panelY,
        rightWidth,
        panelHeight,
        state,
        engine.upgrades,
        input.getHoveredId()
      );

      // Bottom: event log
      drawEventLog(grid, 0, GRID_ROWS - 8, GRID_COLS, 8, events);

      // Matrix rain por último (só em cells vazios)
      matrix.draw(grid);
      particles.draw(grid);

      const frameHitboxes: ButtonHitBox[] = [
        clickHb,
        ...buildingHitboxes,
        ...upgradeHitboxes,
      ];
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
