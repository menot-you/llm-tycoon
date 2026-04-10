/**
 * LLM Tycoon — Game Balancing Constants
 *
 * Todas as constantes de balancing ficam aqui para facilitar ajustes.
 * Nunca hardcode números no engine — referencia sempre este arquivo.
 */

// ============================================================
// ENGINE TIMING
// ============================================================

/** Game ticks por segundo (fixed timestep) */
export const TICK_RATE = 20;

/** Delta entre ticks em segundos */
export const TICK_DELTA = 1 / TICK_RATE;

/** UI updates (snapshots) por segundo pro Preact */
export const UI_UPDATE_RATE = 4;

/** Canvas renders por segundo (alvo) */
export const RENDER_FPS = 60;

/** Auto-save interval (ms) */
export const AUTO_SAVE_INTERVAL_MS = 30_000;

// ============================================================
// OFFLINE PROGRESS
// ============================================================

/** Máximo de horas de offline progress acumulado */
export const OFFLINE_MAX_HOURS = 24;

/** Eficiência base offline (50%) */
export const OFFLINE_BASE_EFFICIENCY = 0.5;

/** Eficiência máxima com prestige upgrades (80%) */
export const OFFLINE_MAX_EFFICIENCY = 0.8;

// ============================================================
// RESOURCES
// ============================================================

/** Hype decay rate — 5% por minuto, convertido pra por-segundo */
export const HYPE_DECAY_PER_SECOND = 0.05 / 60;

/** Alucinações crescem a 0.1% da produção total por tick */
export const HALLUCINATION_GROWTH_RATE = 0.001;

/** Quanto a alucinação drena da produção de tokens */
export const HALLUCINATION_DRAIN_FACTOR = 0.1;

/** Threshold de crise de alignment (50% hallucination rate) */
export const ALIGNMENT_CRISIS_THRESHOLD = 0.5;

/** Threshold de "modelo rogue" (80% hallucination rate) */
export const MODEL_ROGUE_THRESHOLD = 0.8;

// ============================================================
// BUILDING COST GROWTH
// ============================================================

/** Growth rate para buildings baratos (early game) */
export const COST_GROWTH_CHEAP = 1.15;

/** Growth rate para buildings mid */
export const COST_GROWTH_MID = 1.22;

/** Growth rate para buildings top-tier */
export const COST_GROWTH_TOP = 1.3;

/** Growth rate para staff/upgrades premium */
export const COST_GROWTH_STAFF = 1.25;

// ============================================================
// PRESTIGE
// ============================================================

/** Divisor pra calcular Insight Points: log2(total_tokens / divisor) */
export const PRESTIGE_FORMULA_DIVISOR = 1e6;

/** Bonus por Insight Point (5% de produção) */
export const PRESTIGE_BONUS_PER_POINT = 0.05;

// ============================================================
// PVP
// ============================================================

/** Cooldown de espionagem em ms (15 min) */
export const ESPIONAGE_COOLDOWN_MS = 15 * 60_000;

/** Máximo de ações ofensivas por dia contra o mesmo alvo */
export const MAX_DAILY_ACTIONS_PER_TARGET = 3;

/** Leaderboard refresh rate (ms) */
export const LEADERBOARD_REFRESH_MS = 60_000;

/** Tamanho do leaderboard exibido */
export const LEADERBOARD_SIZE = 100;

/** Intervalo de sync do player pro backend (ms) */
export const BACKEND_SYNC_INTERVAL_MS = 5 * 60_000;

// ============================================================
// RENDERING — ASCII CANVAS
// ============================================================

/** Largura do grid ASCII em colunas (default) */
export const GRID_COLS = 120;

/** Altura do grid ASCII em linhas (default) */
export const GRID_ROWS = 40;

/** Font family monospace */
export const MONOSPACE_FONT = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

/** Font size base em px */
export const FONT_SIZE = 14;

/** Line height multiplier */
export const LINE_HEIGHT = 1.2;
