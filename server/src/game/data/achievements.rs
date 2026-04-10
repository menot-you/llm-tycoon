//! 19 achievements. Cada um tem um `trigger` — uma closure que inspeciona
//! o GameState e retorna true quando deve ser desbloqueado.
//!
//! Porta do frontend v1 `data/achievements.ts`, mas com triggers agora
//! server-side (Rust é que decide se desbloqueou).

use serde::{Deserialize, Serialize};
use std::sync::LazyLock;
use ts_rs::TS;

use crate::game::GameState;
use crate::game::data::buildings::BuildingId;

/// Função que inspeciona o state e retorna `true` se o achievement foi atingido.
pub type AchievementCheck = fn(&GameState) -> bool;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../client/src/bindings/")]
pub struct AchievementDef {
    pub id: &'static str,
    pub name: &'static str,
    pub description: &'static str,
    pub hidden: bool,
    // check não é serializado (não vai pro client — só o server decide)
    #[serde(skip)]
    #[ts(skip)]
    pub check: Option<AchievementCheck>,
}

/// Lista canônica de achievements. Ordem = ordem de exibição.
pub static ACHIEVEMENTS: LazyLock<Vec<AchievementDef>> = LazyLock::new(|| {
    vec![
        AchievementDef {
            id: "first_token",
            name: "Hello World",
            description: "Gere seu primeiro token",
            hidden: false,
            check: Some(|s| s.total_tokens_earned >= 1.0),
        },
        AchievementDef {
            id: "first_building",
            name: "Automation",
            description: "Compre seu primeiro building",
            hidden: false,
            check: Some(|s| s.buildings.values().any(|&n| n > 0)),
        },
        AchievementDef {
            id: "first_upgrade",
            name: "Min/Max",
            description: "Compre seu primeiro upgrade",
            hidden: false,
            check: Some(|s| !s.upgrades.is_empty()),
        },
        AchievementDef {
            id: "k_tokens",
            name: "Kilo",
            description: "1K tokens gerados",
            hidden: false,
            check: Some(|s| s.total_tokens_earned >= 1_000.0),
        },
        AchievementDef {
            id: "m_tokens",
            name: "Mega",
            description: "1M tokens gerados",
            hidden: false,
            check: Some(|s| s.total_tokens_earned >= 1_000_000.0),
        },
        AchievementDef {
            id: "b_tokens",
            name: "Giga",
            description: "1B tokens gerados",
            hidden: false,
            check: Some(|s| s.total_tokens_earned >= 1_000_000_000.0),
        },
        AchievementDef {
            id: "era_3",
            name: "Neural Awakening",
            description: "Alcance a Era Neural",
            hidden: false,
            check: Some(|s| s.era.as_u8() >= 3),
        },
        AchievementDef {
            id: "era_5",
            name: "Foundation",
            description: "Alcance a Era Foundation",
            hidden: false,
            check: Some(|s| s.era.as_u8() >= 5),
        },
        AchievementDef {
            id: "era_7",
            name: "Singularity",
            description: "Alcance a Era Singularity",
            hidden: false,
            check: Some(|s| s.era.as_u8() >= 7),
        },
        AchievementDef {
            id: "era_8",
            name: "Transcendent",
            description: "Alcance a Era Transcendent",
            hidden: false,
            check: Some(|s| s.era.as_u8() >= 8),
        },
        AchievementDef {
            id: "prestige_1",
            name: "New Paradigm",
            description: "Faça seu primeiro prestige",
            hidden: false,
            check: Some(|s| s.prestige_count >= 1),
        },
        AchievementDef {
            id: "prestige_5",
            name: "Iterator",
            description: "5 prestiges acumulados",
            hidden: false,
            check: Some(|s| s.prestige_count + s.total_prestiges_all_time >= 5),
        },
        AchievementDef {
            id: "reborn_1",
            name: "Reborn",
            description: "Realize seu primeiro reborn",
            hidden: false,
            check: Some(|s| s.reborn_count >= 1),
        },
        AchievementDef {
            id: "reborn_5",
            name: "Eternal",
            description: "5 reborns completados",
            hidden: false,
            check: Some(|s| s.reborn_count >= 5),
        },
        AchievementDef {
            id: "ml_100",
            name: "Neural Memory",
            description: "100 steps treinados no modelo real",
            hidden: false,
            check: Some(|s| s.ml_steps_trained >= 100),
        },
        AchievementDef {
            id: "hype_10k",
            name: "Going Viral",
            description: "10K hype acumulado",
            hidden: false,
            check: Some(|s| s.resources.hype >= 10_000.0),
        },
        AchievementDef {
            id: "all_buildings",
            name: "Tech Tree",
            description: "Tenha todos os 10 buildings com ≥1 unit",
            hidden: false,
            check: Some(|s| {
                const ALL: [BuildingId; 10] = [
                    BuildingId::IfElseBot,
                    BuildingId::MarkovChain,
                    BuildingId::Rnn,
                    BuildingId::Lstm,
                    BuildingId::Transformer,
                    BuildingId::GptLike,
                    BuildingId::Multimodal,
                    BuildingId::Agi,
                    BuildingId::Asi,
                    BuildingId::Quantum,
                ];
                ALL.iter().all(|b| s.owned(*b) > 0)
            }),
        },
        // Hidden — setado manualmente (offline >= 1h)
        AchievementDef {
            id: "touch_grass",
            name: "Touch Grass",
            description: "Volte após 1h+ offline",
            hidden: true,
            check: None,
        },
        // Hidden — reservado pra easter egg (chat do modelo)
        AchievementDef {
            id: "singularity_pet",
            name: "Good Pet",
            description: "Ouça o modelo na Era 7",
            hidden: true,
            check: None,
        },
    ]
});

pub fn all() -> &'static [AchievementDef] {
    ACHIEVEMENTS.as_slice()
}

pub fn get(id: &str) -> Option<&'static AchievementDef> {
    ACHIEVEMENTS.iter().find(|a| a.id == id)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn has_nineteen_achievements() {
        assert_eq!(all().len(), 19);
    }

    #[test]
    fn two_are_hidden() {
        assert_eq!(all().iter().filter(|a| a.hidden).count(), 2);
    }

    #[test]
    fn first_token_triggers_on_earning() {
        let mut s = GameState::new("test".into());
        let first_token = get("first_token").unwrap();
        let check = first_token.check.unwrap();
        assert!(!check(&s));
        s.add_tokens(1.0);
        assert!(check(&s));
    }
}
