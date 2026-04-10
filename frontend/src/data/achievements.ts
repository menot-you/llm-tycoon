/**
 * Achievements — badges desbloqueáveis por conquistas.
 *
 * Verificados a cada tick pelo AchievementManager. Persistem no GameState.
 */

import type { GameState } from '../engine/state/GameState';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  hidden?: boolean;
  check: (state: GameState) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_token',
    name: 'Hello World',
    description: 'Gere seu primeiro token',
    check: (s) => s.totalTokensEarned >= 1,
  },
  {
    id: 'first_building',
    name: 'Automation',
    description: 'Compre seu primeiro building',
    check: (s) => Object.values(s.buildings).some((n) => (n ?? 0) > 0),
  },
  {
    id: 'first_upgrade',
    name: 'Min/Max',
    description: 'Compre seu primeiro upgrade',
    check: (s) => s.upgrades.length > 0,
  },
  {
    id: 'k_tokens',
    name: 'Kilo',
    description: '1K tokens gerados',
    check: (s) => s.totalTokensEarned >= 1_000,
  },
  {
    id: 'm_tokens',
    name: 'Mega',
    description: '1M tokens gerados',
    check: (s) => s.totalTokensEarned >= 1_000_000,
  },
  {
    id: 'b_tokens',
    name: 'Giga',
    description: '1B tokens gerados',
    check: (s) => s.totalTokensEarned >= 1_000_000_000,
  },
  {
    id: 'era_3',
    name: 'Neural Awakening',
    description: 'Alcance a Era Neural',
    check: (s) => s.era >= 3,
  },
  {
    id: 'era_5',
    name: 'Foundation',
    description: 'Alcance a Era Foundation',
    check: (s) => s.era >= 5,
  },
  {
    id: 'era_7',
    name: 'Singularity',
    description: 'Alcance a Era Singularity',
    check: (s) => s.era >= 7,
  },
  {
    id: 'era_8',
    name: 'Transcendent',
    description: 'Alcance a Era Transcendent',
    check: (s) => s.era >= 8,
  },
  {
    id: 'prestige_1',
    name: 'New Paradigm',
    description: 'Faça seu primeiro prestige',
    check: (s) => s.prestigeCount >= 1,
  },
  {
    id: 'prestige_5',
    name: 'Iterator',
    description: '5 prestiges acumulados',
    check: (s) => s.prestigeCount + s.totalPrestigesAllTime >= 5,
  },
  {
    id: 'reborn_1',
    name: 'Reborn',
    description: 'Realize seu primeiro reborn',
    check: (s) => s.rebornCount >= 1,
  },
  {
    id: 'reborn_5',
    name: 'Eternal',
    description: '5 reborns completados',
    check: (s) => s.rebornCount >= 5,
  },
  {
    id: 'ml_100',
    name: 'Neural Memory',
    description: '100 steps treinados no modelo real',
    check: (s) => s.mlStepsTrained >= 100,
  },
  {
    id: 'hype_10k',
    name: 'Going Viral',
    description: '10K hype acumulado',
    check: (s) => s.resources.hype >= 10_000,
  },
  {
    id: 'all_buildings',
    name: 'Tech Tree',
    description: 'Tenha todos os 10 buildings com ≥1 unit',
    check: (s) => {
      const types = [
        'ifelse_bot',
        'markov_chain',
        'rnn',
        'lstm',
        'transformer',
        'gpt_like',
        'multimodal',
        'agi',
        'asi',
        'quantum',
      ];
      return types.every((id) => (s.buildings[id as keyof typeof s.buildings] ?? 0) > 0);
    },
  },
  {
    id: 'touch_grass',
    name: 'Touch Grass',
    description: 'Volte após 1h+ offline',
    hidden: true,
    check: () => false, // setado manualmente pelo offline report
  },
  {
    id: 'singularity_pet',
    name: 'Good Pet',
    description: 'Ouça o modelo na Era 7',
    hidden: true,
    check: () => false, // reservado pra easter egg
  },
];

export const ACHIEVEMENTS_BY_ID: Record<string, AchievementDef> = ACHIEVEMENTS.reduce(
  (acc, a) => ({ ...acc, [a.id]: a }),
  {} as Record<string, AchievementDef>
);
