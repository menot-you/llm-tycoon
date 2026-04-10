/**
 * App — Preact shell mínimo.
 *
 * Responsabilidades (e NADA além disso):
 * 1. Mount canvas
 * 2. Instanciar `RemoteGameClient` + conectar no server Rust
 * 3. Render loop (rAF) lendo `client.state` e pintando no Grid
 * 4. Capturar clicks → `client.click()` / `client.buyBuilding(id)` etc.
 *
 * Zero game logic. Zero state local. O server manda snapshots, a gente
 * desenha. Se o snapshot não chegou ainda, desenhamos "connecting...".
 */

import { useEffect, useRef } from "preact/hooks";

import type { EraId } from "../bindings/EraId";
import { GRID_COLS, GRID_ROWS, WS_URL } from "../lib/constants";
import { formatInt } from "../lib/numbers";
import { AsciiRenderer } from "../renderer/AsciiRenderer";
import { Grid } from "../renderer/Grid";
import { drawBox } from "../renderer/widgets/Box";
import { drawButton, type ButtonHitBox } from "../renderer/widgets/Button";
import { InputManager } from "../input/InputManager";
import {
  type ConnectionStatus,
  RemoteGameClient,
} from "../net/RemoteGameClient";

/** UUID persistido em localStorage pra manter identidade cross-session. */
function getOrCreatePlayerId(): string {
  const KEY = "llm-tycoon:player_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

/** EraId enum (string) → número 1..8. */
const ERA_TO_NUMBER: Record<EraId, number> = {
  Hardcoded: 1,
  Statistical: 2,
  Neural: 3,
  Transformer: 4,
  Foundation: 5,
  Emergent: 6,
  Singularity: 7,
  Transcendent: 8,
};

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new AsciiRenderer(canvas);
    const grid = new Grid(GRID_COLS, GRID_ROWS);
    renderer.resizeForGrid(GRID_COLS, GRID_ROWS);

    const input = new InputManager(canvas, renderer);

    const client = new RemoteGameClient({
      url: WS_URL,
      playerId: getOrCreatePlayerId(),
    });

    // Buffer de eventos recentes (últimos 6) pra event log na tela
    const eventLog: string[] = [];
    client.onEvent((e) => {
      const prefix =
        e.kind === "good" ? "+" : e.kind === "warn" ? "!" : e.kind === "crit" ? "✗" : " ";
      eventLog.push(`${prefix} ${e.message}`);
      if (eventLog.length > 6) eventLog.shift();
    });

    let currentStatus: ConnectionStatus = "offline";
    client.onStatus((s) => {
      currentStatus = s;
    });

    client.connect();

    input.onClickHandler((id) => {
      if (id === "click_token") {
        client.click();
      } else if (id.startsWith("buy:")) {
        client.buyBuilding(id.slice(4));
      } else if (id === "prestige") {
        client.prestige();
      } else if (id === "reborn") {
        client.reborn();
      }
    });

    let rafId = 0;
    const render = () => {
      grid.clear();
      const state = client.state;

      // Header
      drawBox(grid, 0, 0, GRID_COLS, 3, { title: "LLM TYCOON" });
      const statusText = `[${currentStatus.toUpperCase()}]`;
      grid.writeText(GRID_COLS - statusText.length - 2, 1, statusText);

      if (!state) {
        const msg = "Connecting to server...";
        grid.writeText(Math.floor((GRID_COLS - msg.length) / 2), 10, msg);
        renderer.render(grid);
        rafId = requestAnimationFrame(render);
        return;
      }

      // Header info
      const eraNum = ERA_TO_NUMBER[state.era] ?? 1;
      const info = `Player: ${shortId(state.player_id)}  Era ${eraNum}/8 (${state.era})  Prestige ${state.prestige_count}  Reborn ${state.reborn_count}`;
      grid.writeText(2, 1, info);

      // Resources row
      const tokens = `TOKENS ${formatInt(state.resources.tokens)}`;
      const compute = `compute ${formatInt(state.resources.compute)}`;
      const data = `data ${formatInt(state.resources.data)}`;
      const hype = `hype ${formatInt(state.resources.hype)}`;
      const funding = `$ ${formatInt(state.resources.funding)}`;
      const halluc = `alucinação ${Math.floor(state.resources.hallucinations * 100)}%`;
      grid.writeText(2, 4, tokens);
      grid.writeText(30, 4, compute);
      grid.writeText(48, 4, data);
      grid.writeText(62, 4, hype);
      grid.writeText(80, 4, funding);
      grid.writeText(95, 4, halluc);

      // Main clicker
      drawBox(grid, 30, 6, 60, 8, { title: "YOUR MODEL" });
      const tokensStr = formatInt(state.resources.tokens);
      grid.writeText(60 - Math.floor(tokensStr.length / 2), 8, tokensStr);
      grid.writeText(52, 9, "TOKENS GENERATED");
      grid.writeText(
        36,
        10,
        `ML steps trained: ${state.ml_steps_trained}    achievements: ${state.achievements.length}`,
      );

      const clickHb = drawButton(
        grid,
        51,
        12,
        "GENERATE TOKEN",
        "click_token",
        { hovered: input.getHoveredId() === "click_token" },
      );

      // Buildings list (minimalista)
      drawBox(grid, 0, 15, GRID_COLS, 14, { title: "BUILDINGS" });
      const buildingHitboxes: ButtonHitBox[] = [];
      const tierIds = [
        ["ifelse_bot", "if/else bot"],
        ["markov_chain", "Markov Chain"],
        ["rnn", "RNN"],
        ["lstm", "LSTM"],
        ["transformer", "Transformer"],
        ["gpt_like", "GPT-like"],
        ["multimodal", "Multimodal"],
        ["agi", "AGI"],
        ["asi", "ASI"],
        ["quantum", "Quantum"],
      ] as const;
      tierIds.forEach(([id, name], i) => {
        const row = 17 + i;
        if (row >= 28) return;
        const owned = state.buildings[id] ?? 0;
        const line = `${name.padEnd(18)}  x${String(owned).padStart(4)}`;
        grid.writeText(3, row, line);
        const hb = drawButton(grid, GRID_COLS - 10, row, "BUY", `buy:${id}`, {
          hovered: input.getHoveredId() === `buy:${id}`,
        });
        buildingHitboxes.push(hb);
      });

      // Event log
      drawBox(grid, 0, 30, GRID_COLS, GRID_ROWS - 30, { title: "EVENTS" });
      eventLog.forEach((e, i) => {
        grid.writeText(2, 32 + i, e.substring(0, GRID_COLS - 4));
      });

      // Prestige / Reborn buttons
      const prestigeHb = drawButton(
        grid,
        GRID_COLS - 30,
        GRID_ROWS - 1,
        "PRESTIGE",
        "prestige",
        { hovered: input.getHoveredId() === "prestige" },
      );
      const rebornHb = drawButton(
        grid,
        GRID_COLS - 12,
        GRID_ROWS - 1,
        "REBORN",
        "reborn",
        { hovered: input.getHoveredId() === "reborn" },
      );

      input.setHitboxes([clickHb, ...buildingHitboxes, prestigeHb, rebornHb]);

      renderer.render(grid);
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      input.destroy();
      client.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} />;
}

function shortId(id: string | null | undefined): string {
  if (!id) return "?";
  return id.length > 8 ? `${id.slice(0, 4)}…${id.slice(-4)}` : id;
}
