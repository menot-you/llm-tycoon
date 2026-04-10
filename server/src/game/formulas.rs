//! Fórmulas canônicas do jogo. Centralizadas pra facilitar balancing.
//!
//! **Todas as constantes bate com `GAME_CONCEPT.md`**. Nenhuma mudança aqui
//! sem atualizar o concept doc.

// ============================================================
// ENGINE TIMING
// ============================================================

/// Ticks por segundo no server (fixed timestep).
pub const TICK_RATE_HZ: u32 = 10;
/// Delta entre ticks em segundos.
pub const TICK_DELTA_S: f64 = 1.0 / TICK_RATE_HZ as f64;

// ============================================================
// OFFLINE PROGRESS
// ============================================================

pub const OFFLINE_MAX_HOURS: u64 = 24;
pub const OFFLINE_BASE_EFFICIENCY: f64 = 0.5;
pub const OFFLINE_MAX_EFFICIENCY: f64 = 0.8;

// ============================================================
// RESOURCES
// ============================================================

/// 5% por minuto em decay, convertido pra por-segundo.
pub const HYPE_DECAY_PER_SECOND: f64 = 0.05 / 60.0;
/// 0.1% da produção total por segundo vira alucinação.
pub const HALLUCINATION_GROWTH_RATE: f64 = 0.001;
/// Quanto a alucinação drena da produção de tokens (escala linear).
pub const HALLUCINATION_DRAIN_FACTOR: f64 = 0.1;

pub const ALIGNMENT_CRISIS_THRESHOLD: f64 = 0.5;
pub const MODEL_ROGUE_THRESHOLD: f64 = 0.8;

// ============================================================
// BUILDING COST GROWTH
// ============================================================

pub const COST_GROWTH_CHEAP: f64 = 1.15;
pub const COST_GROWTH_MID: f64 = 1.22;
pub const COST_GROWTH_TOP: f64 = 1.30;

// ============================================================
// PRESTIGE
// ============================================================

/// Divisor pra calcular IP: `IP = floor(log2(total_tokens / divisor))`.
pub const PRESTIGE_FORMULA_DIVISOR: f64 = 1_000_000.0;
/// Bônus de 5% por Insight Point.
pub const PRESTIGE_BONUS_PER_POINT: f64 = 0.05;

// ============================================================
// PVP
// ============================================================

pub const ESPIONAGE_COOLDOWN_MS: i64 = 15 * 60 * 1000;
pub const LEADERBOARD_SIZE: usize = 100;

// ============================================================
// Pure math functions
// ============================================================

/// Custo do próximo building: `base * growth^owned`.
pub fn building_cost(base_cost: f64, growth: f64, owned: u32) -> f64 {
    (base_cost * growth.powi(owned as i32)).floor()
}

/// Custo bulk de comprar `bulk` buildings a partir de `owned`.
///
/// Usa soma geométrica: `base × (g^(owned+bulk) − g^owned) / (g − 1)`.
pub fn building_bulk_cost(base_cost: f64, growth: f64, owned: u32, bulk: u32) -> f64 {
    if bulk == 0 {
        return 0.0;
    }
    if (growth - 1.0).abs() < f64::EPSILON {
        return (base_cost * bulk as f64).floor();
    }
    let factor = (growth.powi((owned + bulk) as i32) - growth.powi(owned as i32)) / (growth - 1.0);
    (base_cost * factor).floor()
}

/// Produção base: `base * owned`.
pub fn building_production(base_production: f64, owned: u32) -> f64 {
    base_production * owned as f64
}

/// Insight Points ganhos num prestige.
///
/// `IP = floor(log2(total / 1M))`, mínimo 0.
pub fn insight_points_from_prestige(total_tokens_earned: f64) -> u32 {
    if total_tokens_earned < PRESTIGE_FORMULA_DIVISOR {
        return 0;
    }
    let ratio = total_tokens_earned / PRESTIGE_FORMULA_DIVISOR;
    ratio.log2().floor().max(0.0) as u32
}

/// Multiplicador de prestige: `1 + IP × 0.05`.
pub fn prestige_multiplier(insight_points: u32) -> f64 {
    1.0 + insight_points as f64 * PRESTIGE_BONUS_PER_POINT
}

/// Produção offline: `offline_s × efficiency × rate_per_s`.
pub fn offline_production(offline_seconds: f64, efficiency: f64, rate_per_s: f64) -> f64 {
    (offline_seconds * efficiency * rate_per_s).floor()
}

/// Capability score pra ranking PvP.
pub fn capability_score(total_building_value: f64, era: u8, insight_points: u32) -> u64 {
    (total_building_value * era as f64 * prestige_multiplier(insight_points)).floor() as u64
}

#[cfg(test)]
mod tests {
    use super::*;

