//! Era advance logic. Stateless.

use super::data::eras::{self, EraDef, EraId};
use super::state::GameState;

/// Desconto aplicado ao threshold (from reborn perks). Clamp 0.0..=0.9.
pub fn effective_threshold(raw: f64, discount: f64) -> f64 {
    raw * (1.0 - discount.clamp(0.0, 0.9))
}

/// Tenta avançar de era. Retorna `Some((from, to))` se advanced.
pub fn check_advance(state: &mut GameState, era_discount: f64) -> Option<(EraId, EraId)> {
    let current = state.era;
    let next_id = current.next()?;
    let next = eras::get(next_id);

    let threshold = effective_threshold(next.unlock_threshold, era_discount);
    if state.total_tokens_earned >= threshold {
        state.era = next_id;
        Some((current, next_id))
    } else {
        None
    }
}

/// Progresso 0..1 pra próxima era.
pub fn progress_to_next(state: &GameState, era_discount: f64) -> f64 {
    let Some(next_id) = state.era.next() else {
        return 1.0;
    };
    let current: &EraDef = eras::get(state.era);
    let next = eras::get(next_id);

    let current_th = effective_threshold(current.unlock_threshold, era_discount);
    let next_th = effective_threshold(next.unlock_threshold, era_discount);
    let range = next_th - current_th;
    if range <= 0.0 {
        return 1.0;
    }
    ((state.total_tokens_earned - current_th) / range).clamp(0.0, 1.0)
}

/// Multiplicador de produção da era atual.
pub fn production_multiplier(state: &GameState) -> f64 {
    eras::get(state.era).production_multiplier
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn advance_requires_threshold() {
        let mut s = GameState::new("t".into());
        s.total_tokens_earned = 500.0;
        assert!(check_advance(&mut s, 0.0).is_none());

        s.total_tokens_earned = 1_000.0; // era 2 unlock
        let adv = check_advance(&mut s, 0.0).expect("should advance");
        assert_eq!(adv.0, EraId::Hardcoded);
        assert_eq!(adv.1, EraId::Statistical);
    }

    #[test]
    fn cannot_advance_past_era_8() {
        let mut s = GameState::new("t".into());
        s.era = EraId::Transcendent;
        s.total_tokens_earned = 1e20;
        assert!(check_advance(&mut s, 0.0).is_none());
    }

    #[test]
    fn era_discount_lowers_threshold() {
        let mut s = GameState::new("t".into());
        s.total_tokens_earned = 800.0; // abaixo de 1K
        assert!(check_advance(&mut s, 0.0).is_none());
        // Com 30% de desconto, threshold vira 700
        assert!(check_advance(&mut s, 0.3).is_some());
    }

    #[test]
    fn progress_bounded_0_to_1() {
        let mut s = GameState::new("t".into());
        s.total_tokens_earned = 500.0;
        let p = progress_to_next(&s, 0.0);
        assert!((0.0..=1.0).contains(&p));
    }
}
