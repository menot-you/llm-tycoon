/**
 * MLClient — HTTP client pro Python FastAPI ML service.
 *
 * Usa fetch pra chamar /train, /evaluate e /chat do nano-transformer real.
 * Fallback gracioso se o service não tá rodando.
 */

const DEFAULT_BASE = 'http://localhost:8000';

export interface TrainResult {
  loss: number;
  perplexity: number;
  steps_trained: number;
  param_count: number;
}

export interface EvaluateResult {
  eval_loss: number;
  perplexity: number;
  capability_score: number;
  steps_trained: number;
}

export interface ChatResult {
  text: string;
  era: number;
}

export class MLClient {
  private base: string;
  private available = false;
  private checked = false;

  constructor(base = DEFAULT_BASE) {
    this.base = base;
  }

  async ping(): Promise<boolean> {
    if (this.checked) return this.available;
    try {
      const res = await fetch(`${this.base}/health`, { signal: AbortSignal.timeout(1500) });
      this.available = res.ok;
    } catch {
      this.available = false;
    }
    this.checked = true;
    return this.available;
  }

  async train(playerId: string): Promise<TrainResult | null> {
    if (!(await this.ping())) return null;
    try {
      const res = await fetch(`${this.base}/train/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId, batch_size: 8, seq_len: 32 }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      return (await res.json()) as TrainResult;
    } catch {
      return null;
    }
  }

  async evaluate(playerId: string): Promise<EvaluateResult | null> {
    if (!(await this.ping())) return null;
    try {
      const res = await fetch(`${this.base}/evaluate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      return (await res.json()) as EvaluateResult;
    } catch {
      return null;
    }
  }

  async chat(
    playerId: string,
    era: number,
    lastAction: string,
    capabilityScore: number
  ): Promise<ChatResult | null> {
    if (!(await this.ping())) return null;
    try {
      const res = await fetch(`${this.base}/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: playerId,
          era,
          last_action: lastAction,
          capability_score: capabilityScore,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) return null;
      return (await res.json()) as ChatResult;
    } catch {
      return null;
    }
  }

  isAvailable(): boolean {
    return this.available;
  }
}
