//! LLM Tycoon — server-authoritative game server.
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
//!                   game::*  (pure, stateless)
//!                        │
//!                        ▼ broadcast snapshot
//!                   tokio::broadcast -> PlayerChannel -> client
//!
//!   LeaderboardActor reads all alive PlayerActors' capability_score
//!   EspionageActor validates actions with cooldowns
//!   MLClient calls the Python FastAPI /train /evaluate
//!   Storage persists state snapshots to Postgres via sqlx
//! ```

use anyhow::Result;
use tracing_subscriber::{EnvFilter, fmt};

mod actors;
mod game;
mod ml;
mod storage;
mod web;

use actors::registry::PlayerRegistry;
use ml::MLClient;
use storage::Storage;
use web::router::AppState;

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
    let _ = dotenvy::dotenv();
    init_tracing();

    tracing::info!("starting llm-tycoon-server");

    let ml_client = MLClient::from_env();
    tracing::info!(
        ml_available = ml_client.ping().await,
        "ML service connectivity check"
    );

    let storage = Storage::from_env().await;
    tracing::info!(
        storage_enabled = storage.is_enabled(),
        "storage initialized"
    );

    let registry = PlayerRegistry::new(ml_client.clone(), storage.clone());

    let state = AppState {
        registry,
        ml_client,
        storage,
    };

    let app = web::build_router(state);

    let addr: std::net::SocketAddr = std::env::var("BIND_ADDR")
        .unwrap_or_else(|_| "0.0.0.0:4000".to_string())
        .parse()
        .expect("invalid BIND_ADDR");

    let listener = tokio::net::TcpListener::bind(addr).await?;
    tracing::info!(address = %addr, "listening");

    axum::serve(listener, app).await?;

    Ok(())
}
