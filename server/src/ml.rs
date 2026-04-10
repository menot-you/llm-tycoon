//! MLClient — HTTP client pro Python FastAPI service.
//!
//! O Python service (`ml/`) expõe:
//! - `GET  /health`    — ping
//! - `POST /train/`    — 1 SGD step real, retorna loss + steps_trained
//! - `POST /generate/` — inference real, retorna texto gerado
//! - `POST /evaluate/` — benchmark no corpus, retorna capability_score
//! - `POST /chat/`     — Claude API (era 6+)
//!
//! Este client é chamado pelo PlayerActor no handle_intent(Reborn) pra
//! treinar o modelo real + avaliar antes de aplicar o reset.
#![allow(dead_code)]

use reqwest::Client;
use serde::{Deserialize, Serialize};
use tracing::{debug, warn};

const DEFAULT_TIMEOUT_MS: u64 = 5000;

#[derive(Debug, Clone)]
pub struct MLClient {
    base_url: String,
    http: Client,
}

#[derive(Debug, Serialize)]
struct TrainRequest<'a> {
    player_id: &'a str,
    batch_size: u32,
    seq_len: u32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct TrainResult {
    pub loss: f64,
    pub perplexity: f64,
    pub steps_trained: u32,
    pub param_count: u64,
}

#[derive(Debug, Serialize)]
struct EvaluateRequest<'a> {
    player_id: &'a str,
}

#[derive(Debug, Clone, Deserialize)]
pub struct EvaluateResult {
    pub eval_loss: f64,
    pub perplexity: f64,
    pub capability_score: u64,
    pub steps_trained: u32,
}

#[derive(Debug, Serialize)]
struct ChatRequest<'a> {
    player_id: &'a str,
    era: u8,
    last_action: &'a str,
    capability_score: u64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ChatResult {
    pub text: String,
    pub era: u8,
}

impl MLClient {
    /// Constrói com o endpoint do env ou fallback pra localhost dev.
    pub fn from_env() -> Self {
        let base_url = std::env::var("ML_SERVICE_URL")
            .unwrap_or_else(|_| "http://localhost:8000".to_string());
        let http = Client::builder()
            .timeout(std::time::Duration::from_millis(DEFAULT_TIMEOUT_MS))
            .build()
            .expect("failed to build reqwest client");
        Self { base_url, http }
    }

    pub fn new(base_url: impl Into<String>) -> Self {
        let http = Client::builder()
            .timeout(std::time::Duration::from_millis(DEFAULT_TIMEOUT_MS))
            .build()
            .expect("failed to build reqwest client");
        Self {
            base_url: base_url.into(),
            http,
        }
    }

    /// Pinga `/health`. Retorna `true` se 200 OK.
    pub async fn ping(&self) -> bool {
        let url = format!("{}/health", self.base_url);
        match self.http.get(&url).send().await {
            Ok(res) => res.status().is_success(),
            Err(e) => {
                debug!("ML ping failed: {e}");
                false
            }
        }
    }

    /// Treina 1 step. `batch_size` e `seq_len` default: 8, 32 (match frontend v1).
    pub async fn train(&self, player_id: &str) -> Option<TrainResult> {
        let url = format!("{}/train/", self.base_url);
        let body = TrainRequest {
            player_id,
            batch_size: 8,
            seq_len: 32,
        };
        match self.http.post(&url).json(&body).send().await {
            Ok(res) if res.status().is_success() => res.json().await.ok(),
            Ok(res) => {
                warn!("ML train non-success: {}", res.status());
                None
            }
            Err(e) => {
                warn!("ML train error: {e}");
                None
            }
        }
    }

    /// Avalia. Retorna `capability_score` real (inverso da eval_loss × steps).
    pub async fn evaluate(&self, player_id: &str) -> Option<EvaluateResult> {
        let url = format!("{}/evaluate/", self.base_url);
        let body = EvaluateRequest { player_id };
        match self.http.post(&url).json(&body).send().await {
            Ok(res) if res.status().is_success() => res.json().await.ok(),
            Ok(res) => {
                warn!("ML evaluate non-success: {}", res.status());
                None
            }
            Err(e) => {
                warn!("ML evaluate error: {e}");
                None
            }
        }
    }

    /// Treina N steps + avalia. Usado no reborn intent.
    ///
    /// Retorna `(steps_trained, capability_score)` do evaluate final.
    /// Se o ping falhar ou qualquer request falhar, retorna `None` — o caller
    /// deve fazer fallback local (incrementar ml_steps_trained em +N).
    pub async fn train_and_evaluate(
        &self,
        player_id: &str,
        train_steps: u32,
    ) -> Option<(u32, u64)> {
        if !self.ping().await {
            debug!("ML service offline, skipping train_and_evaluate");
            return None;
        }
        for _ in 0..train_steps {
            self.train(player_id).await?;
        }
        let ev = self.evaluate(player_id).await?;
        Some((ev.steps_trained, ev.capability_score))
    }

    /// Chat dinâmico (era 6+). Fallback se ANTHROPIC_API_KEY não configurada.
    pub async fn chat(
        &self,
        player_id: &str,
        era: u8,
        last_action: &str,
        capability_score: u64,
    ) -> Option<ChatResult> {
        let url = format!("{}/chat/", self.base_url);
        let body = ChatRequest {
            player_id,
            era,
            last_action,
            capability_score,
        };
        match self.http.post(&url).json(&body).send().await {
            Ok(res) if res.status().is_success() => res.json().await.ok(),
            Ok(res) => {
                warn!("ML chat non-success: {}", res.status());
                None
            }
            Err(e) => {
                warn!("ML chat error: {e}");
                None
            }
        }
    }
}

impl Default for MLClient {
    fn default() -> Self {
        Self::from_env()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Testes de unit puros (sem I/O) — validam apenas construção.
    #[test]
    fn from_env_builds_with_default() {
        // SAFETY: single-threaded test env
        unsafe {
            std::env::remove_var("ML_SERVICE_URL");
        }
        let client = MLClient::from_env();
        assert_eq!(client.base_url, "http://localhost:8000");
    }

    #[test]
    fn from_env_respects_override() {
        // SAFETY: single-threaded test env
        unsafe {
            std::env::set_var("ML_SERVICE_URL", "http://ml.example:9999");
        }
        let client = MLClient::from_env();
        assert_eq!(client.base_url, "http://ml.example:9999");
        unsafe {
            std::env::remove_var("ML_SERVICE_URL");
        }
    }

    #[test]
    fn new_builds_with_explicit_url() {
        let client = MLClient::new("http://example");
        assert_eq!(client.base_url, "http://example");
    }
}
