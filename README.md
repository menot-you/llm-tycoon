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

**Live at https://llm-tycoon.menot.run** (server-authoritative, WebSocket over Cloudflare tunnel).

Stack on `nott`:

```bash
# Clone + build + up
cd ~/Developer/menot-you && git clone git@github.com:menot-you/llm-tycoon.git
cd llm-tycoon && docker compose -f docker-compose.prod.yml up -d --build

# Ingress: Cloudflare tunnel → 127.0.0.1:8088 → nginx (client/dist + /socket proxy)
# Tunnel config managed via Cloudflare API (not local file) under account
# 02a3067753466663b518421e967fa7f6 tunnel 214ad842-f31e-452e-8a64-93bbaf18e1a6
#   ingress: llm-tycoon.menot.run → http://127.0.0.1:8088

# Keep containers alive against manual kills (CI runners cleanup):
#   systemd unit /etc/systemd/system/llm-tycoon.service  (boot)
#   crontab */2: docker compose up -d (idempotent refresh)
```

Client is built on the nott host itself (`cd client && pnpm install && pnpm run build`)
and served by the `web` nginx container via a read-only volume mount.

See [GAME_CONCEPT.md](./GAME_CONCEPT.md) for the full design.

## License

MIT
