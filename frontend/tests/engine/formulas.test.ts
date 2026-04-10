import { describe, it, expect } from 'vitest';
import {
  buildingCost,
  buildingBulkCost,
  buildingProduction,
  insightPointsFromPrestige,
  prestigeMultiplier,
  offlineProduction,
  capabilityScore,
} from '../../src/engine/resources/formulas';

describe('buildingCost', () => {
  it('retorna base_cost quando owned = 0', () => {
    expect(buildingCost(100, 1.15, 0)).toBe(100);
  });

  it('aplica growth rate exponencial', () => {
    // 100 × 1.15^10 ≈ 404.55 → floor 404
    expect(buildingCost(100, 1.15, 10)).toBe(404);
  });

  it('segue a progressão 15 → 17 → 19 → 22 → 26 pro if/else bot', () => {
    // base 15, growth 1.15
    expect(buildingCost(15, 1.15, 0)).toBe(15);
    expect(buildingCost(15, 1.15, 1)).toBe(17);
    expect(buildingCost(15, 1.15, 2)).toBe(19); // 15 × 1.3225 = 19.8375 → floor 19
    expect(buildingCost(15, 1.15, 3)).toBe(22);
    expect(buildingCost(15, 1.15, 4)).toBe(26);
  });

  it('handles MAX_SAFE_INTEGER sem estourar', () => {
    const cost = buildingCost(1e10, 1.3, 100);
    expect(cost).toBeGreaterThan(0);
    expect(Number.isFinite(cost)).toBe(true);
  });
});

describe('buildingBulkCost', () => {
  it('retorna 0 pra bulk 0', () => {
    expect(buildingBulkCost(100, 1.15, 0, 0)).toBe(0);
  });

  it('equivale a soma de buildingCost pra bulk pequeno', () => {
    const soma = buildingCost(100, 1.15, 0) + buildingCost(100, 1.15, 1) + buildingCost(100, 1.15, 2);
    const bulk = buildingBulkCost(100, 1.15, 0, 3);
    // Soma direta vs geométrica diverge por arredondamento (<5%)
    expect(Math.abs(bulk - soma) / soma).toBeLessThan(0.05);
  });

  it('handles growth rate = 1 (custo linear)', () => {
    expect(buildingBulkCost(50, 1, 10, 5)).toBe(250);
  });
});

describe('buildingProduction', () => {
  it('multiplica base × owned', () => {
    expect(buildingProduction(0.1, 10)).toBeCloseTo(1);
    expect(buildingProduction(260, 5)).toBe(1300);
  });

  it('retorna 0 quando owned = 0', () => {
    expect(buildingProduction(100, 0)).toBe(0);
  });
});

describe('insightPointsFromPrestige', () => {
  it('retorna 0 abaixo do threshold', () => {
    expect(insightPointsFromPrestige(500_000)).toBe(0);
    expect(insightPointsFromPrestige(999_999)).toBe(0);
  });

  it('retorna 0 exato em 1M tokens (log2(1) = 0)', () => {
    expect(insightPointsFromPrestige(1_000_000)).toBe(0);
  });

  it('escala logaritmicamente', () => {
    expect(insightPointsFromPrestige(2_000_000)).toBe(1); // log2(2)
    expect(insightPointsFromPrestige(4_000_000)).toBe(2); // log2(4)
    expect(insightPointsFromPrestige(1_024_000_000)).toBe(10); // log2(1024)
  });
});

describe('prestigeMultiplier', () => {
  it('retorna 1 sem IP', () => {
    expect(prestigeMultiplier(0)).toBe(1);
  });

  it('adiciona 5% por IP', () => {
    expect(prestigeMultiplier(10)).toBeCloseTo(1.5);
    expect(prestigeMultiplier(20)).toBeCloseTo(2);
  });
});

describe('offlineProduction', () => {
  it('calcula produção offline com eficiência', () => {
    // 1h (3600s) × 50% × 10/s = 18000
    expect(offlineProduction(3600, 0.5, 10)).toBe(18000);
  });

  it('respeita eficiência máxima', () => {
    expect(offlineProduction(3600, 0.8, 10)).toBe(28800);
  });

  it('retorna 0 quando offline_seconds = 0', () => {
    expect(offlineProduction(0, 0.5, 100)).toBe(0);
  });
});

describe('capabilityScore', () => {
  it('escala com era e prestige', () => {
    // 1000 buildings × era 5 × mult 1 = 5000
    expect(capabilityScore(1000, 5, 0)).toBe(5000);
    // mesma coisa com 10 IP: × 1.5 = 7500
    expect(capabilityScore(1000, 5, 10)).toBe(7500);
  });
});
