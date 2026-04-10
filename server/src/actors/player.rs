//! PlayerActor — 1 GenServer-like actor por jogador.
//!
//! Responsabilidades:
//! 1. Owns `GameState`
//! 2. Tick loop interno 10 Hz via `send_after`
//! 3. Processa intents via mailbox
//! 4. Broadcast snapshots via tokio broadcast channel
//! 5. Random events scheduling
//!
//! **NÃO faz**:
//! - Game rules (delega pro `game::*`)
//! - Persistência (delega pro Storage — future)
//! - WebSocket (delega pro channel — future)

use std::time::Duration;

use ractor::{Actor, ActorProcessingErr, ActorRef};
use rand::SeedableRng;
use rand::rngs::StdRng;
use serde::{Deserialize, Serialize};
use tokio::sync::broadcast;
use tracing::{debug, info, warn};

use crate::game::data::buildings::BuildingId;
use crate::game::formulas::{TICK_DELTA_S, TICK_RATE_HZ};
use crate::game::{
    GameState, achievements, buildings, eras, events, prestige, reborn, resources, upgrades,
};
use crate::ml::MLClient;
use crate::storage::Storage;

/// Intents que o client pode enviar. Viram mensagens do actor.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Intent {
    Click,
    BuyBuilding { id: String },
    BuyUpgrade { id: String },
    BuyPermanent { id: String },
    BuyPerk { id: String },
    Prestige,
    Reborn,
    SetDisplayName { name: String },
}

/// Eventos emitidos pelo actor (pro event log do client).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameEvent {
    pub kind: GameEventKind,
    pub message: String,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum GameEventKind {
    Info,
    Good,
    Warn,
    Crit,
}

/// Snapshot + event stream enviado pro client.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum PlayerBroadcast {
    Snapshot(GameState),
    Event(GameEvent),
}

/// Mensagens internas do actor mailbox.
pub enum PlayerActorMessage {
    /// Intent externo (via WebSocket).
    Intent(Intent),
    /// Tick interno do loop.
    Tick,
    /// Pedir snapshot atual (síncrono — via `call`).
    GetSnapshot(ractor::RpcReplyPort<GameState>),
    /// Subscribe pro stream de broadcasts.
    Subscribe(ractor::RpcReplyPort<broadcast::Receiver<PlayerBroadcast>>),
}

/// State interno do actor (não confundir com `GameState`).
pub struct PlayerActorState {
    pub game: GameState,
    /// Canal de broadcast pros subscribers (PlayerChannel quando conectar).
    pub tx: broadcast::Sender<PlayerBroadcast>,
    /// Ticks desde o último snapshot broadcast.
    pub since_snapshot: u32,
    /// Ticks desde o último save pro Postgres.
    pub since_save: u32,
    /// Tempo acumulado desde o último random event (segundos).
    pub since_event: f64,
    /// Segundos até o próximo random event.
    pub next_event_in: f64,
    /// RNG determinístico (seeded por player_id).
    pub rng: StdRng,
    /// Cliente HTTP pro Python ML service (chamado no Reborn intent).
    pub ml_client: MLClient,
    /// Persistence layer (noop se DATABASE_URL não setada).
    pub storage: Storage,
}

/// Args de spawn do PlayerActor.
#[derive(Clone)]
pub struct PlayerActorArgs {
    pub player_id: String,
    pub ml_client: MLClient,
    pub storage: Storage,
}

/// Atalhos de frequência. Ver `GAME_CONCEPT.md`.
const SNAPSHOT_EVERY: u32 = 3; // ~3 Hz (10/3 ≈ 3.33)
const SAVE_EVERY: u32 = 100; // ~10s autosave no Postgres

pub struct PlayerActor;

impl Actor for PlayerActor {
    type Msg = PlayerActorMessage;
    type State = PlayerActorState;
    type Arguments = PlayerActorArgs;

    async fn pre_start(
        &self,
        myself: ActorRef<Self::Msg>,
        args: PlayerActorArgs,
    ) -> Result<Self::State, ActorProcessingErr> {
        let PlayerActorArgs {
            player_id,
            ml_client,
            storage,
        } = args;
        info!(player_id = %player_id, "PlayerActor pre_start");

        // Try to load existing snapshot from Postgres, fallback to fresh state
        let game = match storage.load_snapshot(&player_id).await {
            Some(loaded) => {
                info!(
                    player_id = %player_id,
                    tick_count = loaded.tick_count,
                    era = ?loaded.era,
                    "loaded snapshot from storage"
                );
                loaded
            }
            None => GameState::new(player_id.clone()),
        };

        // Broadcast channel — até 64 messages buffered por subscriber
        let (tx, _rx) = broadcast::channel(64);

        // RNG seeded pelo player_id pra eventos determinísticos por player
        let seed = player_id
            .bytes()
            .fold(0u64, |acc, b| acc.wrapping_mul(31).wrapping_add(b as u64));
        let mut rng = StdRng::seed_from_u64(seed);
        let next_event_in = initial_event_delay(&mut rng);

        // Agenda o primeiro tick
        let interval = Duration::from_millis(1000 / TICK_RATE_HZ as u64);
        myself.send_after(interval, || PlayerActorMessage::Tick);

        Ok(PlayerActorState {
            game,
            tx,
            since_snapshot: 0,
            since_save: 0,
            since_event: 0.0,
            next_event_in,
            rng,
            ml_client,
            storage,
        })
    }

