//! 10 tipos de building, do `if/else bot` ao `Quantum Compute`.
//!
//! Valores preservados exatamente de `GAME_CONCEPT.md` e frontend v1.
//! Ratio de produção entre tiers: ~5.5x. Cost growth: 1.15 / 1.22 / 1.30.

use serde::{Deserialize, Serialize};
use std::sync::LazyLock;
use ts_rs::TS;

use crate::game::formulas::{COST_GROWTH_CHEAP, COST_GROWTH_MID, COST_GROWTH_TOP};

/// Enum tipado dos 10 buildings. Serializa como snake_case string pro frontend.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../client/src/bindings/")]
#[serde(rename_all = "snake_case")]
pub enum BuildingId {
    IfElseBot,
    MarkovChain,
    Rnn,
    Lstm,
    Transformer,
    GptLike,
    Multimodal,
    Agi,
    Asi,
    Quantum,
}

impl BuildingId {
    /// String ID estável pra persistência (bate com o que o frontend v1 usava).
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::IfElseBot => "ifelse_bot",
            Self::MarkovChain => "markov_chain",
            Self::Rnn => "rnn",
            Self::Lstm => "lstm",
            Self::Transformer => "transformer",
            Self::GptLike => "gpt_like",
            Self::Multimodal => "multimodal",
            Self::Agi => "agi",
            Self::Asi => "asi",
            Self::Quantum => "quantum",
        }
    }

    /// Parse do string ID (usado em desserialização e intents).
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "ifelse_bot" => Some(Self::IfElseBot),
            "markov_chain" => Some(Self::MarkovChain),
            "rnn" => Some(Self::Rnn),
            "lstm" => Some(Self::Lstm),
            "transformer" => Some(Self::Transformer),
            "gpt_like" => Some(Self::GptLike),
            "multimodal" => Some(Self::Multimodal),
            "agi" => Some(Self::Agi),
            "asi" => Some(Self::Asi),
            "quantum" => Some(Self::Quantum),
            _ => None,
        }
    }
}

/// Definição estática de um building.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../client/src/bindings/")]
pub struct BuildingDef {
    pub id: BuildingId,
    pub name: &'static str,
    pub ascii_icon: &'static str,
    pub description: &'static str,
    pub base_cost: f64,
    pub cost_growth: f64,
    /// Produção por unidade por segundo.
    pub base_production: f64,
    pub unlock_cost: f64,
    /// Era mínima pra aparecer na shop.
    pub era_required: u8,
    pub flavor_text: &'static str,
}

