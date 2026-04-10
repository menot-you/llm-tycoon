defmodule Backend.Espionage do
  @moduledoc """
  Valida ações de espionagem server-side com cooldowns e aplica efeitos.

  Wave 5: implementação em memória (ETS). Sem persistência ainda.
  """

  use GenServer

  @cooldown_ms 15 * 60 * 1000
  @valid_actions ~w(steal_data sabotage_compute plant_hallucinations fud_campaign)

  def start_link(_opts) do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  @doc """
  Tenta executar uma ação de espionagem.
  Retorna {:ok, result} ou {:error, reason}.
  """
  def execute(attacker_id, target_id, action_type) do
    GenServer.call(__MODULE__, {:execute, attacker_id, target_id, action_type})
  end

  @impl true
  def init(_) do
    :ets.new(:espionage_cooldowns, [:set, :protected, :named_table])
    {:ok, %{}}
  end

  @impl true
  def handle_call({:execute, attacker_id, target_id, action_type}, _from, state) do
    cond do
      action_type not in @valid_actions ->
        {:reply, {:error, :invalid_action}, state}

      attacker_id == target_id ->
        {:reply, {:error, :self_target}, state}

      on_cooldown?(attacker_id, action_type) ->
        {:reply, {:error, :cooldown}, state}

      true ->
        result = roll_action(action_type)
        record_cooldown(attacker_id, action_type)

        response = %{
          action: action_type,
          target: target_id,
          success: result.success,
          effect: result.effect,
          timestamp: System.system_time(:millisecond)
        }

        {:reply, {:ok, response}, state}
    end
  end

  defp on_cooldown?(attacker_id, action_type) do
    key = {attacker_id, action_type}
    now = System.system_time(:millisecond)

    case :ets.lookup(:espionage_cooldowns, key) do
      [{^key, expires_at}] -> expires_at > now
      _ -> false
    end
  end

  defp record_cooldown(attacker_id, action_type) do
    key = {attacker_id, action_type}
    expires_at = System.system_time(:millisecond) + @cooldown_ms
    :ets.insert(:espionage_cooldowns, {key, expires_at})
  end

  defp roll_action("steal_data") do
    roll = :rand.uniform()
    if roll < 0.5 do
      %{success: true, effect: "stole 10% of target's data"}
    else
      %{success: false, effect: "target's security detected the intrusion"}
    end
  end

  defp roll_action("sabotage_compute") do
    if :rand.uniform() < 0.4 do
      %{success: true, effect: "target's compute -20% for 10 min"}
    else
      %{success: false, effect: "sabotage failed, target notified"}
    end
  end

  defp roll_action("plant_hallucinations") do
    if :rand.uniform() < 0.55 do
      %{success: true, effect: "target's hallucination rate +10%"}
    else
      %{success: false, effect: "target's RLHF pipeline caught it"}
    end
  end

  defp roll_action("fud_campaign") do
    if :rand.uniform() < 0.7 do
      %{success: true, effect: "target loses 30% hype"}
    else
      %{success: false, effect: "FUD campaign backfired, +hype to target"}
    end
  end
end