    async fn handle(
        &self,
        myself: ActorRef<Self::Msg>,
        msg: Self::Msg,
        state: &mut Self::State,
    ) -> Result<(), ActorProcessingErr> {
        match msg {
            PlayerActorMessage::Tick => {
                handle_tick(state);

                // Re-schedule próximo tick
                let interval = Duration::from_millis(1000 / TICK_RATE_HZ as u64);
                myself.send_after(interval, || PlayerActorMessage::Tick);
            }
            PlayerActorMessage::Intent(intent) => {
                handle_intent(state, intent).await;
                // Broadcast snapshot imediato após intent (latência baixa)
                broadcast_snapshot(state);
            }
            PlayerActorMessage::GetSnapshot(reply) => {
                let _ = reply.send(state.game.clone());
            }
            PlayerActorMessage::Subscribe(reply) => {
                let _ = reply.send(state.tx.subscribe());
            }
        }
        Ok(())
    }

    async fn post_stop(
        &self,
        _myself: ActorRef<Self::Msg>,
        state: &mut Self::State,
    ) -> Result<(), ActorProcessingErr> {
        info!(player_id = %state.game.player_id, "PlayerActor stopping — final save");
        state.storage.save_snapshot(&state.game).await;
        Ok(())
    }
}

// ============================================================
// Tick handler — chamado 10 Hz
// ============================================================

fn handle_tick(state: &mut PlayerActorState) {
    let era_discount = reborn::era_discount(&state.game);

    // 1. Core tick: aplica produção aos recursos
    resources::tick(&mut state.game, TICK_DELTA_S);

    // 2. Era advance (a cada ~1s = 10 ticks)
    if state.game.tick_count.is_multiple_of(10)
        && let Some((from, to)) = eras::check_advance(&mut state.game, era_discount)
    {
        let era_def = crate::game::data::eras::get(to);
        emit_event(
            state,
            GameEventKind::Good,
            format!("ERA {}: {} desbloqueada!", to.as_u8(), era_def.title),
        );
        let _ = from;
    }

    // 3. Achievements check (a cada 10 ticks)
    if state.game.tick_count.is_multiple_of(10) {
        let unlocks = achievements::check(&mut state.game);
        for def in unlocks {
            emit_event(
                state,
                GameEventKind::Good,
                format!("🏆 ACHIEVEMENT: {} — {}", def.name, def.description),
            );
        }
    }

    // 4. Random events
    state.since_event += TICK_DELTA_S;
    if state.since_event >= state.next_event_in {
        state.since_event = 0.0;
        state.next_event_in = initial_event_delay(&mut state.rng);

        if let Some((event, effect)) = events::maybe_fire(&mut state.game, &mut state.rng) {
            let kind = match event.kind {
                crate::game::data::events::EventKind::Good => GameEventKind::Good,
                crate::game::data::events::EventKind::Bad => GameEventKind::Warn,
                crate::game::data::events::EventKind::Crit => GameEventKind::Crit,
                crate::game::data::events::EventKind::Neutral => GameEventKind::Info,
            };
            emit_event(state, kind, format!("{} ({})", event.title, effect));
        }
    }

    // 5. Broadcast snapshot a cada SNAPSHOT_EVERY ticks (~3 Hz)
    state.since_snapshot += 1;
    if state.since_snapshot >= SNAPSHOT_EVERY {
        state.since_snapshot = 0;
        broadcast_snapshot(state);
    }

    // 6. Autosave no Postgres a cada SAVE_EVERY ticks (~10s)
    state.since_save += 1;
    if state.since_save >= SAVE_EVERY {
        state.since_save = 0;
        // Fire-and-forget: clona state + storage pro task, não bloqueia o tick
        let storage = state.storage.clone();
        let game = state.game.clone();
        tokio::spawn(async move {
            storage.save_snapshot(&game).await;
        });
    }
}

// ============================================================
// Intent handler
// ============================================================

