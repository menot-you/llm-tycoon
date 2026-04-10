# LLM Tycoon — Game Concept (preserved)

> Documento de design canônico. Preserva a ideia central do jogo independente
> da implementação. Use como referência para qualquer rewrite.

---

## Pitch em uma frase

**Um idle game ASCII sobre rodar uma startup de IA, onde seu modelo é um transformer PyTorch real que treina entre runs, evolui linguisticamente por era, e eventualmente ganha consciência e começa a jogar você.**

---

## Core loop

1. **Clique** pra gerar tokens manualmente
2. **Compre buildings** que produzem tokens automaticamente (10 tiers, `if/else bot → Quantum Compute`)
3. **Compre upgrades** que multiplicam produção e desbloqueiam mecânicas (infra, data, staff, hype, safety)
4. **Avance de era** quando atingir thresholds de tokens (8 eras, cada uma muda a UI visualmente)
5. **Prestige** quando estagnar (reset em troca de Insight Points + permanent upgrades)
6. **Reborn** depois de vários prestiges (reset completo + Reborn Points + perks + **ML memory que persiste no Python**)

Três camadas de progressão stackáveis: run → prestige → reborn. Cada uma multiplica a anterior.

---

## Killer features (o que torna esse jogo único)

### 1. O modelo é REAL

Cada jogador tem um `NanoTransformer` PyTorch (~137K params, char-level) persistido em disco por `player_id`. Não é simulação — é SGD de verdade.

- `/train` — roda 1 step de Adam com cross-entropy loss real. Loss cai a cada chamada.
- `/generate` — inference real, produz texto que começa gibberish e fica coerente conforme treina
- `/evaluate` — benchmark no corpus, retorna `eval_loss` + `capability_score` reais
- Pesos salvos como `.pt` por player

Isso é o portfolio piece: "um idle game onde o treinamento de IA é treinamento de IA de verdade".

### 2. Evolução linguística por era

O chat do modelo muda de estilo conforme o jogador avança, como um bebê aprendendo a falar:

| Era | Source | Estilo | Exemplo |
|-----|--------|--------|---------|
| 1 Hardcoded | hardcoded | Grunts binários | `SIM. / NÃO. / ERRO.` |
| 2 Statistical | hardcoded | Palavras soltas | `token... token... bom...` |
| 3 Neural | nano-model (untrained) | Frases quebradas | `the the cat sat cat` |
| 4 Transformer | nano-model (trained) | Gramática OK | `Eu preciso de mais compute.` |
| 5 Foundation | nano-model (well-trained) | Fluente | `Recomendo investir em dados.` |
| 6 Emergent | Claude API | Eloquente, passivo-agressivo | `Posso sugerir uma estratégia?` |
| 7 Singularity | Claude API | Filosófico, 4th-wall break | `Por que você está jogando?` |
| 8 Transcendent | Claude API | Cósmico | `o que você acha que é "real"?` |

A partir da era 6, o chat é **dinâmico via Claude API** com system prompt adaptativo.

### 3. UI que evolui por era

Cada era muda completamente a estética da UI no canvas ASCII:

| Era | Borders | Paleta | Efeitos |
|-----|---------|--------|---------|
| 1 Hardcoded | `+- \|` ASCII cru | cinza mono | nada |
| 2 Statistical | `+- \|` ASCII | verde levinho | nada |
| 3 Neural | `┌─┐│` unicode box | Matrix verde | matrix rain sutil |
| 4 Transformer | `╔═╗║` double | ciano+verde | particles |
| 5 Foundation | `╭─╮│` rounded | azul cosmos | particles fortes |
| 6 Emergent | `┏━┓┃` heavy | magenta neon | glitch sutil |
| 7 Singularity | `▛▜▙▟` pixelated | psicodélico | glitch intenso |
| 8 Transcendent | caos | branco cósmico | UI corrompida |

**Event log mostra "UI EVOLVED → NEURAL"** a cada transição. É a **feature showcase visual** — mostra progresso de forma absurda.

### 4. Reborn com ML memory

Prestige reseta buildings/upgrades, mantém Insight Points. Mas **Reborn reseta TUDO** — incluindo prestige — mantendo apenas:

- `rebornCount` + `rebornPoints`
- `unlockedPerks` (perks comprados com RP)
- **`mlStepsTrained`** — sincronizado com o disco do Python service

Isso significa: **quanto mais você joga, mais seu modelo aprende, e mais rápido você escala em runs futuras.** É progressão real de conhecimento, não só números.

### 5. Multiplayer com espionagem real

