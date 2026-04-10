//! Actor layer — orquestração usando `ractor`.
//!
//! Cada jogador = 1 `PlayerActor` com mailbox isolada. Tick loop interno
//! de 10 Hz via `Process.send_after`-like. Registry global por player_id.
//!
//! Contrato: actors NÃO implementam regras. Eles só:
//! 1. Recebem intents via mailbox (`cast`)
//! 2. Delegam pro `game::*` módulo correspondente
//! 3. Broadcast snapshot via PubSub sempre que o state muda
//! 4. Persistem state via Storage a cada N ticks
#![allow(dead_code)]

pub mod player;
pub mod registry;