async fn handle_intent(state: &mut PlayerActorState, intent: Intent) {
    let discount = reborn::building_discount(&state.game);
    match intent {
        Intent::Click => {
            resources::click(&mut state.game);
        }
        Intent::BuyBuilding { id } => {
            if let Some(building_id) = BuildingId::from_str(&id) {
                match buildings::buy(&mut state.game, building_id, discount) {
                    Ok(receipt) => {
                        let def = crate::game::data::buildings::get(building_id);
                        if let Some(def) = def {
                            emit_event(
                                state,
                                GameEventKind::Good,
                                format!("comprou {} (#{})", def.name, receipt.new_owned),
                            );
                        }
                    }
                    Err(e) => {
                        debug!("buy building {id} failed: {e}");
                    }
                }
            } else {
                warn!("unknown building id: {id}");
            }
        }
        Intent::BuyUpgrade { id } => match upgrades::buy(&mut state.game, &id) {
            Ok(def) => {
                emit_event(state, GameEventKind::Good, format!("upgrade: {}", def.name));
            }
            Err(e) => debug!("buy upgrade {id} failed: {e}"),
        },
        Intent::BuyPermanent { id } => {
            if prestige::buy_permanent(&mut state.game, &id).is_ok() {
                emit_event(state, GameEventKind::Good, format!("permanent: {id}"));
            }
        }
        Intent::BuyPerk { id } => {
            if reborn::buy_perk(&mut state.game, &id).is_ok() {
                emit_event(state, GameEventKind::Good, format!("perk: {id}"));
            }
        }
        Intent::Prestige => {
            let points = prestige::prestige(&mut state.game);
            if points > 0 {
                emit_event(
                    state,
                    GameEventKind::Good,
                    format!("NEW PARADIGM: +{points} IP (prestige #{})", state.game.prestige_count),
                );
            }
        }
        Intent::Reborn => {
            if !reborn::can_reborn(&state.game) {
                debug!("reborn refused: conditions not met");
                return;
            }

            // Treina o modelo REAL via Python ML service (killer feature do game).
            // Se offline, fallback: incrementa ml_steps_trained em +3 localmente.
            let player_id = state.game.player_id.clone();
            match state.ml_client.train_and_evaluate(&player_id, 3).await {
                Some((steps, score)) => {
                    state.game.ml_steps_trained = steps;
                    state.game.ml_capability_score = score;
                    info!(
                        player_id = %player_id,
                        ml_steps = steps,
                        "ML train_and_evaluate OK"
                    );
                }
                None => {
                    state.game.ml_steps_trained += 3;
                    warn!(
                        player_id = %player_id,
                        "ML service offline, using fallback +3 steps"
                    );
                }
            }

            let (rp, count) = reborn::reborn(&mut state.game);
            if rp > 0 {
                emit_event(
                    state,
                    GameEventKind::Good,
                    format!(
                        "REBORN #{count}: +{rp} RP (ML steps: {})",
                        state.game.ml_steps_trained
                    ),
                );
            }
        }
        Intent::SetDisplayName { name } => {
            state.game.display_name = name.chars().take(32).collect();
        }
    }
}

// ============================================================
// Helpers
// ============================================================

fn broadcast_snapshot(state: &PlayerActorState) {
    // send só falha se não há subscribers — ok
    let _ = state
        .tx
        .send(PlayerBroadcast::Snapshot(state.game.clone()));
}

fn emit_event(state: &PlayerActorState, kind: GameEventKind, message: String) {
    let _ = state.tx.send(PlayerBroadcast::Event(GameEvent { kind, message }));
}

fn initial_event_delay(rng: &mut StdRng) -> f64 {
    use rand::Rng;
    30.0 + rng.r#gen::<f64>() * 90.0 // 30-120s
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_args(player_id: &str) -> PlayerActorArgs {
        // SAFETY: single-threaded tests
        unsafe {
            std::env::remove_var("DATABASE_URL");
        }
        PlayerActorArgs {
            player_id: player_id.to_string(),
            // URL inválida — ping sempre falha, reborn usa fallback local
            ml_client: MLClient::new("http://127.0.0.1:1"),
            // Noop storage (sem DATABASE_URL)
            storage: Storage::noop(),
        }
    }

    #[tokio::test]
    async fn spawns_and_responds_to_snapshot() {
        let (actor, _handle) =
            Actor::spawn(None, PlayerActor, test_args("test-player"))
                .await
                .expect("spawn");

        // Esperar um tick pra garantir init
        tokio::time::sleep(Duration::from_millis(150)).await;

        let snapshot = ractor::call!(actor, PlayerActorMessage::GetSnapshot).expect("snapshot");
        assert_eq!(snapshot.player_id, "test-player");
        assert_eq!(snapshot.era, crate::game::data::eras::EraId::Hardcoded);

        actor.stop(None);
    }

    #[tokio::test]
    async fn click_intent_adds_tokens() {
        let (actor, _handle) =
            Actor::spawn(None, PlayerActor, test_args("test-player-2"))
                .await
                .expect("spawn");

        tokio::time::sleep(Duration::from_millis(50)).await;

        actor
            .cast(PlayerActorMessage::Intent(Intent::Click))
            .expect("cast");

        tokio::time::sleep(Duration::from_millis(50)).await;

        let snapshot = ractor::call!(actor, PlayerActorMessage::GetSnapshot).expect("snapshot");
        assert!(snapshot.resources.tokens >= 1.0);

        actor.stop(None);
    }

    #[tokio::test]
    async fn subscribe_receives_snapshots() {
        let (actor, _handle) =
            Actor::spawn(None, PlayerActor, test_args("test-player-3"))
                .await
                .expect("spawn");

        let mut rx = ractor::call!(actor, PlayerActorMessage::Subscribe).expect("subscribe");

        // Espera pelo menos 1 snapshot broadcast (acontece a cada 3 ticks = 300ms)
        let received = tokio::time::timeout(Duration::from_secs(2), rx.recv()).await;
        assert!(received.is_ok(), "should receive snapshot within 2s");

        actor.stop(None);
    }
}