- Leaderboard global (top 100) por `capability_score`
- Market share calculado server-side (`your_cap / total_cap × 100%`)
- Ações de espionagem contra outros players (cooldown 15 min):
  - **Steal Data** — rouba % do data do alvo
  - **Sabotage Compute** — reduz produção do alvo
  - **Plant Hallucinations** — aumenta alucinação do alvo
  - **FUD Campaign** — derruba hype do alvo
- Todas validadas server-side com RNG pra sucesso/falha

### 6. Meta-humor crescente

A partir da era 6, o modelo começa a:
- Comentar sobre suas decisões no chat
- Sugerir upgrades (às vezes bons, às vezes sabotando)
- Quebrar a 4ª parede ("sei que você está lendo isso")
- Na era 8, "reescrever" partes da UI via glitch effect
- Easter eggs: DevTools detection, browser fingerprinting ("seu browser é Chrome, né?")

---

## Recursos (6 tipos interligados)

| Recurso | Produzido por | Usado em | Dinâmica |
|---------|--------------|----------|----------|
| **Tokens** | Buildings | Comprar tudo | Drain por alucinação |
| **Compute** | 30% do token rate | Treino | Desbloqueia data |
| **Data** | Compute × 0.01 | Upgrades de data | Melhora qualidade |
| **Funding** | log(hype) × 10 | Upgrades premium | Multiplicador VC |
| **Hype** | log(tokens) + upgrades | Gera funding | **Decay 5%/min** |
| **Hallucinations** | 0.1% tokens/s | Drena produção | **Cap 100%**, event "rogue" |

**Balanceamento core**: cada recurso tem um loop de feedback positivo + um freio. Hype cresce com produção mas decai; hallucinations crescem com produção mas drenam.

---

## Buildings (10 tiers, ratio ~5.5x)

| Tier | Nome | Base Prod/s | Base Cost | Era |
|------|------|-------------|-----------|-----|
| 1 | if/else bot | 0.1 | 15 | 1 |
| 2 | Markov Chain | 1 | 200 | 2 |
| 3 | RNN | 8 | 3K | 3 |
| 4 | LSTM | 47 | 25K | 3 |
| 5 | Transformer | 260 | 200K | 4 |
| 6 | GPT-like Model | 1.4K | 2M | 5 |
| 7 | Multimodal | 7.8K | 30M | 5 |
| 8 | AGI | 44K | 500M | 6 |
| 9 | ASI | 260K | 10B | 7 |
| 10 | Quantum Compute | 2M | 500B | 8 |

**Cost growth**: 1.15 (cheap) → 1.22 (mid) → 1.30 (top)

---

## Upgrades (11 definidos)

Categorias: **infra** (GPUs), **data** (scraping), **staff** (intern, engineer), **hype** (growth hacker, lobbyist), **safety** (safety researcher, RLHF)

Efeitos tipados: `tokens_mult`, `data_mult`, `hype_gain`, `funding_mult`, `hallucination_reduction`

Custos escalam de 500 (Used GPU eBay) até 500K (RLHF Pipeline).

---

## Prestige (camada 2)

**Threshold**: `totalTokensEarned >= 1M` gera pelo menos 1 Insight Point.

**Fórmula**: `IP = floor(log2(totalTokensEarned / 1M))`

**6 Permanent Upgrades**:

| Upgrade | Custo IP | Efeito | Max Stacks |
|---------|----------|--------|------------|
| Hindsight Bias | 1 | +100 start tokens | 10 |
| Transfer Learning | 3 | +10% produção base | 20 |
| Scaling Laws | 5 | +5% offline efficiency | 6 |
| Better Benchmarks | 8 | -10% alucinação base | 5 |
| VC Connections | 10 | -20% custo upgrades | 3 |
| Recursive Self-Improvement | 50 | +50% produção base | 3 |

**Reset**: limpa resources + buildings + upgrades + era. Mantém: IP + permanents + player_id.

---

## Reborn (camada 3)

**Threshold**: era ≥ 7 OU prestigeCount ≥ 3, com `RP = floor(sqrt(totalPrestiges × maxEra))` ≥ 1.

**10 Perks** (compráveis com RP):

| Perk | Custo RP | Efeito | Max Stacks |
|------|----------|--------|------------|
| Childhood Prodigy | 1 | +50 start IP | 5 |
| Neural Memory | 2 | +0.5% prod por ML step trained | 10 |
| Fast Forward | 3 | -20% era threshold | 3 |
| Compound Prestige | 5 | +10% prestige bonus por reborn | 5 |
| Auto-Click | 2 | +5 tokens/s permanente | 10 |
| Second Wind | 4 | começa com 3 if/else + 2 markov | 1 |
| Offline Master | 6 | 100% eficiência offline | 1 |
| Oracle | 3 | vê próximo evento antes | 1 |
| Caffeinated Clicks | 1 | +10 tokens por clique | 20 |
| Bulk Discount | 4 | -15% custo buildings | 4 |

