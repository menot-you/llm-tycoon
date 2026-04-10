/**
 * GameEngine — orquestrador central.
 *
 * Inicializa todos os managers, roda o tick loop, expõe API pra UI,
 * emite eventos quando o state muda.
 */

import { UI_UPDATE_RATE } from '../lib/constants';
import { BuildingManager } from './buildings/BuildingManager';
import { ResourceManager } from './resources/ResourceManager';
import { SaveManager } from './state/SaveManager';
import { Ticker } from './ticker';
import type { BuildingId } from '../data/buildings';
import type { GameState } from './state/GameState';

type StateListener = (state: GameState) => void;

export class GameEngine {
  state: GameState;
  buildings: BuildingManager;
  resources: ResourceManager;
  save: SaveManager;
  private ticker: Ticker;
  private listeners = new Set<StateListener>();
  private renderCb: (() => void) | null = null;
  private lastUiUpdate = 0;

  constructor() {
    this.save = new SaveManager();
    this.state = this.save.load();
    this.buildings = new BuildingManager();
    this.resources = new ResourceManager(this.buildings);
    this.ticker = new Ticker(
      (delta) => this.tick(delta),
      () => this.render()
    );
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

  // ============================================================
  // ACTIONS
  // ============================================================

  buyBuilding(id: BuildingId): boolean {
    return this.buildings.buy(this.state, id).success;
  }

  click(): void {
    this.resources.addTokens(this.state, 1);
  }

  // ============================================================
  // INTERNAL
  // ============================================================

  private tick(delta: number): void {
    this.state.tickCount++;
    this.resources.tick(this.state, delta);

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
