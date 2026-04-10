/**
 * GameEngine — orquestrador central.
 *
 * Inicializa todos os managers, roda o tick loop, expõe API pra UI,
 * emite eventos quando o state muda.
 */

import { UI_UPDATE_RATE } from '../lib/constants';
import { BuildingManager } from './buildings/BuildingManager';
import { ResourceManager } from './resources/ResourceManager';
import { UpgradeManager } from './upgrades/UpgradeManager';
import { EraManager } from './eras/EraManager';
import { PrestigeManager } from './prestige/PrestigeManager';
import { SaveManager } from './state/SaveManager';
import { Ticker } from './ticker';
import { applyOfflineProgress, type OfflineReport } from './offline';
import { pickRandomEvent } from '../data/events';
import { ERAS_BY_ID } from '../data/eras';
import type { BuildingId } from '../data/buildings';
import type { GameState } from './state/GameState';

export interface EngineEvent {
  kind: 'info' | 'warn' | 'crit' | 'good';
  message: string;
}

export type EventListener = (e: EngineEvent) => void;

type StateListener = (state: GameState) => void;

export class GameEngine {
  state: GameState;
  buildings: BuildingManager;
  upgrades: UpgradeManager;
  resources: ResourceManager;
  eras: EraManager;
  prestige: PrestigeManager;
  save: SaveManager;
  offlineReport: OfflineReport | null = null;

  private ticker: Ticker;
  private listeners = new Set<StateListener>();
  private eventListeners = new Set<EventListener>();
  private renderCb: (() => void) | null = null;
  private lastUiUpdate = 0;
  private timeSinceLastEvent = 0;
  private nextEventIn = 30 + Math.random() * 90;

  constructor() {
    this.save = new SaveManager();
    this.state = this.save.load();
    this.buildings = new BuildingManager();
    this.upgrades = new UpgradeManager();
    this.prestige = new PrestigeManager();
    this.resources = new ResourceManager(this.buildings, this.upgrades, this.prestige);
    this.eras = new EraManager();
    this.ticker = new Ticker(
      (delta) => this.tick(delta),
      () => this.render()
    );

    // Offline progress no load
    const baseRate = this.resources.getEffectiveTokenRate(this.state);
    this.offlineReport = applyOfflineProgress(this.state, baseRate);
  }

  start(renderCb: () => void): void {
    this.renderCb = renderCb;
    this.save.startAutoSave(() => this.state);
    this.ticker.start();
  }

  stop(): void {
    this.ticker.stop();
    this.save.stopAutoSave();
    this.save.save(this.state);
  }

  /** Subscreve mudanças de state (chamadas a ~UI_UPDATE_RATE Hz). */
  subscribe(fn: StateListener): () => void {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }

  /** Subscreve eventos emitidos (era advance, random events). */
  onEvent(fn: EventListener): () => void {
    this.eventListeners.add(fn);
    return () => this.eventListeners.delete(fn);
  }

  private emit(e: EngineEvent): void {
    for (const fn of this.eventListeners) fn(e);
  }

  // ============================================================
  // ACTIONS
  // ============================================================

  buyBuilding(id: BuildingId): boolean {
    return this.buildings.buy(this.state, id).success;
  }

  buyUpgrade(id: string): boolean {
    return this.upgrades.buy(this.state, id).success;
  }

  buyPermanentUpgrade(id: string): boolean {
    return this.prestige.buyPermanent(this.state, id);
  }

  doPrestige(): number {
    if (!this.prestige.canPrestige(this.state)) return 0;
    const { pointsGained } = this.prestige.prestige(this.state);
    this.emit({
      kind: 'good',
      message: `NEW PARADIGM: +${pointsGained} Insight Points. Prestige #${this.state.prestigeCount}`,
    });
    return pointsGained;
  }

  click(): void {
    const bonus = Math.max(1, this.upgrades.getTokensMultiplier(this.state));
    this.resources.addTokens(this.state, bonus);
  }

  // ============================================================
  // INTERNAL
  // ============================================================

  private tick(delta: number): void {
    this.state.tickCount++;
    this.resources.tick(this.state, delta);

    // Era advance check (a cada ~0.5s)
    if (this.state.tickCount % 10 === 0) {
      const adv = this.eras.checkAdvance(this.state);
      if (adv) {
        const def = ERAS_BY_ID[adv.to];
        this.emit({
          kind: 'good',
          message: `ERA ${adv.to}: ${def.title} desbloqueada!`,
        });
      }
    }

    // Random events
    this.timeSinceLastEvent += delta;
    if (this.timeSinceLastEvent >= this.nextEventIn) {
      this.timeSinceLastEvent = 0;
      this.nextEventIn = 30 + Math.random() * 90;
      const ev = pickRandomEvent(this.state.era);
      if (ev) {
        const effectDesc = ev.apply(this.state);
        this.emit({
          kind: ev.kind === 'crit' ? 'crit' : ev.kind === 'bad' ? 'warn' : ev.kind === 'good' ? 'good' : 'info',
          message: `${ev.title} (${effectDesc})`,
        });
      }
    }

    // UI updates throttled
    const now = performance.now();
    if (now - this.lastUiUpdate >= 1000 / UI_UPDATE_RATE) {
      this.notifyListeners();
      this.lastUiUpdate = now;
    }
  }

  private render(): void {
    this.renderCb?.();
  }

  private notifyListeners(): void {
    for (const fn of this.listeners) {
      fn(this.state);
    }
  }
}
