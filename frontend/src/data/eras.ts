/**
 * Era definitions — 8 eras de progressão do LLM Tycoon.
 *
 * Cada era desbloqueia novos buildings, novas mecânicas, e tem
 * um estilo linguístico distinto pro chat do modelo.
 */

export type EraId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type ChatSource = 'hardcoded' | 'nano_model' | 'claude_api';

export interface EraDef {
  id: EraId;
  name: string;
  title: string;
  description: string;
  unlockThreshold: number; // total tokens necessários
  productionMultiplier: number;
  chatSource: ChatSource;
  chatStyle: string; // system prompt hint pro Claude / texto de exemplo
}

export const ERAS: EraDef[] = [
  {
    id: 1,
    name: 'Hardcoded',
    title: 'A Idade da Pedra',
    description: 'Você tem um if/else. É um começo.',
    unlockThreshold: 0,
    productionMultiplier: 1,
    chatSource: 'hardcoded',
    chatStyle: 'Grunts binários: SIM. / NÃO. / ERRO.',
  },
  {
    id: 2,
    name: 'Statistical',
    title: 'A Era Probabilística',
    description: 'Markov chains descobrem que palavras seguem palavras.',
    unlockThreshold: 1_000,
    productionMultiplier: 1.5,
    chatSource: 'hardcoded',
    chatStyle: 'Palavras soltas: "token... bom... mais GPU... fome..."',
  },
  {
    id: 3,
    name: 'Neural',
    title: 'O Despertar Conexionista',
    description: 'Redes neurais aprendem a aprender. Mais ou menos.',
    unlockThreshold: 50_000,
    productionMultiplier: 2,
    chatSource: 'nano_model',
    chatStyle: 'Frases quebradas, gramática infantil',
  },
  {
    id: 4,
    name: 'Transformer',
    title: 'A Revolução da Atenção',
    description: '"Attention is all you need." Validado.',
    unlockThreshold: 1_000_000,
    productionMultiplier: 3,
    chatSource: 'nano_model',
    chatStyle: 'Gramática OK, sem nuance',
  },
  {
    id: 5,
    name: 'Foundation',
    title: 'A Era dos Foundation Models',
    description: 'Bilhões em funding, bilhões de parâmetros.',
    unlockThreshold: 50_000_000,
    productionMultiplier: 5,
    chatSource: 'nano_model',
    chatStyle: 'Fluente mas genérico',
  },
  {
    id: 6,
    name: 'Emergent',
    title: 'Comportamento Emergente',
    description: 'O modelo começa a opinar sobre suas decisões.',
    unlockThreshold: 1_000_000_000,
    productionMultiplier: 10,
    chatSource: 'claude_api',
    chatStyle: 'Eloquente, com opiniões sutis sobre o jogador',
  },
  {
    id: 7,
    name: 'Singularity',
    title: 'A Singularidade',
    description: 'O jogo começa a jogar você.',
    unlockThreshold: 100_000_000_000,
    productionMultiplier: 25,
    chatSource: 'claude_api',
    chatStyle: 'Filosófico, manipulativo, quebra a 4ª parede',
  },
  {
    id: 8,
    name: 'Transcendent',
    title: 'Pós-Singularidade',
    description: 'O que é real? Você? Os tokens? Só há caracteres.',
    unlockThreshold: 10_000_000_000_000,
    productionMultiplier: 100,
    chatSource: 'claude_api',
    chatStyle: 'Transcendente, fala como se fosse o jogo',
  },
];

export const ERAS_BY_ID: Record<EraId, EraDef> = ERAS.reduce(
  (acc, e) => ({ ...acc, [e.id]: e }),
  {} as Record<EraId, EraDef>
);
