# LLM Tycoon

> An idle game where you run an AI startup. Your model is a real transformer. It trains with real SGD. And eventually, it notices.

## Architecture — Server-Authoritative

All game logic runs on the Rust server. The client is a thin ASCII Canvas renderer.

```
Client (Preact + Canvas)  ──WebSocket──>  Server (Rust + ractor actors)
                                              │
                                              ├── PlayerActor x N (10 Hz tick)
                                              ├── game/ (pure logic, 105 tests)
                                              ├── Storage (sqlx + Postgres)
                                              │
                                              └──HTTP──>  ML (Python + PyTorch)
```

## Stack

- **Server**: Rust (axum, ractor, sqlx, tokio) — authoritative game state
- **Client**: Preact + Vite + Canvas — thin ASCII renderer
- **ML**: Python (FastAPI, PyTorch) — real nano-transformer 137K params
- **DB**: Postgres (Supabase) — optional in dev
- **Types**: ts-rs generates TS from Rust structs

## Dev

```bash
cd server && cargo run       # localhost:4000
cd client && bun install && bun dev  # localhost:5173
cd ml && uv run fastapi dev app/main.py  # localhost:8000 (optional)
```

## Tests

```bash
cd server && cargo test   # 105 tests
cd ml && uv run pytest    # 5 tests
```

## Deploy

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

See [GAME_CONCEPT.md](./GAME_CONCEPT.md) for the full design.

## License

MIT