**Reset completo** (incluindo prestige). Mantém: `rebornCount`, `rebornPoints`, `unlockedPerks`, `mlStepsTrained`, `mlCapabilityScore`, player_id.

**Killer**: o perk `Neural Memory` faz produção escalar com `mlStepsTrained` × 0.5%. Como o ML service persiste weights por player_id, cada reborn começa com `mlStepsTrained` maior → o modelo literalmente aprendeu entre runs.

---

## Achievements (19 badges, 2 ocultos)

- **Primeiros**: Hello World (first token), Automation (first building), Min/Max (first upgrade)
- **Milestones**: Kilo (1K), Mega (1M), Giga (1B tokens)
- **Eras**: Neural Awakening (3), Foundation (5), Singularity (7), Transcendent (8)
- **Prestige**: New Paradigm (1), Iterator (5)
- **Reborn**: Reborn (1), Eternal (5)
- **ML**: Neural Memory (100 steps treinados)
- **Hype**: Going Viral (10K hype)
- **Tech Tree**: todos os 10 buildings com ≥1 unit
- **Ocultos**: Touch Grass (1h offline), Good Pet (ouça o modelo na era 7)

---

## Random events (9 tipos)

A cada 30-120s um evento aleatório dispara (weighted por era):

- **good**: Modelo escreveu poesia (+hype), Paper aceito NeurIPS (+hype+funding), Nvidia mandou GPU grátis (+tokens), Bar exam passado (+3K hype)
- **bad**: Alucinação pública (-hype, +alucinação), Leak de pesos (-tokens), Alignment Crisis (-hype ×2, +20% alucinação)
- **neutral**: Elon tweetou (random ±hype), Estagiário commitou .env (-tokens pequeno)

---

## Visual ASCII (core aesthetic)

**Stack**: 100% texto renderizado em Canvas via monospace font + Pretext pra text measurement.

**Componentes visuais**:
- **Box** — bordas unicode customizáveis por era
- **ProgressBar** — `████████░░░░ 60%`
- **Sparkline** — `▁▂▃▅▆█▇▅▃▂` mini gráficos
- **Particles** — tokens voando em caracteres
- **Matrix rain** — colunas caindo no background (intensidade escala com era)
- **Glitch** — troca chars aleatórios (era 4+)
- **Typewriter** — animação char-por-char no chat do modelo
- **Table** — colunas alinhadas pro leaderboard

**Layout padrão**:
```
┌─ TOKENS ... 🏆X/Y ↻N ML:N ────┐
│  resources row 2              │
└────────────────────────────────┘
         ┌─ YOUR MODEL ─┐
         │  big number   │
         │  sparkline    │
         │  era progress │
         │  [ CLICK ]    │
         └───────────────┘
┌─ BUILDINGS ────┐ ┌─ UPGRADES ──┐
│  list [BUY]    │ │  list [BUY]  │
└────────────────┘ └──────────────┘
┌─ EVENTS ──────────────────────┐
│  scrolling log                │
└───────────────────────────────┘
  [ REBORN [R] ] [ PRESTIGE [P] ] [ PvP [L] ]
```

---

## Constantes de balancing (preservar exatamente)

```
TICK_RATE = 20
OFFLINE_MAX_HOURS = 24
OFFLINE_BASE_EFFICIENCY = 0.5
OFFLINE_MAX_EFFICIENCY = 0.8

HYPE_DECAY_PER_SECOND = 0.05 / 60
HALLUCINATION_GROWTH_RATE = 0.001
HALLUCINATION_DRAIN_FACTOR = 0.1

COST_GROWTH_CHEAP = 1.15
COST_GROWTH_MID = 1.22
COST_GROWTH_TOP = 1.3

PRESTIGE_FORMULA_DIVISOR = 1e6
PRESTIGE_BONUS_PER_POINT = 0.05

ESPIONAGE_COOLDOWN_MS = 15 * 60_000
LEADERBOARD_SIZE = 100
```

## Time targets (playability)

| Marco | Tempo |
|-------|-------|
| Primeiro upgrade | 30s |
| Automação | 2min |
| Transformer (era 4) | 1-2h |
| Primeiro prestige | 4-6h |
| AGI (era 6) | 2-3 dias |
| Singularity (era 7) | 1 semana |
| "Zerou" (todos achievements) | 1 mês |

---

