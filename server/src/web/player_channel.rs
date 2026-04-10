//! PlayerChannel — WebSocket entrypoint per player.
//!
//! Client conecta em `ws://host/socket?player_id=<uuid>`:
//! 1. Handler extrai o `player_id` do query string
//! 2. Garante que existe um `PlayerActor` pro id (`ensure_started`)
//! 3. Subscribe no broadcast channel do actor
//! 4. Splita o WS em (sink, stream)
//!    - stream (reads): parse como `Intent` JSON → `actor.cast(Intent)`
//!    - sink (writes): loop do broadcast receiver → `ws.send(json)`

use axum::{
    extract::{
        Query, State, WebSocketUpgrade,
        ws::{CloseFrame, Message, WebSocket, close_code},
    },
    response::IntoResponse,
};
use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use tokio::sync::broadcast;
use tracing::{debug, error, info, warn};

use crate::actors::player::{Intent, PlayerActorMessage, PlayerBroadcast};
use crate::web::router::AppState;

#[derive(Debug, Deserialize)]
pub struct ConnectParams {
    player_id: String,
}

pub async fn upgrade(
    ws: WebSocketUpgrade,
    Query(params): Query<ConnectParams>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    info!(player_id = %params.player_id, "WebSocket upgrade");
    ws.on_upgrade(move |socket| handle_socket(socket, params.player_id, state))
}

async fn handle_socket(socket: WebSocket, player_id: String, state: AppState) {
    // 1. Ensure PlayerActor existe
    let actor = match state.registry.ensure_started(player_id.clone()).await {
        Ok(a) => a,
        Err(e) => {
            error!("failed to ensure PlayerActor: {e}");
            return;
        }
    };

    // 2. Subscribe no broadcast
    let subscription: Result<broadcast::Receiver<PlayerBroadcast>, _> =
        ractor::call!(actor, PlayerActorMessage::Subscribe);
    let mut rx = match subscription {
        Ok(rx) => rx,
        Err(e) => {
            error!("subscribe failed: {e}");
            return;
        }
    };

    // 3. Push snapshot inicial
    let initial: Result<crate::game::GameState, _> = ractor::call!(actor, PlayerActorMessage::GetSnapshot);
    let (mut sink, mut stream) = socket.split();
    if let Ok(snapshot) = initial {
        let msg = PlayerBroadcast::Snapshot(snapshot);
        if let Ok(json) = serde_json::to_string(&msg)
            && sink.send(Message::Text(json.into())).await.is_err()
        {
            return;
        }
    }

    // 4. Loop — tasks paralelas pra read/write
    let actor_clone = actor.clone();
    let mut send_task = tokio::spawn(async move {
        while let Ok(broadcast_msg) = rx.recv().await {
            let json = match serde_json::to_string(&broadcast_msg) {
                Ok(j) => j,
                Err(_) => continue,
            };
            if sink.send(Message::Text(json.into())).await.is_err() {
                break;
            }
        }
        let _ = sink
            .send(Message::Close(Some(CloseFrame {
                code: close_code::NORMAL,
                reason: "broadcast channel closed".into(),
            })))
            .await;
    });

    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = stream.next().await {
            match msg {
                Message::Text(text) => match serde_json::from_str::<Intent>(&text) {
                    Ok(intent) => {
                        if let Err(e) = actor_clone.cast(PlayerActorMessage::Intent(intent)) {
                            error!("cast intent failed: {e}");
                            break;
                        }
                    }
                    Err(e) => {
                        debug!("bad intent json: {e} — payload: {text}");
                    }
                },
                Message::Close(_) => break,
                Message::Ping(_) | Message::Pong(_) => {}
                Message::Binary(_) => warn!("binary frames not supported"),
            }
        }
    });

    // Espera qualquer uma terminar pra fechar a outra
    tokio::select! {
        _ = &mut send_task => recv_task.abort(),
        _ = &mut recv_task => send_task.abort(),
    }

    info!(player_id = %player_id, "WebSocket closed");
}
