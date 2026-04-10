defmodule LlmTycoonWeb.PlayerChannel do
  @moduledoc """
  Per-player WebSocket channel.

  Cada cliente conecta a `player:<player_id>` e recebe:
  - Updates de leaderboard (Realtime)
  - Eventos globais
  - Resultados de espionagem
  - Respostas do AI chat (Era 6+)

  E envia:
  - Sync de capability_score (a cada 5 min)
  - Ações de espionagem
  - Pedidos de chat
  """

  use LlmTycoonWeb, :channel

  @impl true
  def join("player:" <> player_id, _payload, socket) do
    socket = assign(socket, :player_id, player_id)
    {:ok, %{player_id: player_id, ts: System.system_time(:millisecond)}, socket}
  end

  @impl true
  def handle_in("ping", payload, socket) do
    {:reply, {:ok, payload}, socket}
  end

  # TODO Wave 5: implementar sync, espionage, chat handlers
end