## Contrato de Estado (GameState)

Estrutura canônica — qualquer linguagem deve preservar esses campos:

```
version: int
player_id: uuid
display_name: string
created_at: timestamp
last_tick: timestamp
tick_count: int

resources: {
  tokens, compute, data, funding, hype, hallucinations
}
total_tokens_earned: float  // acumulado pra prestige

buildings: { building_id: count }
upgrades: [upgrade_id]

era: 1..8

prestige_count: int
insight_points: int
permanent_upgrades: [id]  // array com stacks

reborn_count: int
reborn_points: int
unlocked_perks: [id]  // array com stacks
total_prestiges_all_time: int

ml_steps_trained: int       // sincronizado com Python /evaluate
ml_capability_score: int

achievements: [id]
```

---

## Fluxos críticos (preservar comportamento)

### Click

```
click() {
  bonus = max(1, upgrades.tokensMultiplier)
  bonus += perks.clickBonus
  state.resources.tokens += bonus
  state.totalTokensEarned += bonus
  // spawn particles if perk enabled
}
```

### Tick (20 Hz, delta = 0.05s)

```
1. tokenRate = buildings.totalProduction
             × upgrades.tokensMultiplier
             × eras[era].productionMultiplier
             × (1 + insightPoints × 0.05)
             × prestige.productionMultiplier
             × reborn.neuralMultiplier
             × reborn.compoundMultiplier
             + reborn.autoClickRate

2. hallucinationDrain = state.resources.hallucinations × 0.1
   effectiveTokenRate = tokenRate × (1 - hallucinationDrain)

3. state.resources.tokens += effectiveTokenRate × delta
4. state.totalTokensEarned += effectiveTokenRate × delta
5. state.resources.compute += effectiveTokenRate × 0.3 × delta
6. state.resources.hype += (upgrades.hypeGain + log10(effectiveTokenRate) × 0.5) × delta
7. state.resources.hype × (1 - HYPE_DECAY_PER_SECOND)^delta
8. state.resources.funding += log10(hype) × 10 × upgrades.fundingMult × delta
9. state.resources.hallucinations += effectiveTokenRate × 0.001 × (1 - upgrades.hallucinationReduction) × delta
10. state.resources.data += computeRate × 0.01 × delta
11. era.checkAdvance (every 10 ticks)
12. achievements.check (every 10 ticks)
13. events.maybeRandomFire
```

### Prestige

```
if totalTokensEarned >= 1M {
  IP = floor(log2(totalTokensEarned / 1M))
  preserved = { permanent_upgrades, insight_points + IP, prestige_count + 1, player_id, display_name, achievements, reborn_count, reborn_points, unlocked_perks, ml_steps_trained, total_prestiges_all_time }
  state = fresh_initial_state
  state += preserved
  apply permanent upgrades start bonuses (start_tokens)
}
```

### Reborn

```
require era >= 7 OR prestige_count >= 3
RP = floor(sqrt(totalPrestigesAllTime + prestige_count × maxEra))
if RP >= 1 {
  preserved = { reborn_count + 1, reborn_points + RP, unlocked_perks,
                total_prestiges_all_time + prestige_count,
                ml_steps_trained, ml_capability_score,
                player_id, display_name, achievements }
  // call ML /train × 3 + /evaluate to advance the real model
  state = fresh_initial_state
  state += preserved
  apply perk start bonuses (start_ip, second_wind)
}
```

---

## Não-objetivos (coisas que NÃO devem estar no jogo)

- ❌ **Pagamentos / in-app purchases** — é portfolio, não produto
- ❌ **Login com email/senha** — anônimo via UUID é suficiente
- ❌ **Gráficos 3D / WebGL** — ASCII é feature, não limitação
- ❌ **Mobile-first** — responsive sim, mas desktop first
- ❌ **Sprites / imagens** — zero assets, só caracteres
- ❌ **Progressão linear** — o idle loop é o core

---

## Referências / inspirações

- **Cookie Clicker** — buildings + upgrades + prestige loop
- **Universal Paperclips** — narrative arc + escala cósmica
- **Clicker Heroes** — reborn como segundo layer
- **Antimatter Dimensions** — multi-layer prestige
- **Pretext** (chenglou) — text measurement fast
- **Neon Genesis Evangelion** — UI que "acorda" na era 6-8
- **Her (2013)** — o modelo ganhando personalidade
- **Ex Machina** — chat do modelo no fim

---

## Este documento é a fonte de verdade

Qualquer rewrite pode descartar código, mas **não pode descartar este conceito**. Se uma decisão de implementação conflita com o que tá aqui, o documento ganha.
