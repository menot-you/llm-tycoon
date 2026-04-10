//! Resource tick + rate calculators.
//!
//! **A função `tick/2` é o coração do jogo.** É chamada 10 vezes por segundo
//! pelo `PlayerActor` e aplica produção/consumo aos 6 recursos.
//!
//! Ver `GAME_CONCEPT.md` seção "Tick" para o fluxo canônico.

use super::{buildings, eras, prestige, reborn, upgrades};
use super::formulas::{
    HALLUCINATION_DRAIN_FACTOR, HALLUCINATION_GROWTH_RATE, HYPE_DECAY_PER_SECOND,
    PRESTIGE_BONUS_PER_POINT,
};
use super::state::GameState;

/// Tokens/s efetivos, com todos os multiplicadores e drain.
pub fn effective_token_rate(state: &GameState) -> f64 {
    let base = buildings::total_raw_production(state);
    let upgrades_mult = upgrades::tokens_multiplier(state);
    let era_mult = eras::production_multiplier(state);
    let prestige_mult = 1.0 + state.insight_points as f64 * PRESTIGE_BONUS_PER_POINT;
    let permanent_mult = prestige::production_multiplier(state);
    let neural_mult = reborn::neural_multiplier(state);
    let compound_mult = reborn::compound_prestige_multiplier(state);
    let auto_click = reborn::auto_click_rate(state);

    let hallucination_drain = state.resources.hallucinations * HALLUCINATION_DRAIN_FACTOR;

    let gross = (base + auto_click)
        * upgrades_mult
        * era_mult
        * prestige_mult
        * permanent_mult
        * neural_mult
        * compound_mult;

    (gross - gross * hallucination_drain).max(0.0)
}

/// Compute/s — 30% da produção de tokens.
pub fn compute_rate(state: &GameState) -> f64 {
    effective_token_rate(state) * 0.3
}

/// Hype/s — soma dos upgrades + log do token rate.
pub fn hype_rate(state: &GameState) -> f64 {
    let from_upgrades = upgrades::hype_gain(state);
    let from_production = effective_token_rate(state).max(1.0).log10() * 0.5;
    from_upgrades + from_production
}

/// Funding/s — derivado do hype com multiplicador.
pub fn funding_rate(state: &GameState) -> f64 {
    let hype = state.resources.hype.max(1.0);
    hype.log10() * 10.0 * upgrades::funding_multiplier(state)
}

/// Um tick: aplica produção/consumo pros 6 recursos. `delta` em segundos.
pub fn tick(state: &mut GameState, delta: f64) {
    let token_rate = effective_token_rate(state);
    let compute_rate_s = compute_rate(state);
    let hype_rate_s = hype_rate(state);
    let funding_rate_s = funding_rate(state);

    // Tokens
    let tokens_produced = token_rate * delta;
    state.resources.tokens += tokens_produced;
    state.total_tokens_earned += tokens_produced;

    // Compute
    state.resources.compute += compute_rate_s * delta;

    // Hype (gain + decay)
    state.resources.hype += hype_rate_s * delta;
    state.resources.hype *= (1.0 - HYPE_DECAY_PER_SECOND).powf(delta);
    if state.resources.hype < 0.0 {
        state.resources.hype = 0.0;
    }

    // Funding
    state.resources.funding += funding_rate_s * delta;

    // Hallucinations (growth - reduction from safety upgrades)
    let base_growth = token_rate * HALLUCINATION_GROWTH_RATE * delta;
    let reduction = upgrades::hallucination_reduction(state);
    state.resources.hallucinations += base_growth * (1.0 - reduction);
    if state.resources.hallucinations > 1.0 {
        state.resources.hallucinations = 1.0;
    }

    // Data
    state.resources.data += compute_rate_s * 0.01 * delta;

    state.tick_count += 1;
}

/// Adiciona tokens manualmente (pra click intent).
pub fn click(state: &mut GameState) {
    let bonus = upgrades::tokens_multiplier(state).max(1.0) + reborn::click_bonus(state);
    state.add_tokens(bonus);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::game::data::buildings::BuildingId;

    #[test]
    fn tick_with_no_buildings_is_zero() {
        let mut s = GameState::new("t".into());
        let before = s.resources.tokens;
        tick(&mut s, 1.0);
        assert_eq!(s.resources.tokens, before);
    }

    #[test]
    fn tick_accumulates_tokens_with_building() {
        let mut s = GameState::new("t".into());
        s.increment_building(BuildingId::IfElseBot, 10); // 10 * 0.1 = 1.0/s
        tick(&mut s, 1.0);
        // Era 1 multiplier = 1, no upgrades, no reborn = ~1 token
        assert!(s.resources.tokens > 0.9);
        assert!(s.resources.tokens <= 1.1);
    }

    #[test]
    fn click_awards_at_least_one_token() {
        let mut s = GameState::new("t".into());
        click(&mut s);
        assert!(s.resources.tokens >= 1.0);
    }

    #[test]
    fn hype_decays_over_time() {
        let mut s = GameState::new("t".into());
        s.resources.hype = 1000.0;
        // 60 seconds of zero production tick
        for _ in 0..60 {
            tick(&mut s, 1.0);
        }
        // 5% decay per minute → ~950 after 60s
        assert!(s.resources.hype < 960.0);
    }

    #[test]
    fn hallucinations_cap_at_one() {
        let mut s = GameState::new("t".into());
        s.resources.hallucinations = 0.99;
        s.increment_building(BuildingId::Quantum, 100_000);
        s.era = crate::game::data::eras::EraId::Transcendent;
        tick(&mut s, 10.0);
        assert!(s.resources.hallucinations <= 1.0);
    }
}
