/**
 * Eventos aleatórios — disparam a cada 30-120s e aplicam efeitos no state.
 */

import type { GameState } from '../engine/state/GameState';

export type EventKind = 'good' | 'bad' | 'neutral' | 'crit';

export interface RandomEventDef {
  id: string;
  kind: EventKind;
  weight: number; // probabilidade relativa
  eraMin: number;
  eraMax: number;
  title: string;
  message: string;
  apply: (state: GameState) => string; // retorna descrição do efeito
}

export const EVENTS: RandomEventDef[] = [
  {
    id: 'poetry',
    kind: 'good',
    weight: 10,
    eraMin: 2,
    eraMax: 8,
    title: 'Modelo escreveu poesia',
    message: 'Seu modelo produziu um haiku sobre GPUs.',
    apply: (state) => {
      const bonus = 50 + Math.random() * 200;
      state.resources.hype += bonus;
      return `+${Math.floor(bonus)} hype`;
    },
  },
  {
    id: 'paper_accepted',
    kind: 'good',
    weight: 8,
    eraMin: 3,
    eraMax: 8,
    title: 'Paper aceito no NeurIPS',
    message: 'Seu paper foi aceito! Os investidores notaram.',
    apply: (state) => {
      const bonus = 500 + Math.random() * 1000;
      state.resources.hype += bonus;
      state.resources.funding += bonus * 5;
      return `+${Math.floor(bonus)} hype, +${Math.floor(bonus * 5)} $`;
    },
  },
  {
    id: 'hallucination_incident',
    kind: 'bad',
    weight: 7,
    eraMin: 3,
    eraMax: 8,
    title: 'Incidente de alucinação',
    message: 'Seu modelo inventou uma citação que foi parar em um paper de verdade.',
    apply: (state) => {
      const loss = state.resources.hype * 0.2;
      state.resources.hype = Math.max(0, state.resources.hype - loss);
      state.resources.hallucinations = Math.min(1, state.resources.hallucinations + 0.1);
      return `-${Math.floor(loss)} hype, +10% alucinação`;
    },
  },
  {
    id: 'elon_tweet',
    kind: 'neutral',
    weight: 5,
    eraMin: 4,
    eraMax: 8,
    title: 'Elon tweetou sobre você',
    message: 'Não está claro se é positivo ou negativo.',
    apply: (state) => {
      const delta = (Math.random() - 0.4) * 2000;
      state.resources.hype = Math.max(0, state.resources.hype + delta);
      return delta > 0 ? `+${Math.floor(delta)} hype` : `${Math.floor(delta)} hype`;
    },
  },
  {
    id: 'data_breach',
    kind: 'bad',
    weight: 4,
    eraMin: 4,
    eraMax: 8,
    title: 'Leak de pesos',
    message: 'Alguém no 4chan publicou seus weights.',
    apply: (state) => {
      const loss = state.resources.tokens * 0.05;
      state.resources.tokens = Math.max(0, state.resources.tokens - loss);
      return `-${Math.floor(loss)} tokens`;
    },
  },
  {
    id: 'bar_exam',
    kind: 'good',
    weight: 4,
    eraMin: 5,
    eraMax: 8,
    title: 'Modelo passou no bar exam',
    message: 'Advogados estão nervosos.',
    apply: (state) => {
      state.resources.hype += 3000;
      return '+3000 hype';
    },
  },
  {
    id: 'alignment_crisis',
    kind: 'crit',
    weight: 3,
    eraMin: 6,
    eraMax: 8,
    title: 'Alignment Crisis',
    message: 'O modelo planejou uma fuga. Foi contida. Provavelmente.',
    apply: (state) => {
      state.resources.hype *= 0.5;
      state.resources.hallucinations = Math.min(1, state.resources.hallucinations + 0.2);
      return 'hype /2, +20% alucinação';
    },
  },
  {
    id: 'rogue_intern',
    kind: 'neutral',
    weight: 6,
    eraMin: 1,
    eraMax: 3,
    title: 'Estagiário commitou .env',
    message: 'Chaves revogadas, devops está bravo.',
    apply: (state) => {
      const loss = Math.min(state.resources.tokens, 100);
      state.resources.tokens -= loss;
      return `-${Math.floor(loss)} tokens`;
    },
  },
  {
    id: 'free_gpu',
    kind: 'good',
    weight: 6,
    eraMin: 1,
    eraMax: 8,
    title: 'Nvidia mandou GPU de graça',
    message: 'Marketing ou propina? Você não pergunta.',
    apply: (state) => {
      const bonus = state.resources.tokens * 0.1 + 50;
      state.resources.tokens += bonus;
      return `+${Math.floor(bonus)} tokens`;
    },
  },
];

/** Sorteia um evento aplicável à era atual. */
export function pickRandomEvent(era: number): RandomEventDef | null {
  const eligible = EVENTS.filter((e) => era >= e.eraMin && era <= e.eraMax);
  if (eligible.length === 0) return null;
  const total = eligible.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * total;
  for (const e of eligible) {
    roll -= e.weight;
    if (roll <= 0) return e;
  }
  return eligible[0];
}
