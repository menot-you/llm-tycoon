//! Building purchase logic. Stateless — todas as funções recebem `&mut GameState`.

use thiserror::Error;

use super::data::buildings::{self, BuildingDef, BuildingId};
use super::formulas;
use super::state::GameState;

#[derive(Debug, Error, PartialEq)]
pub enum BuyError {
    #[error("building {0:?} not found")]
    NotFound(BuildingId),
    #[error("era {required} required (current: {current})")]
    EraLocked { current: u8, required: u8 },
    #[error("not enough tokens (need {need}, have {have})")]
    NotEnoughTokens { need: f64, have: f64 },
}

/// Resultado da compra.
#[derive(Debug, Clone, Copy)]
pub struct BuyReceipt {
    pub id: BuildingId,
    pub cost: f64,
    pub new_owned: u32,
}

/// Custo do próximo building, considerando o desconto de perks (quando aplicável).
///
/// `building_discount` vem do RebornManager (0.0..=0.95).
pub fn cost(state: &GameState, id: BuildingId, building_discount: f64) -> f64 {
    let Some(def) = buildings::get(id) else {
        return f64::INFINITY;
    };
    let owned = state.owned(id);
    let raw = formulas::building_cost(def.base_cost, def.cost_growth, owned);
    (raw * (1.0 - building_discount.clamp(0.0, 0.95))).floor()
}

/// True se a era atual permite e player tem tokens suficientes.
pub fn can_afford(state: &GameState, id: BuildingId, building_discount: f64) -> bool {
    let Some(def) = buildings::get(id) else {
        return false;
    };
    if state.era.as_u8() < def.era_required {
        return false;
    }
    state.resources.tokens >= cost(state, id, building_discount)
}

/// Compra. Mutaciona o state e retorna o recibo ou erro tipado.
pub fn buy(
    state: &mut GameState,
    id: BuildingId,
    building_discount: f64,
) -> Result<BuyReceipt, BuyError> {
    let def: &BuildingDef = buildings::get(id).ok_or(BuyError::NotFound(id))?;

    let current_era = state.era.as_u8();
    if current_era < def.era_required {
        return Err(BuyError::EraLocked {
            current: current_era,
            required: def.era_required,
        });
    }

    let price = cost(state, id, building_discount);
    if state.resources.tokens < price {
        return Err(BuyError::NotEnoughTokens {
            need: price,
            have: state.resources.tokens,
        });
    }

    state.resources.tokens -= price;
    state.increment_building(id, 1);

    Ok(BuyReceipt {
        id,
        cost: price,
        new_owned: state.owned(id),
    })
}

/// Soma da produção crua de todos os buildings (sem multipliers).
pub fn total_raw_production(state: &GameState) -> f64 {
    let mut total = 0.0;
    for def in buildings::all() {
        let owned = state.owned(def.id);
        if owned > 0 {
            total += formulas::building_production(def.base_production, owned);
        }
    }
    total
}

/// Valor total dos buildings (pra capability score).
pub fn total_building_value(state: &GameState) -> f64 {
    // Approximação: soma de `base_production × owned` de todos os tiers.
    total_raw_production(state)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fresh() -> GameState {
        GameState::new("test".into())
    }

    #[test]
    fn starts_with_zero_owned() {
        let s = fresh();
        assert_eq!(s.owned(BuildingId::IfElseBot), 0);
    }

    #[test]
    fn can_afford_when_enough_tokens() {
        let mut s = fresh();
        s.resources.tokens = 100.0;
        assert!(can_afford(&s, BuildingId::IfElseBot, 0.0));
    }

    #[test]
    fn cannot_afford_when_broke() {
        let mut s = fresh();
        s.resources.tokens = 5.0;
        assert!(!can_afford(&s, BuildingId::IfElseBot, 0.0));
    }

    #[test]
    fn buy_deducts_cost_and_increments_owned() {
        let mut s = fresh();
        s.resources.tokens = 100.0;
        let receipt = buy(&mut s, BuildingId::IfElseBot, 0.0).expect("should buy");
        assert_eq!(receipt.new_owned, 1);
        assert_eq!(s.owned(BuildingId::IfElseBot), 1);
        assert_eq!(s.resources.tokens, 85.0); // 100 - 15
    }

    #[test]
    fn buy_fails_when_cant_afford() {
        let mut s = fresh();
        s.resources.tokens = 5.0;
        let result = buy(&mut s, BuildingId::IfElseBot, 0.0);
        assert!(matches!(result, Err(BuyError::NotEnoughTokens { .. })));
        assert_eq!(s.owned(BuildingId::IfElseBot), 0);
        assert_eq!(s.resources.tokens, 5.0);
    }

    #[test]
    fn cost_scales_after_each_buy() {
        let mut s = fresh();
        s.resources.tokens = 1_000_000.0;
        let c1 = cost(&s, BuildingId::IfElseBot, 0.0);
        buy(&mut s, BuildingId::IfElseBot, 0.0).unwrap();
        let c2 = cost(&s, BuildingId::IfElseBot, 0.0);
        buy(&mut s, BuildingId::IfElseBot, 0.0).unwrap();
        let c3 = cost(&s, BuildingId::IfElseBot, 0.0);
        assert!(c2 > c1);
        assert!(c3 > c2);
    }

    #[test]
    fn total_production_sums_all_tiers() {
        let mut s = fresh();
        s.resources.tokens = 1_000_000.0;
        // 3 if/else bots (0.1 each = 0.3)
        for _ in 0..3 {
            buy(&mut s, BuildingId::IfElseBot, 0.0).unwrap();
        }
        s.era = crate::game::data::eras::EraId::Statistical;
        // 1 markov chain (1/s)
        buy(&mut s, BuildingId::MarkovChain, 0.0).unwrap();
        let total = total_raw_production(&s);
        assert!((total - 1.3).abs() < 1e-9);
    }

    #[test]
    fn buy_refuses_when_era_locked() {
        let mut s = fresh();
        s.resources.tokens = 1_000_000.0;
        // Markov chain requires era 2
        let result = buy(&mut s, BuildingId::MarkovChain, 0.0);
        assert!(matches!(result, Err(BuyError::EraLocked { .. })));
    }

    #[test]
    fn building_discount_reduces_cost() {
        let s = fresh();
        let full = cost(&s, BuildingId::IfElseBot, 0.0);
        let discounted = cost(&s, BuildingId::IfElseBot, 0.5);
        assert!(discounted < full);
    }
}
