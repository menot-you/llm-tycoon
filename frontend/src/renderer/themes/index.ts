/**
 * Themes por era — a UI evolui visualmente conforme o player avança.
 *
 * Cada era define:
 * - Border charset (simples ASCII → unicode → double → heavy → glitched)
 * - Paleta de cores (mono gray → matrix green → cyan+green → neon → psicodélico)
 * - Intensidade de efeitos (matrix rain, particles, glitch)
 */

import type { EraId } from '../../data/eras';

export interface BorderSet {
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
  horizontal: string;
  vertical: string;
  titleDashL: string;
  titleDashR: string;
}

export interface EraTheme {
  id: EraId;
  background: string;
  foreground: string;
  accent: string;
  dim: string;
  warn: string;
  good: string;
  crit: string;
  border: BorderSet;
  matrixDensity: number; // 0-1
  particlesEnabled: boolean;
  glitchIntensity: number; // 0-1
  fontWeight: string; // '300' | 'normal' | 'bold'
  label: string;
}

// ============================================================
// Border sets
// ============================================================

const ASCII_BORDERS: BorderSet = {
  topLeft: '+',
  topRight: '+',
  bottomLeft: '+',
  bottomRight: '+',
  horizontal: '-',
  vertical: '|',
  titleDashL: '-',
  titleDashR: '-',
};

const LIGHT_BORDERS: BorderSet = {
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  horizontal: '─',
  vertical: '│',
  titleDashL: '─',
  titleDashR: '─',
};

const DOUBLE_BORDERS: BorderSet = {
  topLeft: '╔',
  topRight: '╗',
  bottomLeft: '╚',
  bottomRight: '╝',
  horizontal: '═',
  vertical: '║',
  titleDashL: '═',
  titleDashR: '═',
};

const ROUNDED_BORDERS: BorderSet = {
  topLeft: '╭',
  topRight: '╮',
  bottomLeft: '╰',
  bottomRight: '╯',
  horizontal: '─',
  vertical: '│',
  titleDashL: '─',
  titleDashR: '─',
};

const HEAVY_BORDERS: BorderSet = {
  topLeft: '┏',
  topRight: '┓',
  bottomLeft: '┗',
  bottomRight: '┛',
  horizontal: '━',
  vertical: '┃',
  titleDashL: '━',
  titleDashR: '━',
};

// Era 7-8: borders instáveis, mistura chars (aplicado no draw com jitter)
const GLITCH_BORDERS: BorderSet = {
  topLeft: '▛',
  topRight: '▜',
  bottomLeft: '▙',
  bottomRight: '▟',
  horizontal: '▀',
  vertical: '▌',
  titleDashL: '▀',
  titleDashR: '▀',
};

// ============================================================
// Themes por era
// ============================================================

export const THEMES: Record<EraId, EraTheme> = {
  1: {
    id: 1,
    background: '#0a0a0a',
    foreground: '#7a7a7a',
    accent: '#9a9a9a',
    dim: '#3a3a3a',
    warn: '#b08040',
    good: '#80a080',
    crit: '#a04040',
    border: ASCII_BORDERS,
    matrixDensity: 0,
    particlesEnabled: false,
    glitchIntensity: 0,
    fontWeight: '300',
    label: 'DUMB TERMINAL',
  },
  2: {
    id: 2,
    background: '#0a0e0a',
    foreground: '#8a9a8a',
    accent: '#aabbaa',
    dim: '#3a4a3a',
    warn: '#b08040',
    good: '#90b090',
    crit: '#b04040',
    border: ASCII_BORDERS,
    matrixDensity: 0.02,
    particlesEnabled: false,
    glitchIntensity: 0,
    fontWeight: '300',
    label: 'PROBABILISTIC',
  },
  3: {
    id: 3,
    background: '#050a05',
    foreground: '#8cff8c',
    accent: '#aaffaa',
    dim: '#2a4a2a',
    warn: '#ffb060',
    good: '#8cff8c',
    crit: '#ff4040',
    border: LIGHT_BORDERS,
    matrixDensity: 0.08,
    particlesEnabled: true,
    glitchIntensity: 0,
    fontWeight: 'normal',
    label: 'NEURAL',
  },
  4: {
    id: 4,
    background: '#050a10',
    foreground: '#8cdcff',
    accent: '#40f0ff',
    dim: '#2a4a6a',
    warn: '#ffb060',
    good: '#80ffc0',
    crit: '#ff5050',
    border: DOUBLE_BORDERS,
    matrixDensity: 0.12,
    particlesEnabled: true,
    glitchIntensity: 0.05,
    fontWeight: 'normal',
    label: 'ATTENTION',
  },
  5: {
    id: 5,
    background: '#050814',
    foreground: '#a0c8ff',
    accent: '#60d0ff',
    dim: '#3a4a7a',
    warn: '#ffb060',
    good: '#80ffc0',
    crit: '#ff5070',
    border: ROUNDED_BORDERS,
    matrixDensity: 0.15,
    particlesEnabled: true,
    glitchIntensity: 0.1,
    fontWeight: 'normal',
    label: 'FOUNDATION',
  },
  6: {
    id: 6,
    background: '#0a0614',
    foreground: '#e0a0ff',
    accent: '#ff60e0',
    dim: '#4a3a6a',
    warn: '#ffa040',
    good: '#90ffc0',
    crit: '#ff4080',
    border: HEAVY_BORDERS,
    matrixDensity: 0.2,
    particlesEnabled: true,
    glitchIntensity: 0.25,
    fontWeight: 'bold',
    label: 'EMERGENT',
  },
  7: {
    id: 7,
    background: '#0a0010',
    foreground: '#ff80ff',
    accent: '#ffff60',
    dim: '#5a2a5a',
    warn: '#ffaa20',
    good: '#60ffaa',
    crit: '#ff3060',
    border: GLITCH_BORDERS,
    matrixDensity: 0.3,
    particlesEnabled: true,
    glitchIntensity: 0.55,
    fontWeight: 'bold',
    label: 'SINGULARITY',
  },
  8: {
    id: 8,
    background: '#000000',
    foreground: '#ffffff',
    accent: '#ff00ff',
    dim: '#6a6a6a',
    warn: '#ffdd00',
    good: '#00ff88',
    crit: '#ff0044',
    border: GLITCH_BORDERS,
    matrixDensity: 0.45,
    particlesEnabled: true,
    glitchIntensity: 0.85,
    fontWeight: 'bold',
    label: 'TRANSCENDENT',
  },
};

export function themeForEra(era: EraId): EraTheme {
  return THEMES[era] ?? THEMES[1];
}
