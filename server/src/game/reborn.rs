//! Reborn logic — segundo layer de reset. Preserva ML memory.
//!
//! Fórmula: `RP = floor(sqrt(total_prestiges_all_time * max_era_reached))`
//! Requer: era ≥ 7 OU prestige_count ≥ 3

use super::data::buildings::BuildingId;
use super::data::perks::{self, PerkDef, PerkEffect};
use super::state::GameState;

pub fn preview_points(state: &GameState) -> u32 {
    let max_era = state.era.as_u8().max(1) as u64;
    let total_prestiges = state.total_prestiges_all_time + state.prestige_count;
    ((total_prestiges as u64 * max_era) as f64).sqrt().floor() as u32
}

pub fn can_reborn(state: &GameState) -> bool {
    if state.era.as_u8() < 7 && state.prestige_count < 3 {
        return false;
    }
    preview_points(state) >= 1
}

/// Executa o reborn. Retorna (rp_ganhos, new_reborn_count). 0 se não pôde.
pub fn reborn(state: &mut GameState) -> (u32, u32) {
    let rp_gained = preview_points(state);
    if rp_gained < 1 {
        return (0, state.reborn_count);
    }

    let preserved = PreservedReborn {
        player_id: state.player_id.clone(),
        display_name: state.display_name.clone(),
        achievements: state.achievements.clone(),
        reborn_count: state.reborn_count + 1,
        reborn_points: state.reborn_points + rp_gained,
        unlocked_perks: state.unlocked_perks.clone(),
        total_prestiges_all_time: state.total_prestiges_all_time + state.prestige_count,
        ml_steps_trained: state.ml_steps_trained,
        ml_capability_score: state.ml_capability_score,
    };

    let new_reborn_count = preserved.reborn_count;

    let mut fresh = GameState::new(preserved.player_id.clone());
    fresh.display_name = preserved.display_name;
    fresh.achievements = preserved.achievements;
    fresh.reborn_count = preserved.reborn_count;
    fresh.reborn_points = preserved.reborn_points;
    fresh.unlocked_perks = preserved.unlocked_perks;
    fresh.total_prestiges_all_time = preserved.total_prestiges_all_time;
    fresh.ml_steps_trained = preserved.ml_steps_trained;
    fresh.ml_capability_score = preserved.ml_capability_score;

    apply_start_bonuses(&mut fresh);

    *state = fresh;
    (rp_gained, new_reborn_count)
}

struct PreservedReborn {
    player_id: String,
    display_name: String,
    achievements: Vec<String>,
    reborn_count: u32,
    reborn_points: u32,
    unlocked_perks: Vec<String>,
    total_prestiges_all_time: u32,
    ml_steps_trained: u32,
    ml_capability_score: u64,
}

fn apply_start_bonuses(state: &mut GameState) {
    for id in &state.unlocked_perks.clone() {
        if let Some(def) = perks::get(id) {
            match def.effect {
                PerkEffect::StartIp => {
                    state.insight_points += def.value as u32;
                }
                PerkEffect::SecondWind => {
                    state.increment_building(BuildingId::IfElseBot, 3);
                    state.increment_building(BuildingId::MarkovChain, 2);
                }
                _ => {}
            }
        }
    }
}

// ============================================================
// Perk buying + accessors
// ============================================================

pub fn stacks_of(state: &GameState, id: &str) -> u32 {
    state.unlocked_perks.iter().filter(|x| *x == id).count() as u32
}

pub fn can_buy_perk(state: &GameState, def: &PerkDef) -> bool {
    if state.reborn_points < def.cost {
        return false;
    }
    if let Some(max) = def.max_stacks
        && stacks_of(state, def.id) >= max
    {
        return false;
    }
    true
}

pub fn buy_perk(state: &mut GameState, id: &str) -> Result<&'static PerkDef, ()> {
    let def = perks::get(id).ok_or(())?;
    if !can_buy_perk(state, def) {
        return Err(());
    }
    state.reborn_points -= def.cost;
    state.unlocked_perks.push(id.to_string());
    Ok(def)
}

// ============================================================
// Effect accessors (usados pelo ResourceManager)
// ============================================================

