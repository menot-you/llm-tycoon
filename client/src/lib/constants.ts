/**
 * Client-side render constants. Balancing vive no server Rust.
 */

export const GRID_COLS = 120;
export const GRID_ROWS = 40;
export const MONOSPACE_FONT =
  'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
export const FONT_SIZE = 14;
export const LINE_HEIGHT = 1.2;

/**
 * Endpoint do WebSocket. Configurável via `VITE_WS_URL`.
 *
 * Em dev (localhost), default: `ws://localhost:4000/socket`.
 * Em prod (Vercel), precisa ser setado: `wss://api.llm-tycoon.menot.run/socket`.
 */
export const WS_URL: string =
  (import.meta.env.VITE_WS_URL as string | undefined) ??
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "ws://localhost:4000/socket"
    : "");
