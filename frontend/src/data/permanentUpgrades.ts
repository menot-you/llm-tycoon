/**
 * Permanent upgrades — compráveis com Insight Points.
 *
 * Persistem através de prestiges. Efeitos aplicados em runtime.
 */

export type PermanentEffect =
  | 'start_tokens' // começa com N tokens
  | 'production_mult' // multiplier base de produção
  | 'offline_efficiency' // +% eficiência offline
  | 'starting_building' // começa com 1 building X
  | 'hallucination_base' // -N base hallucination rate
  | 'cheaper_upgrades'; // -N% custo de upgrades

export interface PermanentUpgradeDef {
  id: string;
  name: string;
  description: string;
  cost: number; // em insight points
  effect: PermanentEffect;
  value: number;
  maxStacks?: number;
  flavor: string;
}

export const PERMANENT_UPGRADES: PermanentUpgradeDef[] = [
  {
    id: 'hindsight',
    name: 'Hindsight Bias',
    description: 'Começa cada run com 100 tokens',
    cost: 1,
    effect: 'start_tokens',
    value: 100,
    maxStacks: 10,
    flavor: 'Você lembra como resolver isso. Só não sabe como.',
  },
  {
    id: 'transfer_learning',
    name: 'Transfer Learning',
    description: '+10% produção base',
    cost: 3,
    effect: 'production_mult',
    value: 1.1,
    maxStacks: 20,
    flavor: 'Weights anteriores ecoam pelos latent spaces.',
  },
  {
    id: 'scaling_laws',
    name: 'Scaling Laws',
    description: '+5% eficiência offline',
    cost: 5,
    effect: 'offline_efficiency',
    value: 0.05,
    maxStacks: 6,
    flavor: 'Quanto mais parâmetros, melhor. Provavelmente.',
  },
  {
    id: 'better_benchmarks',
    name: 'Better Benchmarks',
    description: '-10% crescimento de alucinação',
    cost: 8,
    effect: 'hallucination_base',
    value: 0.1,
    maxStacks: 5,
    flavor: 'Se você mede, você controla. Ou inventa.',
  },
  {
    id: 'vc_connections',
    name: 'VC Connections',
    description: '-20% custo de upgrades',
    cost: 10,
    effect: 'cheaper_upgrades',
    value: 0.2,
    maxStacks: 3,
    flavor: 'Andreessen atende seu DM.',
  },
  {
    id: 'recursive_improve',
    name: 'Recursive Self-Improvement',
    description: '+50% produção base (raro)',
    cost: 50,
    effect: 'production_mult',
    value: 1.5,
    maxStacks: 3,
    flavor: 'O modelo treina o modelo que treina você.',
  },
];

export const PERMANENT_UPGRADES_BY_ID: Record<string, PermanentUpgradeDef> =
  PERMANENT_UPGRADES.reduce(
    (acc, u) => ({ ...acc, [u.id]: u }),
    {} as Record<string, PermanentUpgradeDef>
  );
