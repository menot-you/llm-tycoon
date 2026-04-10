/**
 * Number formatting — sufixos K, M, B, T, Qa, Qi, Sx...
 *
 * Idle games precisam mostrar números enormes de forma legível.
 */

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

export function formatNumber(value: number, decimals: number = 1): string {
  if (!Number.isFinite(value)) return '∞';
  if (Math.abs(value) < 1000) {
    return value.toFixed(decimals).replace(/\.0+$/, '');
  }

  const tier = Math.floor(Math.log10(Math.abs(value)) / 3);
  if (tier >= SUFFIXES.length) {
    // Notação científica pra valores absurdos
    return value.toExponential(2);
  }

  const scaled = value / Math.pow(10, tier * 3);
  const suffix = SUFFIXES[tier];
  return `${scaled.toFixed(decimals).replace(/\.0+$/, '')}${suffix}`;
}

/** Formato simples sem decimais (pra inteiros). */
export function formatInt(value: number): string {
  return formatNumber(Math.floor(value), 0);
}

/** Formato pra rate (per second). */
export function formatRate(value: number): string {
  return `${formatNumber(value, 1)}/s`;
}
