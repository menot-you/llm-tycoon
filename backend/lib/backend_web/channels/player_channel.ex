defmodule BackendWeb.PlayerChannel do
  @moduledoc """
  Per-player WebSocket channel.

  Eventos do cliente:
  - "sync"      -> atualiza capability_score no Leaderboard
  - "espionage" -> tenta executar ação contra outro player
  - "ping"      -> health check

  Eventos broadcast do server:
  - "leaderboard_update" -> novo top 20 (a cada 5s via Leaderboard GenServer)
  """

  use BackendWeb, :channel

  alias Backend.{Leaderboard, Espionage}

  @impl true
  def join("player:" <> player_id, _payload, socket) do
    # Subscribe pro broadcast global
    Phoenix.PubSub.subscribe(Backend.PubSub, "leaderboard:global")

    socket = assign(socket, :player_id, player_id)

    send(self(), :after_join)

    {:ok, %{player_id: player_id, ts: System.system_time(:millisecond)}, socket}
  end

  @impl true
  def handle_info(:after_join, socket) do
    # Manda leaderboard inicial pra esse client
    push(socket, "leaderboard_update", %{top: Leaderboard.top(20)})
    {:noreply, socket}
  end

  @impl true
  def handle_info({:leaderboard_update, top}, socket) do
    push(socket, "leaderboard_update", %{top: top})
    {:noreply, socket}
  end

  @impl true
  def handle_in("ping", payload, socket) do
    {:reply, {:ok, payload}, socket}
  end

  @impl true
  def handle_in("sync", payload, socket) do
    player_id = socket.assigns.player_id
    Leaderboard.upsert(player_id, payload)
    {:reply, {:ok, %{status: "synced"}}, socket}
  end

  @impl true
  def handle_in("espionage", %{"target" => target_id, "action" => action}, socket) do
    player_id = socket.assigns.player_id

    case Espionage.execute(player_id, target_id, action) do
      {:ok, result} -> {:reply, {:ok, result}, socket}
      {:error, reason} -> {:reply, {:error, %{reason: Atom.to_string(reason)}}, socket}
    end
  end
end
