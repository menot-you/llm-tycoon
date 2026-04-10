//! Dados estáticos do jogo.
//!
//! Cada módulo exporta definições constantes (via `std::sync::LazyLock` ou
//! `const` arrays) que são carregadas uma vez no binary. Nenhum dado aqui
//! depende de runtime.

pub mod achievements;
pub mod buildings;
pub mod eras;
pub mod events;
pub mod perks;
pub mod permanents;
pub mod upgrades;
