//! Upgrade purchase logic + multiplier accessors.

use thiserror::Error;

use super::data::upgrades::{self, CostResource, EffectKind, UpgradeDef};
use super::state::GameState;

#[derive(Debug, Error, PartialEq)]
pub enum UpgradeBuyError {
    #[error("upgrade {0} not found")]
    NotFound(String),
    #[error("already bought")]
    AlreadyBought,
    #[error("era {required} required (current: {current})")]
    EraLocked { current: u8, required: u8 },
    #[error("not enough {resource:?}: need {need}, have {have}")]
    NotEnough {
        resource: CostResource,
        need: f64,
        have: f64,
    },
}

/// Lista os upgrades disponíveis pra compra (era OK e não comprados ainda).
pub fn available(state: &GameState) -> Vec<&'static UpgradeDef> {
    upgrades::all()
        .iter()
        .filter(|u| {
            state.era.as_u8() >= u.era_required && !state.upgrades.iter().any(|x| x == u.id)
        })
        .collect()
}

pub fn has(state: &GameState, id: &str) -> bool {
    state.upgrades.iter().any(|x| x == id)
}

pub fn can_afford(state: &GameState, id: &str) -> bool {
    let Some(def) = upgrades::get(id) else {
        return false;
    };
    if state.era.as_u8() < def.era_required {
        return false;
    }
    if has(state, id) {
        return false;
    }
    resource_amount(state, def.cost_resource) >= def.cost
}

pub fn buy(state: &mut GameState, id: &str) -> Result<&'static UpgradeDef, UpgradeBuyError> {
    let def = upgrades::get(id).ok_or_else(|| UpgradeBuyError::NotFound(id.to_string()))?;

    if has(state, id) {
        return Err(UpgradeBuyError::AlreadyBought);
    }

    let current_era = state.era.as_u8();
    if current_era < def.era_required {
        return Err(UpgradeBuyError::EraLocked {
            current: current_era,
            required: def.era_required,
        });
    }

    let have = resource_amount(state, def.cost_resource);
    if have < def.cost {
        return Err(UpgradeBuyError::NotEnough {
            resource: def.cost_resource,
            need: def.cost,
            have,
        });
    }

    subtract_resource(state, def.cost_resource, def.cost);
    state.upgrades.push(id.to_string());
    Ok(def)
}

fn resource_amount(state: &GameState, r: CostResource) -> f64 {
    match r {
        CostResource::Tokens => state.resources.tokens,
        CostResource::Funding => state.resources.funding,
    }
}

fn subtract_resource(state: &mut GameState, r: CostResource, amount: f64) {
    match r {
        CostResource::Tokens => state.resources.tokens -= amount,
        CostResource::Funding => state.resources.funding -= amount,
    }
}

// ============================================================
// Multiplier accessors (usados pelo ResourceManager)
// ============================================================

/// Multiplicador acumulado de produção de tokens (produto de todos os `TokensMult`).
pub fn tokens_multiplier(state: &GameState) -> f64 {
    let mut mult = 1.0;
    for id in &state.upgrades {
        if let Some(def) = upgrades::get(id) {
            for eff in &def.effects {
                if matches!(eff.kind, EffectKind::TokensMult) {
                    mult *= eff.value;
                }
            }
        }
    }
    mult
}

/// Redução de alucinação acumulada (cap em 0.95).
pub fn hallucination_reduction(state: &GameState) -> f64 {
    let mut red = 0.0;
    for id in &state.upgrades {
        if let Some(def) = upgrades::get(id) {
            for eff in &def.effects {
                if matches!(eff.kind, EffectKind::HallucinationReduction) {
                    red += eff.value;
                }
            }
        }
    }
    red.min(0.95)
}

/// Bonus de hype por segundo.
pub fn hype_gain(state: &GameState) -> f64 {
    let mut gain = 0.0;
    for id in &state.upgrades {
        if let Some(def) = upgrades::get(id) {
            for eff in &def.effects {
                if matches!(eff.kind, EffectKind::HypeGain) {
                    gain += eff.value;
                }
            }
        }
    }
    gain
}

/// Multiplicador de funding.
pub fn funding_multiplier(state: &GameState) -> f64 {
    let mut mult = 1.0;
    for id in &state.upgrades {
        if let Some(def) = upgrades::get(id) {
            for eff in &def.effects {
                if matches!(eff.kind, EffectKind::FundingMult) {
                    mult *= eff.value;
                }
            }
        }
    }
    mult
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fresh() -> GameState {
        GameState::new("test".into())
    }

    #[test]
    fn no_upgrades_means_mult_one() {
        let s = fresh();
        assert_eq!(tokens_multiplier(&s), 1.0);
    }

    #[test]
    fn buy_used_gpu_scales_mult() {
        let mut s = fresh();
        s.resources.tokens = 1000.0;
        buy(&mut s, "used_gpu").unwrap();
        assert!(has(&s, "used_gpu"));
        assert!((tokens_multiplier(&s) - 1.5).abs() < 1e-9);
    }

    #[test]
    fn buy_fails_when_already_bought() {
        let mut s = fresh();
        s.resources.tokens = 10_000.0;
        buy(&mut s, "used_gpu").unwrap();
        assert!(matches!(
            buy(&mut s, "used_gpu"),
            Err(UpgradeBuyError::AlreadyBought)
        ));
    }

    #[test]
    fn era_lock_prevents_future_upgrades() {
        let mut s = fresh();
        s.resources.tokens = 1_000_000.0;
        // rtx_4090 requires era 2
        let result = buy(&mut s, "rtx_4090");
        assert!(matches!(result, Err(UpgradeBuyError::EraLocked { .. })));
    }

    #[test]
    fn available_filters_by_era() {
        let mut s = fresh();
        // Era 1
        let a1 = available(&s);
        assert!(a1.iter().all(|u| u.era_required <= 1));

        s.era = crate::game::data::eras::EraId::Foundation; // 5
        let a5 = available(&s);
        assert!(a5.iter().all(|u| u.era_required <= 5));
        assert!(a5.len() > a1.len());
    }
}
