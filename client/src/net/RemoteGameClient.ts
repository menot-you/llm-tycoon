/**
 * RemoteGameClient — thin wrapper sobre WebSocket.
 *
 * - Conecta no server Rust via `VITE_WS_URL?player_id=<uuid>`
 * - Recebe snapshots (`GameState`) e events (`{kind, message}`)
 * - Envia intents (`click`, `buy_building`, `prestige`, `reborn`, etc)
 *
 * Reconecta automaticamente com backoff exponencial simples.
 * Client é view-only — nunca muta state local.
 */

import type { GameState } from "../bindings/GameState";

export type ConnectionStatus = "offline" | "connecting" | "connected" | "error";

export interface GameEventPayload {
  kind: "info" | "good" | "warn" | "crit";
  message: string;
}

type BroadcastFrame =
  | { type: "snapshot"; [key: string]: unknown } // GameState flattened
  | { type: "event"; kind: "info" | "good" | "warn" | "crit"; message: string };

export type Intent =
  | { type: "click" }
  | { type: "buy_building"; id: string }
  | { type: "buy_upgrade"; id: string }
  | { type: "buy_permanent"; id: string }
  | { type: "buy_perk"; id: string }
  | { type: "prestige" }
  | { type: "reborn" }
  | { type: "set_display_name"; name: string };

export interface RemoteGameClientOptions {
  url: string;
  playerId: string;
}

type StateListener = (state: GameState) => void;
type EventListener = (event: GameEventPayload) => void;
type StatusListener = (status: ConnectionStatus) => void;

export class RemoteGameClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;
  private status: ConnectionStatus = "offline";

  state: GameState | null = null;

  private stateListeners = new Set<StateListener>();
  private eventListeners = new Set<EventListener>();
  private statusListeners = new Set<StatusListener>();

  constructor(private opts: RemoteGameClientOptions) {}

  connect(): void {
    if (this.ws || this.stopped) return;
    if (!this.opts.url) {
      this.setStatus("offline");
      console.warn("[RemoteGameClient] no WS URL configured — offline mode");
      return;
    }

    this.setStatus("connecting");
    const url = `${this.opts.url}?player_id=${encodeURIComponent(this.opts.playerId)}`;
    try {
      this.ws = new WebSocket(url);
    } catch (e) {
      console.error("[RemoteGameClient] WebSocket ctor failed", e);
      this.setStatus("error");
      this.scheduleReconnect();
      return;
    }

    this.ws.addEventListener("open", () => {
      this.reconnectAttempts = 0;
      this.setStatus("connected");
    });

    this.ws.addEventListener("message", (ev) => {
      this.handleMessage(ev.data);
    });

    this.ws.addEventListener("close", () => {
      this.ws = null;
      if (!this.stopped) {
        this.setStatus("offline");
        this.scheduleReconnect();
      }
    });

    this.ws.addEventListener("error", () => {
      this.setStatus("error");
    });
  }

  disconnect(): void {
    this.stopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  send(intent: Intent): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    this.ws.send(JSON.stringify(intent));
    return true;
  }

  // Intent helpers (ergonomia)
  click(): boolean {
    return this.send({ type: "click" });
  }
  buyBuilding(id: string): boolean {
    return this.send({ type: "buy_building", id });
  }
  buyUpgrade(id: string): boolean {
    return this.send({ type: "buy_upgrade", id });
  }
  buyPermanent(id: string): boolean {
    return this.send({ type: "buy_permanent", id });
  }
  buyPerk(id: string): boolean {
    return this.send({ type: "buy_perk", id });
  }
  prestige(): boolean {
    return this.send({ type: "prestige" });
  }
  reborn(): boolean {
    return this.send({ type: "reborn" });
  }
  setDisplayName(name: string): boolean {
    return this.send({ type: "set_display_name", name });
  }

  // Subscriptions
  onState(fn: StateListener): () => void {
    this.stateListeners.add(fn);
    if (this.state) fn(this.state);
    return () => this.stateListeners.delete(fn);
  }
  onEvent(fn: EventListener): () => void {
    this.eventListeners.add(fn);
    return () => this.eventListeners.delete(fn);
  }
  onStatus(fn: StatusListener): () => void {
    this.statusListeners.add(fn);
    fn(this.status);
    return () => this.statusListeners.delete(fn);
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  // ============================================================
  // Internal
  // ============================================================

  private handleMessage(raw: unknown): void {
    if (typeof raw !== "string") return;
    let parsed: BroadcastFrame;
    try {
      parsed = JSON.parse(raw) as BroadcastFrame;
    } catch (e) {
      console.warn("[RemoteGameClient] invalid json", e);
      return;
    }

    if (parsed.type === "snapshot") {
      // O server serializa o `PlayerBroadcast::Snapshot(GameState)` como
      // `{ type: "snapshot", ...gameStateFields }`. Remove o type pra ter
      // o GameState limpo.
      const { type: _type, ...rest } = parsed;
      const state = rest as unknown as GameState;
      this.state = state;
      for (const fn of this.stateListeners) fn(state);
    } else if (parsed.type === "event") {
      const payload: GameEventPayload = {
        kind: parsed.kind,
        message: parsed.message,
      };
      for (const fn of this.eventListeners) fn(payload);
    }
  }

  private setStatus(next: ConnectionStatus): void {
    if (this.status === next) return;
    this.status = next;
    for (const fn of this.statusListeners) fn(next);
  }

  private scheduleReconnect(): void {
    if (this.stopped) return;
    if (this.reconnectTimer) return;
    const delay = Math.min(30_000, 500 * 2 ** this.reconnectAttempts);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
}
