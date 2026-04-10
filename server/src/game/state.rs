//! GameState — shape canônico do estado do jogo.
//!
//! Porta 1:1 da interface `GameState` do concept doc + frontend v1. Qualquer
//! mudança aqui deve ser refletida no `GAME_CONCEPT.md` e nas fórmulas.
//!
//! O struct é `Serialize + Deserialize + TS` para:
//! - Persistir em Postgres como JSONB (`sqlx::types::Json`)
//! - Enviar pro client via WebSocket como JSON
//! - Gerar `GameState.ts` automaticamente com `ts-rs`

use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use ts_rs::TS;

use super::data::buildings::BuildingId;
use super::data::eras::EraId;

pub const SAVE_VERSION: u32 = 2;

/// Seis recursos interligados. Ver `GAME_CONCEPT.md` para a dinâmica.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../client/src/bindings/")]
pub struct Resources {
    pub tokens: f64,
    pub compute: f64,
    pub data: f64,
    pub funding: f64,
    pub hype: f64,
    /// 0.0–1.0. Em 1.0, drena 100% da produção e dispara "rogue" event.
    pub hallucinations: f64,
}

impl Default for Resources {
    fn default() -> Self {
        Self {
            tokens: 0.0,
            compute: 0.0,
            data: 0.0,
            funding: 0.0,
            hype: 0.0,
            hallucinations: 0.0,
        }
    }
}

/// Estado completo de um jogador. Única source of truth.
///
/// **Invariante**: todos os campos devem existir em `GAME_CONCEPT.md` e
/// ter a mesma semântica. Campos novos requerem bump de `SAVE_VERSION`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../client/src/bindings/")]
pub struct GameState {
    pub version: u32,
    pub player_id: String,
    pub display_name: String,

    /// Timestamps em ms epoch.
    pub created_at: i64,
    pub last_tick: i64,
    pub tick_count: u64,

    pub resources: Resources,
    pub total_tokens_earned: f64,

    /// Mapa building → quantidade. String key pra JSON-friendly.
    pub buildings: HashMap<String, u32>,
    /// IDs de upgrades comprados (one-shot).
    pub upgrades: Vec<String>,

    pub era: EraId,

    pub prestige_count: u32,
    pub insight_points: u32,
    /// Array com stacks (IDs podem repetir).
    pub permanent_upgrades: Vec<String>,

    pub reborn_count: u32,
    pub reborn_points: u32,
    pub unlocked_perks: Vec<String>,
    pub total_prestiges_all_time: u32,

    /// Sincronizado com o Python `/evaluate`.
    pub ml_steps_trained: u32,
    pub ml_capability_score: u64,

    pub achievements: Vec<String>,
}

impl GameState {
    /// Cria um novo estado fresh. Usado em first-time join, prestige e reborn.
    pub fn new(player_id: String) -> Self {
        let now = now_ms();
        Self {
            version: SAVE_VERSION,
            player_id,
            display_name: "Anonymous Founder".to_string(),
            created_at: now,
            last_tick: now,
            tick_count: 0,
            resources: Resources::default(),
            total_tokens_earned: 0.0,
            buildings: HashMap::new(),
            upgrades: Vec::new(),
            era: EraId::Hardcoded,
            prestige_count: 0,
            insight_points: 0,
            permanent_upgrades: Vec::new(),
            reborn_count: 0,
            reborn_points: 0,
            unlocked_perks: Vec::new(),
            total_prestiges_all_time: 0,
            ml_steps_trained: 0,
            ml_capability_score: 0,
            achievements: Vec::new(),
        }
    }

    /// Quanto de um building o player tem.
    pub fn owned(&self, id: BuildingId) -> u32 {
        self.buildings.get(id.as_str()).copied().unwrap_or(0)
    }

    /// Incrementa a quantidade de um building.
    pub fn increment_building(&mut self, id: BuildingId, by: u32) {
        let entry = self.buildings.entry(id.as_str().to_string()).or_insert(0);
        *entry += by;
    }

    /// Adiciona tokens ao state. Mantém o total_tokens_earned em sync.
    pub fn add_tokens(&mut self, amount: f64) {
        self.resources.tokens += amount;
        self.total_tokens_earned += amount;
    }
}

/// Helper: timestamp ms atual.
pub fn now_ms() -> i64 {
    chrono::Utc::now().timestamp_millis()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn new_state_has_zero_resources() {
        let s = GameState::new("test".to_string());
        assert_eq!(s.resources.tokens, 0.0);
        assert_eq!(s.era, EraId::Hardcoded);
        assert_eq!(s.version, SAVE_VERSION);
    }

    #[test]
    fn add_tokens_updates_total_earned() {
        let mut s = GameState::new("test".to_string());
        s.add_tokens(100.0);
        assert_eq!(s.resources.tokens, 100.0);
        assert_eq!(s.total_tokens_earned, 100.0);
    }

    #[test]
    fn increment_building_defaults_to_zero() {
        let mut s = GameState::new("test".to_string());
        assert_eq!(s.owned(BuildingId::IfElseBot), 0);
        s.increment_building(BuildingId::IfElseBot, 3);
        assert_eq!(s.owned(BuildingId::IfElseBot), 3);
        s.increment_building(BuildingId::IfElseBot, 2);
        assert_eq!(s.owned(BuildingId::IfElseBot), 5);
    }
}