pub fn neural_multiplier(state: &GameState) -> f64 {
    let mut mult = 1.0;
    for id in &state.unlocked_perks {
        if let Some(def) = perks::get(id)
            && matches!(def.effect, PerkEffect::NeuralMult)
        {
            mult *= 1.0 + def.value * state.ml_steps_trained as f64;
        }
    }
    mult
}

pub fn compound_prestige_multiplier(state: &GameState) -> f64 {
    let mut rate = 0.0;
    for id in &state.unlocked_perks {
        if let Some(def) = perks::get(id)
            && matches!(def.effect, PerkEffect::CompoundPrestige)
        {
            rate += def.value;
        }
    }
    (1.0 + rate).powi(state.reborn_count as i32)
}

pub fn auto_click_rate(state: &GameState) -> f64 {
    let mut total = 0.0;
    for id in &state.unlocked_perks {
        if let Some(def) = perks::get(id)
            && matches!(def.effect, PerkEffect::AutoClick)
        {
            total += def.value;
        }
    }
    total
}

pub fn click_bonus(state: &GameState) -> f64 {
    let mut total = 0.0;
    for id in &state.unlocked_perks {
        if let Some(def) = perks::get(id)
            && matches!(def.effect, PerkEffect::ClickMulti)
        {
            total += def.value;
        }
    }
    total
}

pub fn building_discount(state: &GameState) -> f64 {
    let mut total = 0.0;
    for id in &state.unlocked_perks {
        if let Some(def) = perks::get(id)
            && matches!(def.effect, PerkEffect::CheaperBuildings)
        {
            total += def.value;
        }
    }
    total.min(0.95)
}

pub fn era_discount(state: &GameState) -> f64 {
    let mut total = 0.0;
    for id in &state.unlocked_perks {
        if let Some(def) = perks::get(id)
            && matches!(def.effect, PerkEffect::EraDiscount)
        {
            total += def.value;
        }
    }
    total.min(0.9)
}

pub fn has_offline_master(state: &GameState) -> bool {
    state.unlocked_perks.iter().any(|id| id == "offline_master")
}

pub fn has_oracle(state: &GameState) -> bool {
    state.unlocked_perks.iter().any(|id| id == "oracle")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cannot_reborn_below_requirement() {
        let mut s = GameState::new("t".into());
        s.prestige_count = 1; // < 3
        assert!(!can_reborn(&s));
    }

    #[test]
    fn can_reborn_with_3_prestiges() {
        let mut s = GameState::new("t".into());
        s.prestige_count = 3;
        // sqrt(3*1) = 1.732 → 1
        assert!(can_reborn(&s));
        assert_eq!(preview_points(&s), 1);
    }

    #[test]
    fn reborn_preserves_ml_and_perks() {
        let mut s = GameState::new("xyz".into());
        s.prestige_count = 3;
        s.ml_steps_trained = 100;
        s.unlocked_perks = vec!["neural_memory".into()];
        s.resources.tokens = 1e9;

        let (rp, count) = reborn(&mut s);
        assert_eq!(rp, 1);
        assert_eq!(count, 1);
        assert_eq!(s.ml_steps_trained, 100);
        assert_eq!(s.unlocked_perks, vec!["neural_memory".to_string()]);
        assert_eq!(s.resources.tokens, 0.0);
        assert_eq!(s.prestige_count, 0);
        assert_eq!(s.total_prestiges_all_time, 3);
    }

    #[test]
    fn second_wind_gives_starting_buildings() {
        let mut s = GameState::new("t".into());
        s.prestige_count = 3;
        s.unlocked_perks = vec!["second_wind".into()];
        reborn(&mut s);
        assert_eq!(s.owned(BuildingId::IfElseBot), 3);
        assert_eq!(s.owned(BuildingId::MarkovChain), 2);
    }

    #[test]
    fn neural_multiplier_scales_with_ml_steps() {
        let mut s = GameState::new("t".into());
        s.unlocked_perks = vec!["neural_memory".into()];
        s.ml_steps_trained = 100;
        // 1 + 0.005 * 100 = 1.5
        assert!((neural_multiplier(&s) - 1.5).abs() < 1e-9);
    }
}
