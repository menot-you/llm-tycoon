/**
 * App — Preact shell. Monta canvas, engine, renderer, input, particles, matrix.
 *
 * O tema é reativo à era: borders, cores, glitch, matrix density e particles
 * mudam conforme o player avança.
 */

import { useEffect, useRef } from 'preact/hooks';

import { GRID_COLS, GRID_ROWS } from '../lib/constants';
import { GameEngine } from '../engine/GameEngine';
import { BUILDINGS_BY_ID } from '../data/buildings';
import { UPGRADES_BY_ID } from '../data/upgrades';
import { Grid } from '../renderer/Grid';
import { AsciiRenderer } from '../renderer/AsciiRenderer';
import { themeForEra } from '../renderer/themes';
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
import { drawEraProgress } from '../renderer/panels/EraProgress';
import {
  drawPrestigePanel,
  parsePermanentUpgradeId,
} from '../renderer/panels/PrestigePanel';
import {
  drawLeaderboard,
  parseTargetButton,
  parseActionButton,
} from '../renderer/panels/Leaderboard';
import {
  PhoenixClient,
  type LeaderboardEntry,
} from '../network/PhoenixClient';
import { drawBox } from '../renderer/widgets/Box';
import { drawButton, type ButtonHitBox } from '../renderer/widgets/Button';
import { drawSparkline } from '../renderer/widgets/Sparkline';
import { ParticleSystem } from '../renderer/effects/Particles';
import { MatrixRain } from '../renderer/effects/Matrix';
import { Glitch } from '../renderer/effects/Glitch';
import { formatInt } from '../lib/numbers';
import { formatDuration } from '../engine/offline';
import type { EraId } from '../data/eras';

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine();
    // Debug: expõe engine na window (apenas em dev)
    if (import.meta.env.DEV) {
      (window as unknown as { __engine: GameEngine }).__engine = engine;
    }
    const renderer = new AsciiRenderer(canvas);
    let theme = themeForEra(engine.state.era as EraId);
    renderer.setTheme(theme);
    const grid = new Grid(GRID_COLS, GRID_ROWS);
    renderer.resizeForGrid(GRID_COLS, GRID_ROWS);

    const input = new InputManager(canvas, renderer);
    const particles = new ParticleSystem();
    const matrix = new MatrixRain(GRID_COLS, GRID_ROWS, theme.matrixDensity);
    const glitch = new Glitch();
    glitch.setIntensity(theme.glitchIntensity);

    const events = new EventLogStore(50);
    events.push(
      'Bem-vindo ao LLM Tycoon. Clique em GENERATE TOKEN pra começar.',
      'info'
    );
    events.push(`Era 1: ${theme.label}`, 'info');

    if (engine.offlineReport && engine.offlineReport.tokensEarned > 0) {
      const r = engine.offlineReport;
      events.push(
        `Welcome back: +${Math.floor(r.tokensEarned)} tokens em ${formatDuration(r.offlineSeconds)} offline (${Math.floor(r.efficiency * 100)}%)`,
        'good'
      );
    }

    engine.onEvent((e) => {
      events.push(e.message, e.kind);
    });

    const rateHistory: number[] = [];
    let lastHistoryUpdate = 0;
    let lastTime = performance.now();
    let prestigeOpen = false;
    let leaderboardOpen = false;
    let lastEra: EraId = engine.state.era as EraId;

    // --- PvP: conecta no backend Elixir ---
    if (!engine.state.playerId) {
      engine.state.playerId = crypto.randomUUID();
    }
    const pvp = new PhoenixClient(engine.state.playerId);
    let leaderboardData: LeaderboardEntry[] = [];
    let selectedTargetId: string | null = null;
    let pvpStatus: string = 'offline';

    pvp.onStatus((s) => {
      pvpStatus = s;
      events.push(`pvp: ${s}`, s === 'connected' ? 'good' : 'info');
    });
    pvp.onLeaderboard((top) => {
      leaderboardData = top;
    });
    pvp.connect();

    // Sync periódico
    const syncInterval = setInterval(() => {
      if (pvp.isConnected()) {
        pvp.sync({
          display_name: engine.state.displayName,
          capability_score: engine.getCapabilityScore(),
          era: engine.state.era,
          prestige_count: engine.state.prestigeCount,
        });
      }
    }, 3000);

    const applyTheme = (newTheme: typeof theme) => {
      theme = newTheme;
      renderer.setTheme(theme);
      matrix.resize(GRID_COLS, GRID_ROWS);
      glitch.setIntensity(theme.glitchIntensity);
      events.push(`✦ UI EVOLVED → ${theme.label}`, 'good');
    };

    input.onClickHandler((id) => {
      if (id === 'toggle_prestige') {
        prestigeOpen = !prestigeOpen;
        leaderboardOpen = false;
        return;
      }
      if (id === 'toggle_leaderboard') {
        leaderboardOpen = !leaderboardOpen;
        prestigeOpen = false;
        return;
      }
      if (id === 'prestige:go') {
        const gained = engine.doPrestige();
        if (gained > 0) prestigeOpen = false;
        return;
      }
      const permId = parsePermanentUpgradeId(id);
      if (permId) {
        engine.buyPermanentUpgrade(permId);
        return;
      }

      // Leaderboard overlay
      const targetId = parseTargetButton(id);
      if (targetId) {
        selectedTargetId = selectedTargetId === targetId ? null : targetId;
        return;
      }
      const actionId = parseActionButton(id);
      if (actionId && selectedTargetId) {
        pvp.espionage(selectedTargetId, actionId).then((result) => {
          if ('error' in result) {
            events.push(`espionage ${actionId}: ${result.error}`, 'warn');
          } else {
            events.push(
              `espionage ${actionId}: ${result.success ? 'success' : 'failed'} — ${result.effect}`,
              result.success ? 'good' : 'warn'
            );
          }
        });
        return;
      }

      if (prestigeOpen || leaderboardOpen) return;

      if (id === 'click_token') {
        engine.click();
        if (theme.particlesEnabled) {
          particles.spawn(GRID_COLS / 2, 10, 3);
        }
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

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        prestigeOpen = !prestigeOpen;
        leaderboardOpen = false;
      } else if (e.key === 'l' || e.key === 'L') {
        leaderboardOpen = !leaderboardOpen;
        prestigeOpen = false;
      } else if (e.key === 'Escape') {
        prestigeOpen = false;
        leaderboardOpen = false;
      }
    };
    window.addEventListener('keydown', onKey);

    const draw = () => {
      const now = performance.now();
      const frameDelta = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      // Detecta mudança de era e aplica novo tema
      if (engine.state.era !== lastEra) {
        lastEra = engine.state.era as EraId;
        applyTheme(themeForEra(lastEra));
      }

      const state = engine.state;
      const tokenRate = engine.resources.getEffectiveTokenRate(state);
      const computeRate = engine.resources.getComputeRate(state);
      const hypeRate = engine.resources.getHypeRate(state);
      const fundingRate = engine.resources.getFundingRate(state);

      if (now - lastHistoryUpdate > 200) {
        rateHistory.push(tokenRate);
        if (rateHistory.length > 80) rateHistory.shift();
        lastHistoryUpdate = now;
      }

      matrix.update(frameDelta);
      particles.update(frameDelta);

      grid.clear();

      // Top: resource bar com theme borders
      drawResourceBar(
        grid,
        0,
        0,
        GRID_COLS,
        state,
        {
          tokens: tokenRate,
          compute: computeRate,
          hype: hypeRate,
          funding: fundingRate,
          hallucinationPct: state.resources.hallucinations,
        },
        theme.border
      );

      // Center clicker box
      const centerX = Math.floor(GRID_COLS / 2);
      drawBox(grid, centerX - 24, 5, 48, 9, {
        title: 'YOUR MODEL',
        border: theme.border,
      });
      const tokensStr = formatInt(state.resources.tokens);
      grid.writeText(centerX - Math.floor(tokensStr.length / 2), 7, tokensStr);
      grid.writeText(centerX - 8, 8, 'TOKENS GENERATED');
      drawSparkline(grid, centerX - 22, 9, 44, rateHistory);
      drawEraProgress(grid, centerX - 22, 10, 44, state, engine.eras);
      const clickHb = drawButton(
        grid,
        centerX - 9,
        13,
        'GENERATE TOKEN',
        'click_token',
        { hovered: input.getHoveredId() === 'click_token' }
      );

      const panelY = 15;
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
        input.getHoveredId(),
        theme.border
      );

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
        input.getHoveredId(),
        theme.border
      );

      drawEventLog(grid, 0, GRID_ROWS - 8, GRID_COLS, 8, events, theme.border);

      // Matrix rain e particles
      matrix.draw(grid);
      if (theme.particlesEnabled) particles.draw(grid);

      // Glitch effect em cima de tudo
      glitch.apply(grid);

      // Toggle buttons (footer direito)
      const togglePrestigeHb = drawButton(
        grid,
        GRID_COLS - 30,
        GRID_ROWS - 1,
        'PRESTIGE [P]',
        'toggle_prestige',
        { hovered: input.getHoveredId() === 'toggle_prestige' }
      );
      const toggleLeaderboardHb = drawButton(
        grid,
        GRID_COLS - 14,
        GRID_ROWS - 1,
        'PvP [L]',
        'toggle_leaderboard',
        { hovered: input.getHoveredId() === 'toggle_leaderboard' }
      );

      let leaderboardHitboxes: ButtonHitBox[] = [];
      if (leaderboardOpen) {
        const ox = 10;
        const oy = 4;
        const ow = GRID_COLS - 20;
        const oh = GRID_ROWS - 8;
        for (let yy = oy; yy < oy + oh; yy++) {
          for (let xx = ox; xx < ox + ow; xx++) {
            grid.setChar(xx, yy, ' ');
          }
        }
        leaderboardHitboxes = drawLeaderboard(
          grid,
          ox,
          oy,
          ow,
          oh,
          leaderboardData,
          selectedTargetId,
          pvpStatus,
          input.getHoveredId(),
          theme.border
        );
      }

      let prestigeHitboxes: ButtonHitBox[] = [];
      if (prestigeOpen) {
        const ox = 10;
        const oy = 4;
        const ow = GRID_COLS - 20;
        const oh = GRID_ROWS - 8;
        for (let yy = oy; yy < oy + oh; yy++) {
          for (let xx = ox; xx < ox + ow; xx++) {
            grid.setChar(xx, yy, ' ');
          }
        }
        prestigeHitboxes = drawPrestigePanel(
          grid,
          ox,
          oy,
          ow,
          oh,
          state,
          engine.prestige,
          input.getHoveredId(),
          theme.border
        );
      }

      const frameHitboxes: ButtonHitBox[] = prestigeOpen
        ? [togglePrestigeHb, toggleLeaderboardHb, ...prestigeHitboxes]
        : leaderboardOpen
          ? [togglePrestigeHb, toggleLeaderboardHb, ...leaderboardHitboxes]
          : [
              clickHb,
              ...buildingHitboxes,
              ...upgradeHitboxes,
              togglePrestigeHb,
              toggleLeaderboardHb,
            ];
      input.setHitboxes(frameHitboxes);

      renderer.render(grid);
    };

    engine.start(draw);

    return () => {
      engine.stop();
      input.destroy();
      pvp.disconnect();
      clearInterval(syncInterval);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return <canvas ref={canvasRef} />;
}
