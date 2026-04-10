//! Prestige logic — reset + Insight Points + permanent upgrades.

use super::data::permanents::{self, PermanentEffect, PermanentUpgradeDef};
use super::formulas;
use super::state::GameState;

/// Preview de quantos IP o player ganharia se prestigiasse agora.
pub fn preview_points(state: &GameState) -> u32 {
    formulas::insight_points_from_prestige(state.total_tokens_earned)
}

pub fn can_prestige(state: &GameState) -> bool {
    preview_points(state) >= 1
}

/// Executa o prestige. Retorna IP ganhos.
///
/// Preserva: permanent_upgrades, insight_points (+ novos), prestige_count (+1),
/// player_id, display_name, achievements, reborn_count, reborn_points,
/// unlocked_perks, ml_steps_trained, ml_capability_score, total_prestiges_all_time.
///
/// Reset: tudo o resto (resources, buildings, upgrades, era, tick_count, total_tokens_earned).
pub fn prestige(state: &mut GameState) -> u32 {
    let points = preview_points(state);
    if points < 1 {
        return 0;
    }

    let preserved = PreservedFields {
        player_id: state.player_id.clone(),
        display_name: state.display_name.clone(),
        achievements: state.achievements.clone(),
        insight_points: state.insight_points + points,
        prestige_count: state.prestige_count + 1,
        permanent_upgrades: state.permanent_upgrades.clone(),
        reborn_count: state.reborn_count,
        reborn_points: state.reborn_points,
        unlocked_perks: state.unlocked_perks.clone(),
        total_prestiges_all_time: state.total_prestiges_all_time,
        ml_steps_trained: state.ml_steps_trained,
        ml_capability_score: state.ml_capability_score,
    };

    let mut fresh = GameState::new(preserved.player_id.clone());
    fresh.display_name = preserved.display_name;
    fresh.achievements = preserved.achievements;
    fresh.insight_points = preserved.insight_points;
    fresh.prestige_count = preserved.prestige_count;
    fresh.permanent_upgrades = preserved.permanent_upgrades;
    fresh.reborn_count = preserved.reborn_count;
    fresh.reborn_points = preserved.reborn_points;
    fresh.unlocked_perks = preserved.unlocked_perks;
    fresh.total_prestiges_all_time = preserved.total_prestiges_all_time;
    fresh.ml_steps_trained = preserved.ml_steps_trained;
    fresh.ml_capability_score = preserved.ml_capability_score;

    apply_start_bonuses(&mut fresh);

    *state = fresh;
    points
}

struct PreservedFields {
    player_id: String,
    display_name: String,
    achievements: Vec<String>,
    insight_points: u32,
    prestige_count: u32,
    permanent_upgrades: Vec<String>,
    reborn_count: u32,
    reborn_points: u32,
    unlocked_perks: Vec<String>,
    total_prestiges_all_time: u32,
    ml_steps_trained: u32,
    ml_capability_score: u64,
}

/// Aplica bônus de início dos permanents (start_tokens, etc).
fn apply_start_bonuses(state: &mut GameState) {
    for id in &state.permanent_upgrades.clone() {
        if let Some(def) = permanents::get(id)
            && matches!(def.effect, PermanentEffect::StartTokens)
        {
            state.resources.tokens += def.value;
        }
    }
}

/// Quantas vezes o permanent upgrade `id` foi comprado.
pub fn stacks_of(state: &GameState, id: &str) -> u32 {
    state.permanent_upgrades.iter().filter(|x| *x == id).count() as u32
}

pub fn can_buy_permanent(state: &GameState, def: &PermanentUpgradeDef) -> bool {
    if state.insight_points < def.cost {
        return false;
    }
    if let Some(max) = def.max_stacks
        && stacks_of(state, def.id) >= max
    {
        return false;
    }
    true
}

pub fn buy_permanent(state: &mut GameState, id: &str) -> Result<&'static PermanentUpgradeDef, ()> {
    let def = permanents::get(id).ok_or(())?;
    if !can_buy_permanent(state, def) {
        return Err(());
    }
    state.insight_points -= def.cost;
    state.permanent_upgrades.push(id.to_string());
    Ok(def)
}

/// Multiplicador permanente aplicado na produção (compound entre stacks).
pub fn production_multiplier(state: &GameState) -> f64 {
    let mut mult = 1.0;
    for id in &state.permanent_upgrades {
        if let Some(def) = permanents::get(id)
            && matches!(def.effect, PermanentEffect::ProductionMult)
        {
            mult *= def.value;
        }
    }
    mult
}

/// Bônus de offline efficiency (cap em 0.3).
pub fn offline_bonus(state: &GameState) -> f64 {
    let mut bonus = 0.0;
    for id in &state.permanent_upgrades {
        if let Some(def) = permanents::get(id)
            && matches!(def.effect, PermanentEffect::OfflineEfficiency)
        {
            bonus += def.value;
        }
    }
    bonus.min(0.3)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn no_points_below_threshold() {
        let mut s = GameState::new("t".into());
        s.total_tokens_earned = 500_000.0;
        assert_eq!(preview_points(&s), 0);
        assert!(!can_prestige(&s));
    }

    #[test]
    fn preserves_identity_and_progression() {
        let mut s = GameState::new("player-xyz".into());
        s.display_name = "Neo".into();
        s.total_tokens_earned = 4_000_000.0; // 2 IP
        s.prestige_count = 3;
        s.achievements = vec!["first_token".into()];
        s.permanent_upgrades = vec!["hindsight".into()];
        s.ml_steps_trained = 42;

        let points = prestige(&mut s);
        assert_eq!(points, 2);
        assert_eq!(s.prestige_count, 4);
        assert_eq!(s.insight_points, 2);
        assert_eq!(s.player_id, "player-xyz");
        assert_eq!(s.display_name, "Neo");
        assert_eq!(s.achievements, vec!["first_token".to_string()]);
        assert_eq!(s.ml_steps_trained, 42);
        // Reset: tokens and tick_count go back to zero
        assert_eq!(s.total_tokens_earned, 0.0);
        // But hindsight gives +100 start tokens
        assert_eq!(s.resources.tokens, 100.0);
    }

    #[test]
    fn buy_permanent_deducts_ip_and_stacks() {
        let mut s = GameState::new("t".into());
        s.insight_points = 5;
        buy_permanent(&mut s, "hindsight").unwrap(); // cost 1
        assert_eq!(s.insight_points, 4);
        assert_eq!(stacks_of(&s, "hindsight"), 1);
    }

    #[test]
    fn buy_permanent_fails_when_broke() {
        let mut s = GameState::new("t".into());
        s.insight_points = 0;
        assert!(buy_permanent(&mut s, "hindsight").is_err());
    }

    #[test]
    fn production_mult_compounds() {
        let mut s = GameState::new("t".into());
        s.permanent_upgrades = vec!["transfer_learning".into(), "transfer_learning".into()];
        // 1.1 × 1.1 = 1.21
        assert!((production_multiplier(&s) - 1.21).abs() < 1e-9);
    }
}
