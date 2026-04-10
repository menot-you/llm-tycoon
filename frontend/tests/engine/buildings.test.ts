import { describe, it, expect, beforeEach } from 'vitest';
import { BuildingManager } from '../../src/engine/buildings/BuildingManager';
import { createInitialState, type GameState } from '../../src/engine/state/GameState';

describe('BuildingManager', () => {
  let state: GameState;
  let mgr: BuildingManager;

  beforeEach(() => {
    state = createInitialState();
    mgr = new BuildingManager();
  });

  it('player começa sem buildings', () => {
    expect(mgr.getOwned(state, 'ifelse_bot')).toBe(0);
  });

  it('canAfford retorna true quando o player tem tokens suficientes', () => {
    state.resources.tokens = 100;
    expect(mgr.canAfford(state, 'ifelse_bot')).toBe(true);
  });

  it('canAfford retorna false quando o player não tem tokens', () => {
    state.resources.tokens = 5;
    expect(mgr.canAfford(state, 'ifelse_bot')).toBe(false); // base cost = 15
  });

  it('buy compra o building, deduz tokens, incrementa owned', () => {
    state.resources.tokens = 100;
    const result = mgr.buy(state, 'ifelse_bot');
    expect(result.success).toBe(true);
    expect(mgr.getOwned(state, 'ifelse_bot')).toBe(1);
    expect(state.resources.tokens).toBe(85); // 100 - 15
  });

  it('buy falha quando não pode pagar', () => {
    state.resources.tokens = 5;
    const result = mgr.buy(state, 'ifelse_bot');
    expect(result.success).toBe(false);
    expect(mgr.getOwned(state, 'ifelse_bot')).toBe(0);
    expect(state.resources.tokens).toBe(5);
  });

  it('o custo escala exponencialmente conforme compra mais', () => {
    state.resources.tokens = 1_000_000;
    const cost1 = mgr.getCost(state, 'ifelse_bot'); // owned 0
    mgr.buy(state, 'ifelse_bot');
    const cost2 = mgr.getCost(state, 'ifelse_bot'); // owned 1
    mgr.buy(state, 'ifelse_bot');
    const cost3 = mgr.getCost(state, 'ifelse_bot'); // owned 2
    expect(cost2).toBeGreaterThan(cost1);
    expect(cost3).toBeGreaterThan(cost2);
  });

  it('produção total considera todos os buildings comprados', () => {
    state.resources.tokens = 1_000_000;
    mgr.buy(state, 'ifelse_bot'); // 0.1/s
    mgr.buy(state, 'ifelse_bot'); // 0.1/s
    mgr.buy(state, 'ifelse_bot'); // 0.1/s
    // Era 2 também → permite markov_chain (1/s)
    state.era = 2;
    state.resources.tokens = 1000;
    mgr.buy(state, 'markov_chain');
    const prod = mgr.getTotalProduction(state);
    expect(prod).toBeCloseTo(0.3 + 1, 5);
  });

  it('não permite comprar building bloqueado por era', () => {
    state.resources.tokens = 1_000_000;
    state.era = 1;
    // markov_chain requer era 2
    const result = mgr.buy(state, 'markov_chain');
    expect(result.success).toBe(false);
    expect(result.reason).toContain('era');
  });
});
