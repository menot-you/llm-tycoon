//! LLM Tycoon — server-authoritative game server.
//!
//! Fluxo de entrada: binary → tokio runtime → tracing → config → Application.start
//!
//! Arquitetura de alto nível:
//!
//! ```text
//!   client (WebSocket)
//!        │
//!        ▼
//!   axum router ──► PlayerChannel (axum::ws)
//!                        │
//!                        ▼ cast intents
//!                   PlayerActor ─ ractor ─ Registry
//!                        │ tick 10 Hz
//!                        ▼
//!                   game::apply_tick(state) -> state
//!                        │
//!                        ▼ broadcast snapshot
//!                   PubSub -> PlayerChannel -> client
//!
//!   LeaderboardActor reads all alive PlayerActors' capability_score
//!   EspionageActor validates actions with cooldowns
//!   MLClient calls the Python FastAPI /train /evaluate
//!   Storage persists state snapshots to Postgres via sqlx
//! ```

use anyhow::Result;
use tracing_subscriber::{EnvFilter, fmt};

mod game;

fn init_tracing() {
    fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .with_target(false)
        .init();
}

#[tokio::main]
async fn main() -> Result<()> {
    // Load .env if present (dev mode)
    let _ = dotenvy::dotenv();
    init_tracing();

    tracing::info!("starting llm-tycoon-server");

    // Smoke test das data modules + formulas (só prova que o build compila)
    let def = game::data::buildings::get(game::data::buildings::BuildingId::IfElseBot)
        .expect("ifelse_bot should exist");
    tracing::info!(
        "smoke: first building = {} (base {}/s, cost {})",
        def.name,
        def.base_production,
        def.base_cost
    );

    // TODO next waves:
    // 1. Application::start(config).await — supervisor tree
    // 2. PlayerRegistry + PlayerActor supervision
    // 3. Axum router + WebSocket /socket
    // 4. Leaderboard + Espionage actors
    // 5. MLClient ping loop
    // 6. Ecto migrations + Storage

    tracing::info!("ok — scaffolding complete");
    Ok(())
}
