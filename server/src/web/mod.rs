//! Web layer — axum router, WebSocket channels, HTTP endpoints.
//!
//! O router expõe:
//! - `GET  /health`              — health check simples
//! - `GET  /socket?player_id=X`  — WebSocket upgrade do PlayerChannel
//!
//! Toda a game logic passa por `cast` pro PlayerActor — o web layer é
//! puramente transporte.

pub mod player_channel;
pub mod router;

pub use router::build_router;
