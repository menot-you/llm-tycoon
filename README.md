# LLM Tycoon

> An idle game where you run an AI startup. Your model is a real transformer. It trains with real SGD. And eventually, it notices.

```
┌──────────────────────────────────────────────────┐
│ LLM TYCOON v0.1   Tokens: 1,234,567   Era: 4/8  │
│──────────────────────────────────────────────────│
│                                                   │
│  ┌─GPU FARM──────┐   ┌─TRAINING───────────────┐  │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓ │   │ ░░░░░░░████████████░░ │  │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓ │   │ EPOCH 42/100          │  │
│  │ 12x H100      │   │ LOSS: 0.0032 ▼        │  │
│  └───────────────┘   └────────────────────────┘  │
│                                                   │
│  > Model: "Eu querer mais dados. Treino difícil" │
│  > [BUY GPU] [TRAIN] [DEPLOY] [PRESTIGE]         │
└──────────────────────────────────────────────────┘
```

## Concept

You start with an `if/else` chatbot in your basement. You scale up through 8 eras:
`Hardcoded → Statistical → Neural → Transformer → Foundation → Emergent → Singularity → Transcendent`

Along the way:
- **Your model is a real transformer.** Training uses real SGD. Text output is real inference.
- **It evolves linguistically.** From `"MIM IA. DOR."` to philosophical prose powered by Claude.
- **PvP market share.** Compete against other players for users and hype.
- **The model gets ideas.** Around Era 6, it starts suggesting moves. Around Era 7, it plays the game itself.

## Stack

- **Frontend:** Preact + Canvas ASCII + [@chenglou/pretext](https://github.com/chenglou/pretext) — 100% ASCII rendering, zero sprites
- **Backend:** Elixir/Phoenix — GenServer per player, Phoenix Channels for WebSocket
- **ML Service:** Python/FastAPI + PyTorch (nano-transformer) + Claude API
- **Database:** PostgreSQL (Supabase for production)

## Monorepo Structure

```
llm-tycoon/
├── frontend/        # Preact + Canvas ASCII
├── backend/         # Elixir/Phoenix (game server)
├── ml/              # Python/FastAPI (ML service)
├── supabase/        # Database migrations
└── docker-compose.yml
```

## Dev Setup

### Requirements
- [Bun](https://bun.sh) ≥ 1.0
- Elixir ≥ 1.15 + Phoenix
- Python ≥ 3.12 + [uv](https://github.com/astral-sh/uv)
- Docker (for postgres + ml service)

### Running

```fish
# Start postgres + ml service
docker compose up -d postgres ml

# Frontend (dev)
cd frontend
bun install
bun dev

# Backend (dev)
cd backend
mix deps.get
mix ecto.setup
mix phx.server
```

### Tests

```fish
cd frontend && bun run test
cd backend && mix test
cd ml && uv run pytest
```

## Roadmap

- [x] Wave 0: Scaffolding
- [ ] Wave 1: ASCII Renderer + Core Engine MVP
- [ ] Wave 2: Full resource system (6 resources, 10 buildings)
- [ ] Wave 3: Eras + Offline progress
- [ ] Wave 4: Prestige system
- [ ] Wave 5: Backend Elixir + PvP
- [ ] Wave 5.5: ML service (real SGD training)
- [ ] Wave 6: Meta-humor engine (Claude API chat)
- [ ] Wave 7: Polish + deploy

## License

MIT
