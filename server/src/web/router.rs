//! Axum router composition.

use axum::{Router, response::Json, routing::get};
use serde_json::json;
use tower_http::cors::{Any, CorsLayer};

use crate::actors::registry::PlayerRegistry;
use crate::ml::MLClient;
use crate::storage::Storage;

#[derive(Clone)]
pub struct AppState {
    pub registry: PlayerRegistry,
    pub ml_client: MLClient,
    pub storage: Storage,
}

pub fn build_router(state: AppState) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route("/health", get(health))
        .route("/socket", get(super::player_channel::upgrade))
        .with_state(state)
        .layer(cors)
}

async fn health() -> Json<serde_json::Value> {
    Json(json!({
        "status": "ok",
        "service": "llm-tycoon-server",
        "version": env!("CARGO_PKG_VERSION"),
    }))
}
