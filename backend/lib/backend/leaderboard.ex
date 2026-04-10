defmodule Backend.Leaderboard do
  @moduledoc """
  GenServer global que mantém o ranking de todos os jogadores em memória.

  Cada player envia sync via PlayerChannel; o Leaderboard recomputa o top N
  e broadcasts via Phoenix PubSub pra todos os clientes conectados.

  Wave 5: estado in-memory (ETS). Wave futura: persistência em Postgres.
  """

  use GenServer

  @leaderboard_size 100
  @broadcast_interval_ms 5_000

  # Public API

  def start_link(_opts) do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  @doc "Atualiza o score de um player."
  def upsert(player_id, attrs) when is_binary(player_id) and is_map(attrs) do
    GenServer.cast(__MODULE__, {:upsert, player_id, attrs})
  end

  @doc "Retorna o top N players (default 100)."
  def top(n \\ @leaderboard_size) do
    GenServer.call(__MODULE__, {:top, n})
  end

  @doc "Remove um player do leaderboard."
  def remove(player_id) do
    GenServer.cast(__MODULE__, {:remove, player_id})
  end

  # Server callbacks

  @impl true
  def init(_) do
    :ets.new(:leaderboard_players, [:set, :protected, :named_table, read_concurrency: true])
    Process.send_after(self(), :broadcast, @broadcast_interval_ms)

    # Seed com alguns mock players pro leaderboard não começar vazio
    seed_mock_players()

    {:ok, %{last_broadcast: System.system_time(:millisecond)}}
  end

  @impl true
  def handle_cast({:upsert, player_id, attrs}, state) do
    now = System.system_time(:millisecond)

    entry = %{
      player_id: player_id,
      display_name: Map.get(attrs, "display_name", "Anonymous Founder"),
      capability_score: Map.get(attrs, "capability_score", 0),
      era: Map.get(attrs, "era", 1),
      prestige_count: Map.get(attrs, "prestige_count", 0),
      updated_at: now
    }

    :ets.insert(:leaderboard_players, {player_id, entry})
    {:noreply, state}
  end

  @impl true
  def handle_cast({:remove, player_id}, state) do
    :ets.delete(:leaderboard_players, player_id)
    {:noreply, state}
  end

  @impl true
  def handle_call({:top, n}, _from, state) do
    {:reply, compute_top(n), state}
  end

  @impl true
  def handle_info(:broadcast, state) do
    top = compute_top(20)
    Phoenix.PubSub.broadcast(Backend.PubSub, "leaderboard:global", {:leaderboard_update, top})
    Process.send_after(self(), :broadcast, @broadcast_interval_ms)
    {:noreply, %{state | last_broadcast: System.system_time(:millisecond)}}
  end

  # Leitura direta do ETS — evita deadlock quando chamada de dentro do GenServer.
  defp compute_top(n) do
    :ets.tab2list(:leaderboard_players)
    |> Enum.map(fn {_id, entry} -> entry end)
    |> Enum.sort_by(& &1.capability_score, :desc)
    |> Enum.take(n)
    |> compute_market_share()
  end

  # Internals

  defp compute_market_share(entries) do
    total = Enum.reduce(entries, 0, fn e, acc -> acc + e.capability_score end)
    total = if total <= 0, do: 1, else: total

    Enum.map(entries, fn entry ->
      share = entry.capability_score / total * 100.0
      Map.put(entry, :market_share, Float.round(share, 2))
    end)
  end

  defp seed_mock_players do
    mock = [
      {"mock-gpt-slayer", "GPT_Slayer", 2_500_000, 6, 3},
      {"mock-token-maxx", "TokenMaxx", 1_800_000, 5, 2},
      {"mock-claude-fan", "claude_fan", 1_200_000, 5, 2},
      {"mock-regex-bard", "regex_bard", 900_000, 4, 1},
      {"mock-markov", "MarkovChad", 500_000, 3, 1},
      {"mock-lstm-bro", "LSTM_bro", 250_000, 3, 0},
      {"mock-ifelse", "if_else_fan", 50_000, 2, 0}
    ]

    Enum.each(mock, fn {id, name, score, era, prestige} ->
      upsert(id, %{
        "display_name" => name,
        "capability_score" => score,
        "era" => era,
        "prestige_count" => prestige
      })
    end)
  end
end
