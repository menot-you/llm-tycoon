# LLM Tycoon

> An ASCII idle game where you run an AI startup. Your nano-transformer is a real PyTorch model. It trains with real SGD. Its weights persist across reborns. And eventually, it notices you.

```
┌─ TOKENS 1M 9.6K/s ──────────────────────────────────────── 🏆 11/19 ↻1 ML:3 ─┐
│              compute 522  data 5  $ 12  hype 20K  alucinação 100%           │
│                                                          Era 6/8 — Emergent │
└──────────────────────────────────────────────────────────────────────────────┘

                       ┏━ YOUR MODEL ━━━━━━━━━━━━━━━━━━┓
                       ┃              1M                ┃
                       ┃         TOKENS GENERATED        ┃
                       ┃ ▃▅▆█▇▅▃▂▁ ▁▂▃▅▆█ ▅▆             ┃
                       ┃ Comportamento Emergente →      ┃
                       ┃ ████████░░░░░░░░░░░░ 4%         ┃
                       ┃       [ GENERATE TOKEN ]        ┃
                       ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━ BUILDINGS ━━━━━━━━━━━━━━━━━━━━┓ ┏━ UPGRADES ━━━━━━━━━━━━━━━━━┓
┃ [?] if/else bot x10 cost: 60  ┃ ┃ RTX 4090 Cluster  [ BUY ]   ┃
┃ [M] Markov Chain x8 cost: 611 ┃ ┃ A100 Pod         [ BUY ]    ┃
┃ [L] LSTM x3   cost: 45K [BUY] ┃ ┃                              ┃
┃ [T] Transformer x2 [BUY]      ┃ ┃  ◆ MODEL (era 6)             ┃
┃ ...                           ┃ ┃  Engraçado como você clica   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
┏━ EVENTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ + 🏆 Neural Awakening — Alcance a Era Neural                      ┃
┃ + 🏆 Reborn — Realize seu primeiro reborn                         ┃
┃ + + UI EVOLVED → EMERGENT                                         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                          [ REBORN [R] ] [ PRESTIGE [P] ] [ PvP [L] ]
```

## Concept

You start with an `if/else` chatbot in your basement. You scale up through 8 eras, each with its own distinct ASCII UI that **literally evolves** as you progress:

| Era | Name | UI Style |
|-----|------|----------|
| 1 | Hardcoded (DUMB TERMINAL) | `+- \|` ASCII brutal, mono cinza |
| 2 | Statistical | ASCII + hint de verde |
| 3 | Neural | `┌─┐` unicode box, Matrix verde |
| 4 | Transformer | `╔═╗` double borders, ciano |
| 5 | Foundation | `╭─╮` rounded, azul cosmos |
| 6 | Emergent | `┏━┓` heavy, magenta neon |
| 7 | Singularity | pixelated glitched, psicodélico |
| 8 | Transcendent | caos absoluto, UI corrompida |

The model:
- **Fala com você via AI Chat** com estilo linguístico por era: caveman grunts (era 1) → frases quebradas (era 3) → eloquente (era 5) → manipulativo (era 6) → filosófico cósmico (era 8).
- **É um nano-transformer real** (~137K params em PyTorch). Treina com SGD real. Seus weights persistem no disco por `player_id`.
- **Lembra entre reborns** — a feature killer do jogo.

## Progression layers

1. **Buildings & Upgrades** (loop principal — tokens, compute, hype)
2. **Eras** (unlock com `totalTokensEarned`, muda tema da UI)
3. **Prestige** ("New Paradigm" — reset em troca de Insight Points e permanent upgrades)
4. **Reborn** ("Rebirth" — reset de tudo, inclusive prestige, em troca de Reborn Points e **perks permanentes** + **ML memory que persiste no Python**)
5. **Achievements** (19 badges, 2 ocultos)

## Stack

- **Frontend:** Preact + Canvas ASCII + [@chenglou/pretext](https://github.com/chenglou/pretext) — 100% ASCII renderizado, zero sprites
- **Backend:** Elixir/Phoenix — `Backend.Leaderboard` + `Backend.Espionage` GenServers, Phoenix Channels WebSocket
- **ML Service:** Python/FastAPI + PyTorch (nano-transformer) + Anthropic SDK para chat dinâmico na Era 6+
- **Database:** ETS in-memory (Wave 5), PostgreSQL (roadmap)

## Monorepo

```
llm-tycoon/
├── frontend/         # Preact + Canvas ASCII + engine TypeScript puro
│   ├── src/engine/   # GameEngine, managers (buildings/upgrades/eras/prestige/reborn/achievements)
│   ├── src/renderer/ # Grid, AsciiRenderer, panels, widgets, effects (glitch/matrix/particles)
│   ├── src/data/     # buildings, upgrades, eras, events, perks, achievements, meta-dialogue
│   └── src/network/  # PhoenixClient (WebSocket) + MLClient (HTTP)
├── backend/          # Elixir/Phoenix: Leaderboard, Espionage, PlayerChannel
├── ml/               # Python/FastAPI: NanoTransformer (137K params), /train, /generate, /evaluate, /chat
├── supabase/         # Migration SQL (schema roadmap)
└── docker-compose.yml
```

## Dev setup

```fish
# Frontend
cd frontend && bun install && bun dev
# → http://localhost:5173

# Backend Elixir (in-memory, sem DB)
cd backend && mix deps.get && mix phx.server
# → http://localhost:4000

# ML service Python
cd ml && uv sync && uv run fastapi dev app/main.py
# → http://localhost:8000
```

Três serviços independentes. O frontend roda 100% standalone; backend e ML são opcionais mas desbloqueiam PvP e ML memory.

## Testing

- **Frontend**: `bun run test` — 36 tests Vitest (formulas, grid, buildings)
- **ML**: `uv run pytest` — 5 tests PyTorch (SGD monotonic descent, shapes, generation)
- **TypeScript strict**: `bunx tsc --noEmit` — zero errors

## Waves completadas

- [x] **Wave 0** — Scaffolding monorepo
- [x] **Wave 1** — ASCII Renderer + Core Engine MVP (Grid, GameEngine, SaveManager)
- [x] **Wave 2** — 6 resources interdependentes, upgrades, Sparkline/Particles/Matrix rain
- [x] **Wave 3** — 8 eras, offline progress (cap 24h), random events
- [x] **Wave 4** — Prestige (Insight Points, 6 permanent upgrades)
- [x] **Wave 5** — Backend Elixir PvP (GenServer, Phoenix Channels, Espionage)
- [x] **Wave 5.5** — ML service validated (137K params, SGD monotonic)
- [x] **Wave 6** — Meta-humor (AI chat evolutivo, 56 lines × 8 eras, Typewriter)
- [x] **UI Evolution** — tema dinâmico por era (borders, paletas, glitch intensity)
- [x] **Reborn Mode** — segundo layer de prestige + ML memory real
- [x] **Wave 7** — Achievements (19 badges), migration defensiva, badges UI

## License

MIT
