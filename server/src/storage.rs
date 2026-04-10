//! Storage layer — snapshot persistence via sqlx + Postgres.
//!
//! Design:
//! - `Storage` é um wrapper Clone-able que wrap um `Option<PgPool>`
//! - Se `DATABASE_URL` não estiver setada → storage fica em modo "noop"
//!   (load retorna None, save é drop-into-the-void). Isso permite dev local
//!   100% in-memory sem precisar subir Postgres.
//! - Migrations rodam automaticamente no startup se o pool existir.
//!
//! Schema: ver `migrations/001_player_snapshots.sql`.

use serde_json::Value;
use sqlx::{PgPool, postgres::PgPoolOptions, types::Json};
use tracing::{error, info, warn};

use crate::game::GameState;
use crate::game::buildings;
use crate::game::formulas::capability_score;

/// Persistence abstraction. Cloneable.
#[derive(Clone)]
pub struct Storage {
    pool: Option<PgPool>,
}

impl Storage {
    /// Storage em modo noop (sem Postgres). Útil em testes e dev local.
    pub fn noop() -> Self {
        Self { pool: None }
    }

    /// Conecta no Postgres se `DATABASE_URL` estiver setada. Senão, noop.
    pub async fn from_env() -> Self {
        let Ok(url) = std::env::var("DATABASE_URL") else {
            warn!("DATABASE_URL not set — storage running in noop mode (in-memory only)");
            return Self { pool: None };
        };
        match PgPoolOptions::new()
            .max_connections(10)
            .acquire_timeout(std::time::Duration::from_secs(5))
            .connect(&url)
            .await
        {
            Ok(pool) => {
                info!("connected to Postgres");
                if let Err(e) = sqlx::migrate!("./migrations").run(&pool).await {
                    error!("migration failed: {e}");
                    return Self { pool: None };
                }
                info!("migrations applied");
                Self { pool: Some(pool) }
            }
            Err(e) => {
                error!("Postgres connection failed: {e} — falling back to noop");
                Self { pool: None }
            }
        }
    }

    /// True se há conexão ativa.
    pub fn is_enabled(&self) -> bool {
        self.pool.is_some()
    }

    /// Carrega snapshot do player ou retorna None.
    ///
    /// Erros de deserialização são logados e tratados como "não existe"
    /// (migrations quebradas não devem crashar o actor — ele começa fresh).
    pub async fn load_snapshot(&self, player_id: &str) -> Option<GameState> {
        let pool = self.pool.as_ref()?;
        let row: Option<(Json<Value>,)> =
            sqlx::query_as("SELECT state FROM player_snapshots WHERE player_id = $1")
                .bind(player_id)
                .fetch_optional(pool)
                .await
                .ok()?;
        let (Json(value),) = row?;
        match serde_json::from_value::<GameState>(value) {
            Ok(state) => Some(state),
            Err(e) => {
                warn!(player_id = %player_id, "snapshot deserialize failed: {e}");
                None
            }
        }
    }

    /// Salva snapshot. Upsert via `ON CONFLICT`.
    pub async fn save_snapshot(&self, state: &GameState) {
        let Some(pool) = self.pool.as_ref() else {
            return;
        };

        let state_json = match serde_json::to_value(state) {
            Ok(v) => v,
            Err(e) => {
                error!("failed to serialize GameState: {e}");
                return;
            }
        };

        // Capability score denormalizado (query rápida no leaderboard)
        let cap = capability_score(
            buildings::total_building_value(state),
            state.era.as_u8(),
            state.insight_points,
        );

        let result = sqlx::query(
            r#"
            INSERT INTO player_snapshots
                (player_id, state, display_name, capability_score, era, prestige_count, reborn_count, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, now())
            ON CONFLICT (player_id) DO UPDATE SET
                state = EXCLUDED.state,
                display_name = EXCLUDED.display_name,
                capability_score = EXCLUDED.capability_score,
                era = EXCLUDED.era,
                prestige_count = EXCLUDED.prestige_count,
                reborn_count = EXCLUDED.reborn_count,
                updated_at = now()
            "#,
        )
        .bind(&state.player_id)
        .bind(Json(&state_json))
        .bind(&state.display_name)
        .bind(cap as i64)
        .bind(state.era.as_u8() as i32)
        .bind(state.prestige_count as i32)
        .bind(state.reborn_count as i32)
        .execute(pool)
        .await;

        if let Err(e) = result {
            error!(player_id = %state.player_id, "save_snapshot failed: {e}");
        }
    }

    /// Top N players por capability score. Usado pelo Leaderboard actor.
    pub async fn top_players(&self, limit: i64) -> Vec<LeaderboardRow> {
        let Some(pool) = self.pool.as_ref() else {
            return Vec::new();
        };
        let rows: Result<Vec<LeaderboardRow>, _> = sqlx::query_as(
            r#"
            SELECT player_id, display_name, capability_score, era, prestige_count, reborn_count
            FROM player_snapshots
            ORDER BY capability_score DESC
            LIMIT $1
            "#,
        )
        .bind(limit)
        .fetch_all(pool)
        .await;
        rows.unwrap_or_default()
    }
}

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct LeaderboardRow {
    pub player_id: String,
    pub display_name: String,
    pub capability_score: i64,
    pub era: i32,
    pub prestige_count: i32,
    pub reborn_count: i32,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn noop_mode_when_no_env() {
        // SAFETY: single-threaded test
        unsafe {
            std::env::remove_var("DATABASE_URL");
        }
        let storage = Storage::from_env().await;
        assert!(!storage.is_enabled());

        // load_snapshot returns None
        assert!(storage.load_snapshot("any").await.is_none());

        // save_snapshot is a no-op (doesn't panic)
        let state = GameState::new("test".into());
        storage.save_snapshot(&state).await;

        // top_players returns empty
        assert!(storage.top_players(10).await.is_empty());
    }
}
