/**
 * Reborn Perks — segundo layer de progressão acima do Prestige.
 *
 * Perks são compráveis com Reborn Points (RP) e persistem entre reborns.
 * RP é ganho ao completar um reborn, proporcional ao prestige_count total.
 *
 * Efeitos são aplicados no ResourceManager / GameEngine via RebornManager.
 */

export type PerkEffect =
  | 'start_ip' // começa runs com N IP
  | 'neural_mult' // +% produção baseado em ML steps trained
  | 'era_discount' // -% threshold pra avançar de era
  | 'compound_prestige' // prestige bonus composto por reborn
  | 'auto_click' // +N tokens/s sem clicar
  | 'second_wind' // começa com 1 building de cada (tier 1-3)
  | 'offline_master' // eficiência offline 100%
  | 'oracle' // vê próximo evento antes dele acontecer
  | 'click_multi' // +N tokens por clique
  | 'cheaper_buildings'; // -% custo de buildings

export interface PerkDef {
  id: string;
  name: string;
  description: string;
  cost: number; // em RP
  effect: PerkEffect;
  value: number;
  maxStacks?: number;
  flavor: string;
}

export const PERKS: PerkDef[] = [
  {
    id: 'childhood_prodigy',
    name: 'Childhood Prodigy',
    description: 'Começa cada run com 50 IP',
    cost: 1,
    effect: 'start_ip',
    value: 50,
    maxStacks: 5,
    flavor: 'Você já sabia o que era softmax antes de andar.',
  },
  {
    id: 'neural_memory',
    name: 'Neural Memory',
    description: '+0.5% produção por step treinado no modelo real',
    cost: 2,
    effect: 'neural_mult',
    value: 0.005,
    maxStacks: 10,
    flavor: 'Os weights do seu nano-transformer lembram de cada run.',
  },
  {
    id: 'faster_eras',
    name: 'Fast Forward',
    description: 'Avanço de era -20% (threshold menor)',
    cost: 3,
    effect: 'era_discount',
    value: 0.2,
    maxStacks: 3,
    flavor: 'Você já viu esse filme. Sabe como ele acaba.',
  },
  {
    id: 'compound_prestige',
    name: 'Compound Prestige',
    description: 'Prestige bonus compounds +10% por reborn',
    cost: 5,
    effect: 'compound_prestige',
    value: 0.1,
    maxStacks: 5,
    flavor: 'Cada morte te deixa mais forte.',
  },
  {
    id: 'auto_click',
    name: 'Auto-Click',
    description: '+5 tokens/s permanente sem clicar',
    cost: 2,
    effect: 'auto_click',
    value: 5,
    maxStacks: 10,
    flavor: 'Você contratou um bot pra te fingir.',
  },
  {
    id: 'second_wind',
    name: 'Second Wind',
    description: 'Começa com 3 if/else bot + 2 markov',
    cost: 4,
    effect: 'second_wind',
    value: 1,
    maxStacks: 1,
    flavor: 'Seu ex-estagiário voltou assombrado.',
  },
  {
    id: 'offline_master',
    name: 'Offline Master',
    description: 'Eficiência offline 100%',
    cost: 6,
    effect: 'offline_master',
    value: 1,
    maxStacks: 1,
    flavor: 'O jogo joga tão bem quanto você. Ou melhor.',
  },
  {
    id: 'oracle',
    name: 'Oracle',
    description: 'Próximo evento aparece no EventLog antes',
    cost: 3,
    effect: 'oracle',
    value: 1,
    maxStacks: 1,
    flavor: 'Você viu esse tweet antes dele ser tweetado.',
  },
  {
    id: 'click_multi',
    name: 'Caffeinated Clicks',
    description: '+10 tokens por clique',
    cost: 1,
    effect: 'click_multi',
    value: 10,
    maxStacks: 20,
    flavor: 'Red Bull patrocinou.',
  },
  {
    id: 'cheaper_buildings',
    name: 'Bulk Discount',
    description: 'Buildings custam -15% menos',
    cost: 4,
    effect: 'cheaper_buildings',
    value: 0.15,
    maxStacks: 4,
    flavor: 'Amazon Business account.',
  },
];

export const PERKS_BY_ID: Record<string, PerkDef> = PERKS.reduce(
  (acc, p) => ({ ...acc, [p.id]: p }),
  {} as Record<string, PerkDef>
);
