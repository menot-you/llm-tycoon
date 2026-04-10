//! Random event scheduling. Mantido stateless; o PlayerActor mantém o timer.

use rand::Rng;

use super::data::events::{self, RandomEventDef};
use super::state::GameState;

/// Sorteia um evento aplicável à era atual. Retorna `None` se não há eligible.
pub fn pick<R: Rng + ?Sized>(state: &GameState, rng: &mut R) -> Option<&'static RandomEventDef> {
    events::pick_for_era(state.era.as_u8(), rng)
}

/// Aplica o evento ao state. Retorna a descrição do efeito pra event log.
pub fn apply<R: Rng>(state: &mut GameState, event: &RandomEventDef, rng: &mut R) -> String {
    (event.apply)(state, rng)
}

/// Combina pick + apply num único passo. Usado pelo PlayerActor.
pub fn maybe_fire<R: Rng>(
    state: &mut GameState,
    rng: &mut R,
) -> Option<(&'static RandomEventDef, String)> {
    let event = pick(state, rng)?;
    let effect = apply(state, event, rng);
    Some((event, effect))
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::SeedableRng;
    use rand::rngs::StdRng;

    #[test]
    fn fires_event_on_eligible_era() {
        let s = GameState::new("t".into());
        let mut rng = StdRng::seed_from_u64(42);
        let ev = pick(&s, &mut rng);
        assert!(ev.is_some());
    }

    #[test]
    fn applies_event_returns_description() {
        let mut s = GameState::new("t".into());
        s.resources.tokens = 1_000.0;
        let mut rng = StdRng::seed_from_u64(1);
        let result = maybe_fire(&mut s, &mut rng);
        assert!(result.is_some());
        let (_ev, desc) = result.unwrap();
        assert!(!desc.is_empty());
    }
}