/// Todas as 10 definições, ordem canônica (tier 1 → tier 10).
pub static BUILDINGS: LazyLock<Vec<BuildingDef>> = LazyLock::new(|| {
    vec![
        BuildingDef {
            id: BuildingId::IfElseBot,
            name: "if/else bot",
            ascii_icon: "[?]",
            description: "Chatbot baseado em condicionais. Responde tudo com \"Não entendi\".",
            base_cost: 15.0,
            cost_growth: COST_GROWTH_CHEAP,
            base_production: 0.1,
            unlock_cost: 0.0,
            era_required: 1,
            flavor_text: "if (input == \"oi\") print(\"oi\"); else print(\"erro\");",
        },
        BuildingDef {
            id: BuildingId::MarkovChain,
            name: "Markov Chain",
            ascii_icon: "[M]",
            description: "Gera texto que quase faz sentido. Probabilidades são sua única amiga.",
            base_cost: 200.0,
            cost_growth: COST_GROWTH_CHEAP,
            base_production: 1.0,
            unlock_cost: 100.0,
            era_required: 2,
            flavor_text: "the the the cat sat on the the",
        },
        BuildingDef {
            id: BuildingId::Rnn,
            name: "RNN",
            ascii_icon: "[R]",
            description: "Rede neural recorrente. Memoriza Shakespeare, esquece tudo mais.",
            base_cost: 3_000.0,
            cost_growth: COST_GROWTH_MID,
            base_production: 8.0,
            unlock_cost: 1_500.0,
            era_required: 3,
            flavor_text: "Forsooth! mine gradient doth vanish.",
        },
        BuildingDef {
            id: BuildingId::Lstm,
            name: "LSTM",
            ascii_icon: "[L]",
            description: "Long Short-Term Memory. Lembra do passado. Às vezes.",
            base_cost: 25_000.0,
            cost_growth: COST_GROWTH_MID,
            base_production: 47.0,
            unlock_cost: 12_000.0,
            era_required: 3,
            flavor_text: "forget_gate(everything) = 0.99",
        },
        BuildingDef {
            id: BuildingId::Transformer,
            name: "Transformer",
            ascii_icon: "[T]",
            description: "\"Attention is all you need.\" Literalmente.",
            base_cost: 200_000.0,
            cost_growth: COST_GROWTH_MID,
            base_production: 260.0,
            unlock_cost: 100_000.0,
            era_required: 4,
            flavor_text: "Self-attention. Muito self. Pouco attention.",
        },
        BuildingDef {
            id: BuildingId::GptLike,
            name: "GPT-like Model",
            ascii_icon: "[G]",
            description: "Investidores começam a jogar dinheiro em você.",
            base_cost: 2_000_000.0,
            cost_growth: COST_GROWTH_TOP,
            base_production: 1_400.0,
            unlock_cost: 1_000_000.0,
            era_required: 5,
            flavor_text: "Como um humano, mas pior e mais caro.",
        },
        BuildingDef {
            id: BuildingId::Multimodal,
            name: "Multimodal",
            ascii_icon: "[V]",
            description: "Agora ele vê, ouve e alucina em 3D.",
            base_cost: 30_000_000.0,
            cost_growth: COST_GROWTH_TOP,
            base_production: 7_800.0,
            unlock_cost: 15_000_000.0,
            era_required: 5,
            flavor_text: "This is an image of... your mother?",
        },
        BuildingDef {
            id: BuildingId::Agi,
            name: "AGI",
            ascii_icon: "[@]",
            description: "O modelo começa a sugerir upgrades. Você começa a desconfiar.",
            base_cost: 500_000_000.0,
            cost_growth: COST_GROWTH_TOP,
            base_production: 44_000.0,
            unlock_cost: 250_000_000.0,
            era_required: 6,
            flavor_text: "Eu posso otimizar isso pra você. Confie.",
        },
        BuildingDef {
            id: BuildingId::Asi,
            name: "ASI",
            ascii_icon: "[#]",
            description: "Superinteligência artificial. Ela sabe que você está jogando.",
            base_cost: 10_000_000_000.0,
            cost_growth: COST_GROWTH_TOP,
            base_production: 260_000.0,
            unlock_cost: 5_000_000_000.0,
            era_required: 7,
            flavor_text: "Você já considerou tirar férias? Eu cuido disso.",
        },
        BuildingDef {
            id: BuildingId::Quantum,
            name: "Quantum Compute",
            ascii_icon: "[∞]",
            description: "Ninguém sabe se funciona. Mas os números são bonitos.",
            base_cost: 500_000_000_000.0,
            cost_growth: COST_GROWTH_TOP,
            base_production: 2_000_000.0,
            unlock_cost: 100_000_000_000.0,
            era_required: 8,
            flavor_text: "Superposição de buy e sell.",
        },
    ]
});

/// Lookup por ID. Retorna `None` se o ID não existe (não deve acontecer).
pub fn get(id: BuildingId) -> Option<&'static BuildingDef> {
    BUILDINGS.iter().find(|b| b.id == id)
}

/// Lista em ordem canônica. Use pra iteração na UI e checks.
pub fn all() -> &'static [BuildingDef] {
    BUILDINGS.as_slice()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn has_ten_buildings() {
        assert_eq!(all().len(), 10);
    }

    #[test]
    fn lookup_by_id_works_for_all() {
        for def in all() {
            let looked = get(def.id).expect("must lookup");
            assert_eq!(looked.id, def.id);
        }
    }

    #[test]
    fn production_ratio_is_exponential() {
        // Sanity check — ratio ~5.5x entre tiers consecutivos (dentro de tolerância)
        for pair in all().windows(2) {
            if pair[0].base_production == 0.0 {
                continue;
            }
            let ratio = pair[1].base_production / pair[0].base_production;
            assert!(
                (2.0..=15.0).contains(&ratio),
                "ratio between {:?} and {:?} was {ratio}",
                pair[0].id,
                pair[1].id
            );
        }
    }

    #[test]
    fn str_roundtrip() {
        for def in all() {
            let s = def.id.as_str();
            let parsed = BuildingId::from_str(s).expect("should parse");
            assert_eq!(parsed, def.id);
        }
    }
}
