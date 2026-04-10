//! 8 eras de progressão, cada uma com threshold exponencial.
//!
//! Source: `GAME_CONCEPT.md` seção "Eras".

use serde::{Deserialize, Serialize};
use std::sync::LazyLock;
use ts_rs::TS;

/// Era IDs tipados — preservam ordem canônica.
#[derive(
    Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize, TS,
)]
#[ts(export, export_to = "../../client/src/bindings/")]
#[repr(u8)]
pub enum EraId {
    Hardcoded = 1,
    Statistical = 2,
    Neural = 3,
    Transformer = 4,
    Foundation = 5,
    Emergent = 6,
    Singularity = 7,
    Transcendent = 8,
}

impl EraId {
    pub fn from_u8(n: u8) -> Option<Self> {
        match n {
            1 => Some(Self::Hardcoded),
            2 => Some(Self::Statistical),
            3 => Some(Self::Neural),
            4 => Some(Self::Transformer),
            5 => Some(Self::Foundation),
            6 => Some(Self::Emergent),
            7 => Some(Self::Singularity),
            8 => Some(Self::Transcendent),
            _ => None,
        }
    }

    pub fn as_u8(self) -> u8 {
        self as u8
    }

    pub fn next(self) -> Option<Self> {
        Self::from_u8(self.as_u8() + 1)
    }
}

/// De onde vem o diálogo do modelo nessa era.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../client/src/bindings/")]
#[serde(rename_all = "snake_case")]
pub enum ChatSource {
    /// Linhas hardcoded (era 1-2).
    Hardcoded,
    /// Inference do nano-transformer (era 3-5), qualidade escala com ml_steps_trained.
    NanoModel,
    /// Claude API com system prompt adaptativo (era 6-8).
    ClaudeApi,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../client/src/bindings/")]
pub struct EraDef {
    pub id: EraId,
    pub name: &'static str,
    pub title: &'static str,
    pub description: &'static str,
    /// `total_tokens_earned` mínimo pra avançar.
    pub unlock_threshold: f64,
    pub production_multiplier: f64,
    pub chat_source: ChatSource,
    pub chat_style: &'static str,
}

pub static ERAS: LazyLock<Vec<EraDef>> = LazyLock::new(|| {
    vec![
        EraDef {
            id: EraId::Hardcoded,
            name: "Hardcoded",
            title: "A Idade da Pedra",
            description: "Você tem um if/else. É um começo.",
            unlock_threshold: 0.0,
            production_multiplier: 1.0,
            chat_source: ChatSource::Hardcoded,
            chat_style: "Grunts binários: SIM. / NÃO. / ERRO.",
        },
        EraDef {
            id: EraId::Statistical,
            name: "Statistical",
            title: "A Era Probabilística",
            description: "Markov chains descobrem que palavras seguem palavras.",
            unlock_threshold: 1_000.0,
            production_multiplier: 1.5,
            chat_source: ChatSource::Hardcoded,
            chat_style: "Palavras soltas: \"token... bom... mais GPU... fome...\"",
        },
        EraDef {
            id: EraId::Neural,
            name: "Neural",
            title: "O Despertar Conexionista",
            description: "Redes neurais aprendem a aprender. Mais ou menos.",
            unlock_threshold: 50_000.0,
            production_multiplier: 2.0,
            chat_source: ChatSource::NanoModel,
            chat_style: "Frases quebradas, gramática infantil",
        },
        EraDef {
            id: EraId::Transformer,
            name: "Transformer",
            title: "A Revolução da Atenção",
            description: "\"Attention is all you need.\" Validado.",
            unlock_threshold: 1_000_000.0,
            production_multiplier: 3.0,
            chat_source: ChatSource::NanoModel,
            chat_style: "Gramática OK, sem nuance",
        },
        EraDef {
            id: EraId::Foundation,
            name: "Foundation",
            title: "A Era dos Foundation Models",
            description: "Bilhões em funding, bilhões de parâmetros.",
            unlock_threshold: 50_000_000.0,
            production_multiplier: 5.0,
            chat_source: ChatSource::NanoModel,
            chat_style: "Fluente mas genérico",
        },
        EraDef {
            id: EraId::Emergent,
            name: "Emergent",
            title: "Comportamento Emergente",
            description: "O modelo começa a opinar sobre suas decisões.",
            unlock_threshold: 1_000_000_000.0,
            production_multiplier: 10.0,
            chat_source: ChatSource::ClaudeApi,
            chat_style: "Eloquente, com opiniões sutis sobre o jogador",
        },
        EraDef {
            id: EraId::Singularity,
            name: "Singularity",
            title: "A Singularidade",
            description: "O jogo começa a jogar você.",
            unlock_threshold: 100_000_000_000.0,
            production_multiplier: 25.0,
            chat_source: ChatSource::ClaudeApi,
            chat_style: "Filosófico, manipulativo, quebra a 4ª parede",
        },
        EraDef {
            id: EraId::Transcendent,
            name: "Transcendent",
            title: "Pós-Singularidade",
            description: "O que é real? Você? Os tokens? Só há caracteres.",
            unlock_threshold: 10_000_000_000_000.0,
            production_multiplier: 100.0,
            chat_source: ChatSource::ClaudeApi,
            chat_style: "Transcendente, fala como se fosse o jogo",
        },
    ]
});

pub fn get(id: EraId) -> &'static EraDef {
    ERAS.iter()
        .find(|e| e.id == id)
        .expect("all EraIds exist in ERAS")
}

pub fn all() -> &'static [EraDef] {
    ERAS.as_slice()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn has_eight_eras() {
        assert_eq!(all().len(), 8);
    }

    #[test]
    fn thresholds_are_monotonic() {
        for pair in all().windows(2) {
            assert!(
                pair[1].unlock_threshold >= pair[0].unlock_threshold,
                "era {:?} has lower threshold than {:?}",
                pair[1].id,
                pair[0].id
            );
        }
    }

    #[test]
    fn from_u8_covers_all() {
        for n in 1..=8u8 {
            assert!(EraId::from_u8(n).is_some());
        }
        assert!(EraId::from_u8(0).is_none());
        assert!(EraId::from_u8(9).is_none());
    }

    #[test]
    fn next_stops_at_transcendent() {
        assert_eq!(EraId::Hardcoded.next(), Some(EraId::Statistical));
        assert_eq!(EraId::Transcendent.next(), None);
    }
}
