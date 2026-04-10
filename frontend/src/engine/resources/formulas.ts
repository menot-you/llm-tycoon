/**
 * Fórmulas core do jogo — centralizadas pra facilitar balanceamento e testes.
 *
 * Nunca hardcode fórmulas em managers — sempre importa daqui.
 */

import { PRESTIGE_BONUS_PER_POINT, PRESTIGE_FORMULA_DIVISOR } from '../../lib/constants';

/**
 * Custo do próximo building dado quantos já foram comprados.
 * custo(n) = base_cost × growth_rate^n
 */
export function buildingCost(baseCost: number, growthRate: number, owned: number): number {
  return Math.floor(baseCost * Math.pow(growthRate, owned));
}

/**
 * Custo total de comprar `n` buildings a partir de `owned`.
 * Soma geométrica: base × (g^(owned+n) - g^owned) / (g - 1)
 */
export function buildingBulkCost(
  baseCost: number,
  growthRate: number,
  owned: number,
  bulk: number
): number {
  if (bulk <= 0) return 0;
  if (growthRate === 1) return Math.floor(baseCost * bulk);
  const factor =
    (Math.pow(growthRate, owned + bulk) - Math.pow(growthRate, owned)) / (growthRate - 1);
  return Math.floor(baseCost * factor);
}

/**
 * Produção base de um building dado quantos foram comprados.
 * production = base_production × owned
 */
export function buildingProduction(baseProduction: number, owned: number): number {
  return baseProduction * owned;
}

/**
 * Insight Points ganhos em um prestige.
 * IP = floor(log2(total_tokens_earned / divisor))
 * Mínimo 0 (não pode prestige sem atingir o threshold mínimo).
 */
export function insightPointsFromPrestige(totalTokensEarned: number): number {
  if (totalTokensEarned < PRESTIGE_FORMULA_DIVISOR) return 0;
  return Math.floor(Math.log2(totalTokensEarned / PRESTIGE_FORMULA_DIVISOR));
}

/**
 * Multiplicador de prestige dado o total de IP acumulado.
 * multiplier = 1 + (IP × bonus_per_point)
 */
export function prestigeMultiplier(insightPoints: number): number {
  return 1 + insightPoints * PRESTIGE_BONUS_PER_POINT;
}

/**
 * Quanto da produção offline é creditada.
 * efficiency base: 50%, upgradável até 80% via prestige.
 * Input: segundos offline, eficiência (0.5-0.8), produção/s
 */
export function offlineProduction(
  offlineSeconds: number,
  efficiency: number,
  productionPerSecond: number
): number {
  return Math.floor(offlineSeconds * efficiency * productionPerSecond);
}

/**
 * Capability score — usado pra ranking PvP.
 * Soma weighted de buildings × era × prestige mult.
 */
export function capabilityScore(
  totalBuildingValue: number,
  era: number,
  insightPoints: number
): number {
  return Math.floor(totalBuildingValue * era * prestigeMultiplier(insightPoints));
}
