//! PlayerActor registry — lookup + supervision.
//!
//! Cada `player_id` mapeia pra um `ActorRef<PlayerActorMessage>`. Spawn
//! idempotente: se já existe, retorna o ref existente. Actor supervisionado
//! pela runtime do ractor (restart em crash).

use std::collections::HashMap;
use std::sync::Arc;

use ractor::{Actor, ActorRef};
use tokio::sync::RwLock;
use tracing::info;

use super::player::{PlayerActor, PlayerActorArgs, PlayerActorMessage};
use crate::ml::MLClient;
use crate::storage::Storage;

/// Registry global. Cloneable (Arc interno).
#[derive(Clone)]
pub struct PlayerRegistry {
    inner: Arc<RwLock<HashMap<String, ActorRef<PlayerActorMessage>>>>,
    ml_client: MLClient,
    storage: Storage,
}

impl PlayerRegistry {
    pub fn new(ml_client: MLClient, storage: Storage) -> Self {
        Self {
            inner: Arc::new(RwLock::new(HashMap::new())),
            ml_client,
            storage,
        }
    }

    /// Retorna o ActorRef se já existe.
    pub async fn get(&self, player_id: &str) -> Option<ActorRef<PlayerActorMessage>> {
        self.inner.read().await.get(player_id).cloned()
    }

    /// Spawn idempotente: garante que existe um PlayerActor pro player_id.
    pub async fn ensure_started(
        &self,
        player_id: String,
    ) -> anyhow::Result<ActorRef<PlayerActorMessage>> {
        if let Some(existing) = self.get(&player_id).await {
            return Ok(existing);
        }

        // Spawn novo actor
        let args = PlayerActorArgs {
            player_id: player_id.clone(),
            ml_client: self.ml_client.clone(),
            storage: self.storage.clone(),
        };
        let (actor_ref, _handle) = Actor::spawn(Some(player_id.clone()), PlayerActor, args)
            .await
            .map_err(|e| anyhow::anyhow!("failed to spawn PlayerActor: {e}"))?;

        info!(player_id = %player_id, "spawned PlayerActor");
        self.inner
            .write()
            .await
            .insert(player_id, actor_ref.clone());
        Ok(actor_ref)
    }

    /// Remove do registry (quando o actor termina).
    pub async fn unregister(&self, player_id: &str) {
        self.inner.write().await.remove(player_id);
    }

    /// Lista todos os player_ids ativos.
    pub async fn all_ids(&self) -> Vec<String> {
        self.inner.read().await.keys().cloned().collect()
    }

    /// Total de actors vivos.
    pub async fn count(&self) -> usize {
        self.inner.read().await.len()
    }
}
