/**
 * GameState — Shape completo do estado do jogo.
 *
 * Essa é a única source of truth. Tudo o que pode ser salvo,
 * carregado, renderizado ou sincronizado passa por aqui.
 */

import type { BuildingId } from '../../data/buildings';
import type { EraId } from '../../data/eras';

/** Versão do save format — incrementa quando muda shape pra migrations */
export const SAVE_VERSION = 2;

export interface Resources {
  tokens: number;
  compute: number;
  data: number;
  funding: number;
  hype: number;
  hallucinations: number;
}

export interface GameState {
  version: number;

  // Tempo
  createdAt: number; // timestamp ms
  lastTick: number; // timestamp ms do último tick salvo
  tickCount: number;

  // Recursos
  resources: Resources;
  totalTokensEarned: number; // acumulado pra prestige

  // Buildings
  buildings: Partial<Record<BuildingId, number>>;

  // Upgrades comprados (por id)
  upgrades: string[];

  // Era atual
  era: EraId;

  // Prestige
  prestigeCount: number;
  insightPoints: number;
  permanentUpgrades: string[];

  // Reborn (meta-prestige)
  rebornCount: number;
  rebornPoints: number;
  unlockedPerks: string[]; // array of perk IDs (duplicados pra stacks)
  totalPrestigesAllTime: number; // acumulado entre reborns
  mlStepsTrained: number; // sincronizado com Python /evaluate
  mlCapabilityScore: number;

  // Achievements
  achievements: string[]; // ids desbloqueados

  // Player identity (PvP)
  playerId: string | null;
  displayName: string;
}

export const INITIAL_STATE: GameState = {
  version: SAVE_VERSION,
  createdAt: Date.now(),
  lastTick: Date.now(),
  tickCount: 0,
  resources: {
    tokens: 0,
    compute: 0,
    data: 0,
    funding: 0,
    hype: 0,
    hallucinations: 0,
  },
  totalTokensEarned: 0,
  buildings: {},
  upgrades: [],
  era: 1,
  prestigeCount: 0,
  insightPoints: 0,
  permanentUpgrades: [],
  rebornCount: 0,
  rebornPoints: 0,
  unlockedPerks: [],
  totalPrestigesAllTime: 0,
  mlStepsTrained: 0,
  mlCapabilityScore: 0,
  achievements: [],
  playerId: null,
  displayName: 'Anonymous Founder',
};

/** Cria um estado novo (helper para reset/prestige) */
export function createInitialState(): GameState {
  return JSON.parse(JSON.stringify(INITIAL_STATE));
}
