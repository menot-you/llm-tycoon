/**
 * PhoenixClient — wrapper do phoenix.js Socket + Channel.
 *
 * Conecta no Elixir backend, joina no player:<uuid>, envia sync periodicamente
 * e escuta leaderboard_update.
 */

import { Socket, Channel } from 'phoenix';

export interface LeaderboardEntry {
  player_id: string;
  display_name: string;
  capability_score: number;
  era: number;
  prestige_count: number;
  market_share: number;
}

export interface EspionageResult {
  action: string;
  target: string;
  success: boolean;
  effect: string;
  timestamp: number;
}

export type LeaderboardCallback = (top: LeaderboardEntry[]) => void;
export type StatusCallback = (status: 'connecting' | 'connected' | 'error' | 'offline') => void;

const DEFAULT_ENDPOINT = 'ws://localhost:4000/socket';

export class PhoenixClient {
  private socket: Socket | null = null;
  private channel: Channel | null = null;
  private leaderboardCb: LeaderboardCallback | null = null;
  private statusCb: StatusCallback | null = null;
  private connected = false;
  public playerId: string;

  constructor(playerId: string | null) {
    this.playerId = playerId ?? crypto.randomUUID();
  }

  onLeaderboard(fn: LeaderboardCallback): void {
    this.leaderboardCb = fn;
  }

  onStatus(fn: StatusCallback): void {
    this.statusCb = fn;
  }

  connect(endpoint = DEFAULT_ENDPOINT): void {
    if (this.socket) return;
    this.statusCb?.('connecting');
    this.socket = new Socket(endpoint, { params: {} });

    this.socket.onOpen(() => {
      this.connected = true;
      this.statusCb?.('connected');
    });
    this.socket.onError(() => {
      this.statusCb?.('error');
    });
    this.socket.onClose(() => {
      this.connected = false;
      this.statusCb?.('offline');
    });

    this.socket.connect();
    this.channel = this.socket.channel(`player:${this.playerId}`, {});

    this.channel.on('leaderboard_update', (payload: { top: LeaderboardEntry[] }) => {
      this.leaderboardCb?.(payload.top ?? []);
    });

    this.channel.join().receive('ok', () => {
      this.statusCb?.('connected');
    }).receive('error', () => {
      this.statusCb?.('error');
    });
  }

  isConnected(): boolean {
    return this.connected;
  }

  sync(attrs: {
    display_name: string;
    capability_score: number;
    era: number;
    prestige_count: number;
  }): void {
    if (!this.channel || !this.connected) return;
    this.channel.push('sync', attrs);
  }

  espionage(targetId: string, action: string): Promise<EspionageResult | { error: string }> {
    return new Promise((resolve) => {
      if (!this.channel || !this.connected) {
        resolve({ error: 'offline' });
        return;
      }
      this.channel
        .push('espionage', { target: targetId, action })
        .receive('ok', (result: EspionageResult) => resolve(result))
        .receive('error', (err: { reason: string }) => resolve({ error: err.reason }))
        .receive('timeout', () => resolve({ error: 'timeout' }));
    });
  }

  disconnect(): void {
    this.channel?.leave();
    this.socket?.disconnect();
    this.channel = null;
    this.socket = null;
    this.connected = false;
  }
}
