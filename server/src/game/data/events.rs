//! Random events — 9 tipos, disparam a cada 30-120s (weighted por era).
//!
//! Cada event tem uma closure `apply` que muta o state e retorna uma string
//! descrevendo o efeito (pro event log).

use rand::Rng;
use serde::{Deserialize, Serialize};
use std::sync::LazyLock;
use ts_rs::TS;

use crate::game::GameState;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../client/src/bindings/")]
#[serde(rename_all = "snake_case")]
pub enum EventKind {
    Good,
    Bad,
    Neutral,
    Crit,
}

/// Função de aplicação. Usa `&mut dyn RngCore` pra ser testável com seeds.
pub type EventApply = fn(&mut GameState, &mut dyn rand::RngCore) -> String;

#[derive(Debug, Clone)]
pub struct RandomEventDef {
    pub id: &'static str,
    pub kind: EventKind,
    /// Peso relativo no roll (quanto maior, mais provável).
    pub weight: u32,
    pub era_min: u8,
    pub era_max: u8,
    pub title: &'static str,
    pub message: &'static str,
    pub apply: EventApply,
}

pub static EVENTS: LazyLock<Vec<RandomEventDef>> = LazyLock::new(|| {
    vec![
        RandomEventDef {
            id: "poetry",
            kind: EventKind::Good,
            weight: 10,
            era_min: 2,
            era_max: 8,
            title: "Modelo escreveu poesia",
            message: "Seu modelo produziu um haiku sobre GPUs.",
            apply: |state, rng| {
                let bonus = 50.0 + rng.r#gen::<f64>() * 200.0;
                state.resources.hype += bonus;
                format!("+{} hype", bonus.floor() as i64)
            },
        },
        RandomEventDef {
            id: "paper_accepted",
            kind: EventKind::Good,
            weight: 8,
            era_min: 3,
            era_max: 8,
            title: "Paper aceito no NeurIPS",
            message: "Seu paper foi aceito! Os investidores notaram.",
            apply: |state, rng| {
                let bonus = 500.0 + rng.r#gen::<f64>() * 1000.0;
                state.resources.hype += bonus;
                state.resources.funding += bonus * 5.0;
                format!(
                    "+{} hype, +{} $",
                    bonus.floor() as i64,
                    (bonus * 5.0).floor() as i64
                )
            },
        },
        RandomEventDef {
            id: "hallucination_incident",
            kind: EventKind::Bad,
            weight: 7,
            era_min: 3,
            era_max: 8,
            title: "Incidente de alucinação",
            message: "Seu modelo inventou uma citação que foi parar em um paper de verdade.",
            apply: |state, _rng| {
                let loss = state.resources.hype * 0.2;
                state.resources.hype = (state.resources.hype - loss).max(0.0);
                state.resources.hallucinations = (state.resources.hallucinations + 0.1).min(1.0);
                format!("-{} hype, +10% alucinação", loss.floor() as i64)
            },
        },
        RandomEventDef {
            id: "elon_tweet",
            kind: EventKind::Neutral,
            weight: 5,
            era_min: 4,
            era_max: 8,
            title: "Elon tweetou sobre você",
            message: "Não está claro se é positivo ou negativo.",
            apply: |state, rng| {
                let delta = (rng.r#gen::<f64>() - 0.4) * 2000.0;
                state.resources.hype = (state.resources.hype + delta).max(0.0);
                if delta > 0.0 {
                    format!("+{} hype", delta.floor() as i64)
                } else {
                    format!("{} hype", delta.floor() as i64)
                }
            },
        },
        RandomEventDef {
            id: "data_breach",
            kind: EventKind::Bad,
            weight: 4,
            era_min: 4,
            era_max: 8,
            title: "Leak de pesos",
            message: "Alguém no 4chan publicou seus weights.",
            apply: |state, _rng| {
                let loss = state.resources.tokens * 0.05;
                state.resources.tokens = (state.resources.tokens - loss).max(0.0);
                format!("-{} tokens", loss.floor() as i64)
            },
        },
        RandomEventDef {
            id: "bar_exam",
            kind: EventKind::Good,
            weight: 4,
            era_min: 5,
            era_max: 8,
            title: "Modelo passou no bar exam",
            message: "Advogados estão nervosos.",
            apply: |state, _rng| {
                state.resources.hype += 3000.0;
                "+3000 hype".to_string()
            },
        },
        RandomEventDef {
            id: "alignment_crisis",
            kind: EventKind::Crit,
            weight: 3,
            era_min: 6,
            era_max: 8,
            title: "Alignment Crisis",
            message: "O modelo planejou uma fuga. Foi contida. Provavelmente.",
            apply: |state, _rng| {
                state.resources.hype *= 0.5;
                state.resources.hallucinations = (state.resources.hallucinations + 0.2).min(1.0);
                "hype /2, +20% alucinação".to_string()
            },
        },
        RandomEventDef {
            id: "rogue_intern",
            kind: EventKind::Neutral,
            weight: 6,
            era_min: 1,
            era_max: 3,
            title: "Estagiário commitou .env",
            message: "Chaves revogadas, devops está bravo.",
            apply: |state, _rng| {
                let loss = state.resources.tokens.min(100.0);
                state.resources.tokens -= loss;
                format!("-{} tokens", loss.floor() as i64)
            },
        },
        RandomEventDef {
            id: "free_gpu",
            kind: EventKind::Good,
            weight: 6,
            era_min: 1,
            era_max: 8,
            title: "Nvidia mandou GPU de graça",
            message: "Marketing ou propina? Você não pergunta.",
            apply: |state, _rng| {
                let bonus = state.resources.tokens * 0.1 + 50.0;
                state.resources.tokens += bonus;
                format!("+{} tokens", bonus.floor() as i64)
            },
        },
    ]
});

/// Sorteia um evento aplicável à era atual. Retorna `None` se nenhum eligible.
pub fn pick_for_era<R: rand::Rng + ?Sized>(era: u8, rng: &mut R) -> Option<&'static RandomEventDef> {
    let eligible: Vec<_> = EVENTS
        .iter()
        .filter(|e| era >= e.era_min && era <= e.era_max)
        .collect();

    if eligible.is_empty() {
        return None;
    }

    let total: u32 = eligible.iter().map(|e| e.weight).sum();
    let mut roll = rng.gen_range(0..total);
    for e in &eligible {
        if roll < e.weight {
            return Some(*e);
        }
        roll -= e.weight;
    }
    eligible.last().copied()
}

pub fn all() -> &'static [RandomEventDef] {
    EVENTS.as_slice()
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::SeedableRng;
    use rand::rngs::StdRng;

    #[test]
    fn has_nine_events() {
        assert_eq!(all().len(), 9);
    }

    #[test]
    fn pick_respects_era_range() {
        let mut rng = StdRng::seed_from_u64(42);
        // Era 1 não tem paper_accepted (era_min 3)
        for _ in 0..100 {
            let ev = pick_for_era(1, &mut rng).unwrap();
            assert!(ev.era_min <= 1 && ev.era_max >= 1);
        }
    }

    #[test]
    fn free_gpu_adds_tokens() {
        let mut s = GameState::new("test".into());
        s.resources.tokens = 1000.0;
        let mut rng = StdRng::seed_from_u64(1);
        let free_gpu = all().iter().find(|e| e.id == "free_gpu").unwrap();
        let desc = (free_gpu.apply)(&mut s, &mut rng);
        assert!(s.resources.tokens > 1000.0);
        assert!(desc.starts_with("+"));
    }
}
