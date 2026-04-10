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
 * Endpoint do WebSocket.
 *
 * - Dev (localhost): `ws://localhost:4000/socket` (backend direto).
 * - Prod: `{wss|ws}://{current_host}/socket` — mesmo domain do client,
 *   Caddy proxy dispatcha pro backend container.
 *
 * Override via `VITE_WS_URL` se necessário.
 */
export const WS_URL: string = (() => {
  const override = import.meta.env.VITE_WS_URL as string | undefined;
  if (override && override.length > 0) return override;
  if (typeof window === "undefined") return "";
  const { protocol, host, hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "ws://localhost:4000/socket";
  }
  const wsProto = protocol === "https:" ? "wss:" : "ws:";
  return `${wsProto}//${host}/socket`;
})();
