-- LLM Tycoon — Schema inicial
-- Persiste apenas dados relevantes pra PvP. Single-player é localStorage only.

-- ============================================================
-- PLAYERS
-- ============================================================

CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL DEFAULT 'Anonymous Founder',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- PvP stats (sync do client a cada 5 min)
    capability_score BIGINT NOT NULL DEFAULT 0,
    era INTEGER NOT NULL DEFAULT 1 CHECK (era BETWEEN 1 AND 8),
    prestige_count INTEGER NOT NULL DEFAULT 0,
    market_share REAL NOT NULL DEFAULT 0.0,

    -- Modelo ML persistido (path no filesystem do ML service)
    model_weights_path TEXT,
    model_training_loss REAL,

    -- Anti-abuse
    last_sync_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    flagged BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_players_capability ON players (capability_score DESC);
CREATE INDEX idx_players_market_share ON players (market_share DESC);
CREATE INDEX idx_players_updated ON players (updated_at DESC);

-- ============================================================
-- ESPIONAGE ACTIONS
-- ============================================================

CREATE TABLE espionage_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attacker_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (
        action_type IN ('steal_data', 'sabotage_compute', 'plant_hallucinations', 'poach_staff', 'leak_weights', 'fud_campaign')
    ),
    executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    success BOOLEAN NOT NULL,
    value_stolen BIGINT DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_espionage_attacker ON espionage_actions (attacker_id, action_type, executed_at DESC);
CREATE INDEX idx_espionage_target ON espionage_actions (target_id, executed_at DESC);

-- ============================================================
-- GLOBAL EVENTS (server-wide)
-- ============================================================

CREATE TABLE global_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    effect JSONB NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_active ON global_events (starts_at, ends_at);

-- ============================================================
-- MARKET SNAPSHOTS
-- ============================================================

CREATE TABLE market_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    total_capability BIGINT NOT NULL,
    top_players JSONB NOT NULL
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE espionage_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_events ENABLE ROW LEVEL SECURITY;

-- Leaderboard público
CREATE POLICY "Players são visíveis por todos"
    ON players FOR SELECT USING (true);

CREATE POLICY "Players editam apenas o próprio record"
    ON players FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Players inserem apenas o próprio record"
    ON players FOR INSERT WITH CHECK (auth.uid() = id);

-- Espionagem: visível pros envolvidos, criada pelo atacante
CREATE POLICY "Espionagem visível para atacante e alvo"
    ON espionage_actions FOR SELECT
    USING (attacker_id = auth.uid() OR target_id = auth.uid());

CREATE POLICY "Players criam suas próprias ações de espionagem"
    ON espionage_actions FOR INSERT
    WITH CHECK (attacker_id = auth.uid());

-- Eventos globais são públicos
CREATE POLICY "Eventos globais públicos"
    ON global_events FOR SELECT USING (true);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Verifica cooldown de espionagem (15 min por ação)
CREATE OR REPLACE FUNCTION check_espionage_cooldown(
    p_attacker_id UUID,
    p_action_type TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM espionage_actions
        WHERE attacker_id = p_attacker_id
        AND action_type = p_action_type
        AND executed_at > now() - INTERVAL '15 minutes'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recalcula market shares (chamada via Edge Function/cron)
CREATE OR REPLACE FUNCTION recalculate_market_shares() RETURNS void AS $$
DECLARE
    v_total BIGINT;
BEGIN
    SELECT COALESCE(SUM(capability_score), 1) INTO v_total
    FROM players WHERE capability_score > 0 AND NOT flagged;

    UPDATE players
    SET market_share = CASE
        WHEN v_total > 0 THEN (capability_score::REAL / v_total::REAL) * 100.0
        ELSE 0.0
    END,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: updated_at automático
CREATE OR REPLACE FUNCTION trigger_set_timestamp() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_players_timestamp
BEFORE UPDATE ON players
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
