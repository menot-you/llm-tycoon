/**
 * Upgrade definitions — multiplicadores e desbloqueios.
 *
 * Upgrades são one-shot: compra, aplica o efeito permanentemente.
 * Categorias: infra (gpu/compute), data, staff, hype.
 */

export type UpgradeCategory = 'infra' | 'data' | 'staff' | 'hype' | 'safety';

export type EffectKind =
  | 'tokens_mult' // multiplica produção de tokens
  | 'compute_mult'
  | 'data_mult'
  | 'hype_gain' // +hype por tick
  | 'hallucination_reduction' // -alucinação por tick
  | 'funding_mult';

export interface UpgradeEffect {
  kind: EffectKind;
  value: number;
}

export interface UpgradeDef {
  id: string;
  name: string;
  description: string;
  category: UpgradeCategory;
  cost: number;
  costResource: 'tokens' | 'funding';
  eraRequired: number;
  effects: UpgradeEffect[];
  flavor: string;
}

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'used_gpu',
    name: 'Used GPU from eBay',
    description: '+50% produção de tokens',
    category: 'infra',
    cost: 500,
    costResource: 'tokens',
    eraRequired: 1,
    effects: [{ kind: 'tokens_mult', value: 1.5 }],
    flavor: 'Cheira a mineração de crypto.',
  },
  {
    id: 'rtx_4090',
    name: 'RTX 4090 Cluster',
    description: '+100% produção de tokens',
    category: 'infra',
    cost: 5_000,
    costResource: 'tokens',
    eraRequired: 2,
    effects: [{ kind: 'tokens_mult', value: 2 }],
    flavor: 'Gaming? Não, treino de IA.',
  },
  {
    id: 'a100_pod',
    name: 'A100 Pod',
    description: '+200% produção de tokens',
    category: 'infra',
    cost: 100_000,
    costResource: 'tokens',
    eraRequired: 3,
    effects: [{ kind: 'tokens_mult', value: 3 }],
    flavor: 'A conta de luz triplicou.',
  },
  {
    id: 'wikipedia_scrape',
    name: 'Wikipedia Scrape',
    description: '+100% qualidade de data',
    category: 'data',
    cost: 2_000,
    costResource: 'tokens',
    eraRequired: 2,
    effects: [{ kind: 'data_mult', value: 2 }],
    flavor: 'Bom para aprender capitais e datas.',
  },
  {
    id: 'reddit_firehose',
    name: 'Reddit Firehose',
    description: '+150% data, +10% alucinação',
    category: 'data',
    cost: 15_000,
    costResource: 'tokens',
    eraRequired: 3,
    effects: [{ kind: 'data_mult', value: 2.5 }],
    flavor: 'Aprende sarcasmo. Às vezes.',
  },
  {
    id: 'intern',
    name: 'Hire Intern',
    description: '+1 token/s manual',
    category: 'staff',
    cost: 1_000,
    costResource: 'tokens',
    eraRequired: 1,
    effects: [{ kind: 'tokens_mult', value: 1.2 }],
    flavor: 'Trabalha de graça, aprende muito.',
  },
  {
    id: 'ml_engineer',
    name: 'ML Engineer',
    description: '+25% eficiência de treino',
    category: 'staff',
    cost: 50_000,
    costResource: 'tokens',
    eraRequired: 3,
    effects: [{ kind: 'tokens_mult', value: 1.25 }],
    flavor: 'Cita papers no Twitter.',
  },
  {
    id: 'safety_researcher',
    name: 'Safety Researcher',
    description: '-30% alucinações',
    category: 'safety',
    cost: 75_000,
    costResource: 'tokens',
    eraRequired: 4,
    effects: [{ kind: 'hallucination_reduction', value: 0.3 }],
    flavor: 'Escreve "constitutional" em tudo.',
  },
  {
    id: 'rlhf',
    name: 'RLHF Pipeline',
    description: '-50% alucinações, -10% produção',
    category: 'safety',
    cost: 500_000,
    costResource: 'tokens',
    eraRequired: 5,
    effects: [
      { kind: 'hallucination_reduction', value: 0.5 },
      { kind: 'tokens_mult', value: 0.9 },
    ],
    flavor: 'Contratou 1000 Kenyans pra dizer "ruim" e "bom".',
  },
  {
    id: 'growth_hacker',
    name: 'Growth Hacker',
    description: '+200% hype/s',
    category: 'hype',
    cost: 10_000,
    costResource: 'tokens',
    eraRequired: 2,
    effects: [{ kind: 'hype_gain', value: 3 }],
    flavor: 'Tweet é diferente de Twitter.',
  },
  {
    id: 'lobbyist',
    name: 'Lobbyist',
    description: '+50% funding',
    category: 'hype',
    cost: 250_000,
    costResource: 'tokens',
    eraRequired: 5,
    effects: [{ kind: 'funding_mult', value: 1.5 }],
    flavor: 'Tem o número de vários senadores.',
  },
];

export const UPGRADES_BY_ID: Record<string, UpgradeDef> = UPGRADES.reduce(
  (acc, u) => ({ ...acc, [u.id]: u }),
  {} as Record<string, UpgradeDef>
);
