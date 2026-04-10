-- LLM Tycoon — initial schema.
--
-- Tabela única: player_snapshots. Cada player tem 1 row, atualizada ~10s.
-- O state completo fica num JSONB pra evolução flexível de schema.

CREATE TABLE IF NOT EXISTS player_snapshots (
    player_id         TEXT PRIMARY KEY,
    state             JSONB NOT NULL,
    -- Campos denormalizados pra query rápida do leaderboard
    display_name      TEXT NOT NULL DEFAULT 'Anonymous Founder',
    capability_score  BIGINT NOT NULL DEFAULT 0,
    era               INTEGER NOT NULL DEFAULT 1,
    prestige_count    INTEGER NOT NULL DEFAULT 0,
    reborn_count      INTEGER NOT NULL DEFAULT 0,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_player_snapshots_capability
    ON player_snapshots (capability_score DESC);

CREATE INDEX IF NOT EXISTS idx_player_snapshots_updated
    ON player_snapshots (updated_at DESC);