    // ============================================================
    // building_cost
    // ============================================================

    #[test]
    fn building_cost_returns_base_when_owned_zero() {
        assert_eq!(building_cost(100.0, 1.15, 0), 100.0);
    }

    #[test]
    fn building_cost_applies_exponential_growth() {
        // 100 × 1.15^10 ≈ 404.55 → floor 404
        assert_eq!(building_cost(100.0, 1.15, 10), 404.0);
    }

    #[test]
    fn ifelse_bot_progression_matches_spec() {
        // base=15, growth=1.15 — canonical sequence from GAME_CONCEPT.md
        assert_eq!(building_cost(15.0, 1.15, 0), 15.0);
        assert_eq!(building_cost(15.0, 1.15, 1), 17.0);
        assert_eq!(building_cost(15.0, 1.15, 2), 19.0);
        assert_eq!(building_cost(15.0, 1.15, 3), 22.0);
        assert_eq!(building_cost(15.0, 1.15, 4), 26.0);
    }

    #[test]
    fn building_cost_handles_very_large_owned() {
        let cost = building_cost(1e10, 1.3, 100);
        assert!(cost > 0.0);
        assert!(cost.is_finite());
    }

    // ============================================================
    // building_bulk_cost
    // ============================================================

    #[test]
    fn bulk_cost_zero_returns_zero() {
        assert_eq!(building_bulk_cost(100.0, 1.15, 0, 0), 0.0);
    }

    #[test]
    fn bulk_cost_approx_matches_sum() {
        let sum = building_cost(100.0, 1.15, 0)
            + building_cost(100.0, 1.15, 1)
            + building_cost(100.0, 1.15, 2);
        let bulk = building_bulk_cost(100.0, 1.15, 0, 3);
        // Divergence < 5% tolerado por diferenças de floor
        let diff = (bulk - sum).abs() / sum;
        assert!(diff < 0.05, "bulk {bulk} vs sum {sum} diverged {diff}");
    }

    #[test]
    fn bulk_cost_linear_when_growth_one() {
        assert_eq!(building_bulk_cost(50.0, 1.0, 10, 5), 250.0);
    }

    // ============================================================
    // building_production
    // ============================================================

    #[test]
    fn production_scales_linearly() {
        assert!((building_production(0.1, 10) - 1.0).abs() < 1e-9);
        assert_eq!(building_production(260.0, 5), 1300.0);
    }

    #[test]
    fn production_zero_owned() {
        assert_eq!(building_production(100.0, 0), 0.0);
    }

    // ============================================================
    // insight_points_from_prestige
    // ============================================================

    #[test]
    fn ip_zero_below_threshold() {
        assert_eq!(insight_points_from_prestige(500_000.0), 0);
        assert_eq!(insight_points_from_prestige(999_999.0), 0);
    }

    #[test]
    fn ip_zero_exactly_at_1m() {
        // log2(1) = 0
        assert_eq!(insight_points_from_prestige(1_000_000.0), 0);
    }

    #[test]
    fn ip_scales_logarithmically() {
        assert_eq!(insight_points_from_prestige(2_000_000.0), 1); // log2(2)
        assert_eq!(insight_points_from_prestige(4_000_000.0), 2); // log2(4)
        assert_eq!(insight_points_from_prestige(1_024_000_000.0), 10); // log2(1024)
    }

    // ============================================================
    // prestige_multiplier
    // ============================================================

    #[test]
    fn prestige_mult_base_is_one() {
        assert!((prestige_multiplier(0) - 1.0).abs() < 1e-9);
    }

    #[test]
    fn prestige_mult_stacks_by_5_percent() {
        assert!((prestige_multiplier(10) - 1.5).abs() < 1e-9);
        assert!((prestige_multiplier(20) - 2.0).abs() < 1e-9);
    }

    // ============================================================
    // offline_production
    // ============================================================

    #[test]
    fn offline_computes_with_efficiency() {
        // 1h × 50% × 10/s = 18000
        assert_eq!(offline_production(3600.0, 0.5, 10.0), 18000.0);
    }

    #[test]
    fn offline_respects_max_efficiency() {
        assert_eq!(offline_production(3600.0, 0.8, 10.0), 28800.0);
    }

    #[test]
    fn offline_zero_seconds() {
        assert_eq!(offline_production(0.0, 0.5, 100.0), 0.0);
    }

    // ============================================================
    // capability_score
    // ============================================================

    #[test]
    fn capability_scales_with_era_and_prestige() {
        // 1000 buildings × era 5 × mult 1 = 5000
        assert_eq!(capability_score(1000.0, 5, 0), 5000);
        // 1000 × 5 × 1.5 = 7500
        assert_eq!(capability_score(1000.0, 5, 10), 7500);
    }
}
