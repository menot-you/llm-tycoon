//! Pure game logic. Nada aqui depende de tokio, axum, sqlx ou ractor.
//!
//! Todos os modules recebem e retornam `GameState` (ou `Result<GameState, _>`)
//! de forma determinística. Isso garante:
//!
//! 1. Testabilidade — `cargo test --lib` sem I/O
//! 2. Replayability — snapshot + intent sequence = estado idêntico
//! 3. Separation of concerns — PlayerActor só orquestra, não decide
//!
//! Veja `/GAME_CONCEPT.md` na raiz do repo para o contrato canônico.

pub mod data;
pub mod formulas;
pub mod state;

pub mod achievements;
pub mod buildings;
pub mod eras;
pub mod events;
pub mod prestige;
pub mod reborn;
pub mod resources;
pub mod upgrades;

pub use state::{GameState, Resources};
