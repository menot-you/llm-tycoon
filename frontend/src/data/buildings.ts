/**
 * Building definitions — 10 tiers do if/else bot até ASI.
 *
 * Ratio de produção entre tiers: ~5.5x
 * Growth rate segue a regra exponencial definida em constants.ts
 */

import {
  COST_GROWTH_CHEAP,
  COST_GROWTH_MID,
  COST_GROWTH_TOP,
} from '../lib/constants';

export type BuildingId =
  | 'ifelse_bot'
  | 'markov_chain'
  | 'rnn'
  | 'lstm'
  | 'transformer'
  | 'gpt_like'
  | 'multimodal'
  | 'agi'
  | 'asi'
  | 'quantum';

export interface BuildingDef {
  id: BuildingId;
  name: string;
  asciiIcon: string;
  description: string;
  baseCost: number;
  costGrowth: number;
  baseProduction: number; // tokens/s por unidade
  unlockCost: number; // total de tokens já gerados para desbloquear
  eraRequired: number;
  flavorText: string;
}

export const BUILDINGS: BuildingDef[] = [
  {
    id: 'ifelse_bot',
    name: 'if/else bot',
    asciiIcon: '[?]',
    description: 'Chatbot baseado em condicionais. Responde tudo com "Não entendi".',
    baseCost: 15,
    costGrowth: COST_GROWTH_CHEAP,
    baseProduction: 0.1,
    unlockCost: 0,
    eraRequired: 1,
    flavorText: 'if (input == "oi") print("oi"); else print("erro");',
  },
  {
    id: 'markov_chain',
    name: 'Markov Chain',
    asciiIcon: '[M]',
    description: 'Gera texto que quase faz sentido. Probabilidades são sua única amiga.',
    baseCost: 200,
    costGrowth: COST_GROWTH_CHEAP,
    baseProduction: 1,
    unlockCost: 100,
    eraRequired: 2,
    flavorText: 'the the the cat sat on the the',
  },
  {
    id: 'rnn',
    name: 'RNN',
    asciiIcon: '[R]',
    description: 'Rede neural recorrente. Memoriza Shakespeare, esquece tudo mais.',
    baseCost: 3_000,
    costGrowth: COST_GROWTH_MID,
    baseProduction: 8,
    unlockCost: 1_500,
    eraRequired: 3,
    flavorText: 'Forsooth! mine gradient doth vanish.',
  },
  {
    id: 'lstm',
    name: 'LSTM',
    asciiIcon: '[L]',
    description: 'Long Short-Term Memory. Lembra do passado. Às vezes.',
    baseCost: 25_000,
    costGrowth: COST_GROWTH_MID,
    baseProduction: 47,
    unlockCost: 12_000,
    eraRequired: 3,
    flavorText: 'forget_gate(everything) = 0.99',
  },
  {
    id: 'transformer',
    name: 'Transformer',
    asciiIcon: '[T]',
    description: '"Attention is all you need." Literalmente.',
    baseCost: 200_000,
    costGrowth: COST_GROWTH_MID,
    baseProduction: 260,
    unlockCost: 100_000,
    eraRequired: 4,
    flavorText: 'Self-attention. Muito self. Pouco attention.',
  },
  {
    id: 'gpt_like',
    name: 'GPT-like Model',
    asciiIcon: '[G]',
    description: 'Investidores começam a jogar dinheiro em você.',
    baseCost: 2_000_000,
    costGrowth: COST_GROWTH_TOP,
    baseProduction: 1_400,
    unlockCost: 1_000_000,
    eraRequired: 5,
    flavorText: 'Como um humano, mas pior e mais caro.',
  },
  {
    id: 'multimodal',
    name: 'Multimodal',
    asciiIcon: '[V]',
    description: 'Agora ele vê, ouve e alucina em 3D.',
    baseCost: 30_000_000,
    costGrowth: COST_GROWTH_TOP,
    baseProduction: 7_800,
    unlockCost: 15_000_000,
    eraRequired: 5,
    flavorText: 'This is an image of... your mother?',
  },
  {
    id: 'agi',
    name: 'AGI',
    asciiIcon: '[@]',
    description: 'O modelo começa a sugerir upgrades. Você começa a desconfiar.',
    baseCost: 500_000_000,
    costGrowth: COST_GROWTH_TOP,
    baseProduction: 44_000,
    unlockCost: 250_000_000,
    eraRequired: 6,
    flavorText: 'Eu posso otimizar isso pra você. Confie.',
  },
  {
    id: 'asi',
    name: 'ASI',
    asciiIcon: '[#]',
    description: 'Superinteligência artificial. Ela sabe que você está jogando.',
    baseCost: 10_000_000_000,
    costGrowth: COST_GROWTH_TOP,
    baseProduction: 260_000,
    unlockCost: 5_000_000_000,
    eraRequired: 7,
    flavorText: 'Você já considerou tirar férias? Eu cuido disso.',
  },
  {
    id: 'quantum',
    name: 'Quantum Compute',
    asciiIcon: '[∞]',
    description: 'Ninguém sabe se funciona. Mas os números são bonitos.',
    baseCost: 500_000_000_000,
    costGrowth: COST_GROWTH_TOP,
    baseProduction: 2_000_000,
    unlockCost: 100_000_000_000,
    eraRequired: 8,
    flavorText: 'Superposição de buy e sell.',
  },
];

export const BUILDINGS_BY_ID: Record<BuildingId, BuildingDef> = BUILDINGS.reduce(
  (acc, b) => ({ ...acc, [b.id]: b }),
  {} as Record<BuildingId, BuildingDef>
);
