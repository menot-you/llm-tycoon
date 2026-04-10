//! Achievement check logic. Chamado a cada ~1s no tick loop.

use super::data::achievements::{self, AchievementDef};
use super::state::GameState;

/// Verifica todos os achievements não-desbloqueados. Retorna os novos IDs desbloqueados.
pub fn check(state: &mut GameState) -> Vec<&'static AchievementDef> {
    let mut unlocks = Vec::new();
    for def in achievements::all() {
        if state.achievements.iter().any(|id| id == def.id) {
            continue;
        }
        if let Some(check) = def.check
            && check(state)
        {
            state.achievements.push(def.id.to_string());
            unlocks.push(def);
        }
    }
    unlocks
}

/// Unlock manual (pra easter eggs tipo touch_grass).
pub fn unlock(state: &mut GameState, id: &str) -> Option<&'static AchievementDef> {
    if state.achievements.iter().any(|x| x == id) {
        return None;
    }
    let def = achievements::get(id)?;
    state.achievements.push(id.to_string());
    Some(def)
}

pub fn total() -> usize {
    achievements::all().len()
}

pub fn count(state: &GameState) -> usize {
    state.achievements.len()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn check_unlocks_first_token() {
        let mut s = GameState::new("t".into());
        s.add_tokens(1.0);
        let unlocks = check(&mut s);
        assert!(unlocks.iter().any(|d| d.id == "first_token"));
    }

    #[test]
    fn check_idempotent() {
        let mut s = GameState::new("t".into());
        s.add_tokens(1.0);
        check(&mut s);
        let unlocks2 = check(&mut s);
        assert_eq!(unlocks2.len(), 0, "should not re-unlock");
    }

    #[test]
    fn manual_unlock_for_hidden() {
        let mut s = GameState::new("t".into());
        let def = unlock(&mut s, "touch_grass").unwrap();
        assert_eq!(def.id, "touch_grass");
        assert!(s.achievements.contains(&"touch_grass".to_string()));
    }
}
