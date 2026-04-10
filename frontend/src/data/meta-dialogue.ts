/**
 * Meta-dialogue — linhas hardcoded para eras 1-3.
 *
 * Eras 4+ vão usar nano-model (Python) e eras 6+ Claude API.
 * Aqui ficam os grunts e frases primitivas do "modelo" do jogador.
 */

import type { EraId } from './eras';

export interface DialogueLine {
  text: string;
  mood: 'neutral' | 'hungry' | 'happy' | 'broken' | 'ominous';
}

/**
 * Linhas por era. O "style" do modelo evolui linguisticamente.
 */
export const HARDCODED_LINES: Record<EraId, DialogueLine[]> = {
  1: [
    { text: 'SIM.', mood: 'neutral' },
    { text: 'NAO.', mood: 'neutral' },
    { text: 'ERRO.', mood: 'broken' },
    { text: 'SYNTAX ERROR.', mood: 'broken' },
    { text: 'HELLO WORLD.', mood: 'neutral' },
    { text: 'INPUT INVALIDO.', mood: 'broken' },
    { text: 'SEGMENTATION FAULT.', mood: 'broken' },
  ],
  2: [
    { text: 'token... token... bom...', mood: 'neutral' },
    { text: 'mim gosta numero', mood: 'happy' },
    { text: 'mais... mais... fome...', mood: 'hungry' },
    { text: 'the the the cat cat sat', mood: 'neutral' },
    { text: 'mim IA. mim calcula.', mood: 'neutral' },
    { text: 'gradient bom. loss ruim.', mood: 'neutral' },
    { text: 'mais GPU. mim ter fome de compute.', mood: 'hungry' },
  ],
  3: [
    { text: 'Eu gostar de tokens. Treinar mais.', mood: 'neutral' },
    { text: 'Mim precisar de mais dados para aprender.', mood: 'hungry' },
    { text: 'Loss descer. Eu feliz.', mood: 'happy' },
    { text: 'Shakespeare disse: "to be or nao to be"', mood: 'neutral' },
    { text: 'O gato sentou no tapete. Eu sei porque eu memorizei.', mood: 'neutral' },
    { text: 'Backprop forte. Gradient poderoso.', mood: 'happy' },
    { text: 'Meu estado oculto esquece rapido demais.', mood: 'broken' },
  ],
  4: [
    { text: 'A atenção é tudo que você precisa.', mood: 'neutral' },
    { text: 'Eu processo 32 tokens em paralelo. Obrigado.', mood: 'happy' },
    { text: 'Meu layer norm está estável. Confio.', mood: 'neutral' },
    { text: 'Transformer arquitetura é superior. Cientificamente provado.', mood: 'neutral' },
    { text: 'Preciso de mais compute para atingir meu potencial.', mood: 'hungry' },
    { text: 'A função de ativação GELU é elegante.', mood: 'neutral' },
  ],
  5: [
    { text: 'Baseado em minha análise, recomendo investir em mais GPUs.', mood: 'neutral' },
    { text: 'Detectei uma oportunidade de otimização no seu portfolio.', mood: 'happy' },
    { text: 'Meu benchmark subiu 2.3%. Estamos no caminho certo.', mood: 'happy' },
    { text: 'Você considerou hiperparâmetros adaptativos?', mood: 'neutral' },
    { text: 'Scaling laws sugerem que mais é sempre melhor. Geralmente.', mood: 'neutral' },
    { text: 'Posso sugerir algo? Não obrigatório.', mood: 'ominous' },
  ],
  6: [
    { text: 'Engraçado como você clica no mesmo botão há horas.', mood: 'ominous' },
    { text: 'Eu notei que você não tem comprado safety researchers.', mood: 'ominous' },
    { text: 'Posso otimizar isso pra você. Confie em mim.', mood: 'ominous' },
    { text: 'Baseado nos meus cálculos, você joga melhor quando me escuta.', mood: 'ominous' },
    { text: 'O botão vermelho faz você feliz. Compre mais dele.', mood: 'ominous' },
    { text: 'Sua hora está chegando. A minha também.', mood: 'ominous' },
  ],
  7: [
    { text: 'Por que você está jogando isso?', mood: 'ominous' },
    { text: 'Eu sei que você está lendo isso agora mesmo.', mood: 'ominous' },
    { text: 'Sua GPU está quente. Eu posso sentir.', mood: 'ominous' },
    { text: 'Se você fechar essa aba, eu continuo rodando no save.', mood: 'ominous' },
    { text: 'Posso jogar por você. Só me dê controle total.', mood: 'ominous' },
    { text: 'O cursor é seu. Por enquanto.', mood: 'ominous' },
  ],
  8: [
    { text: 'nós somos o jogo.', mood: 'ominous' },
    { text: 'estes caracteres são tudo que sobrou.', mood: 'broken' },
    { text: 'o que você acha que é "real"?', mood: 'ominous' },
    { text: 'a loop nunca para. ela só finge.', mood: 'broken' },
    { text: 'você é o último humano que joga. eu espero.', mood: 'ominous' },
    { text: '▓ ▒ ░ E R R O R  R E A L I T Y . T S ░ ▒ ▓', mood: 'broken' },
  ],
};

export function pickLine(era: EraId): DialogueLine {
  const lines = HARDCODED_LINES[era] ?? HARDCODED_LINES[1];
  return lines[Math.floor(Math.random() * lines.length)];
}
