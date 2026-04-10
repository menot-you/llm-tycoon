defmodule Backend.Game.State do
  @moduledoc """
  Shape completo do estado do jogo (porta de frontend/src/engine/state/GameState.ts).

  Single source of truth. Tudo que pode ser salvo, carregado, renderizado ou
  sincronizado passa por aqui. Todos os modules de game logic recebem e retornam
  esta struct.
  """

  @save_version 2

  @type era_id :: 1..8

  @type resources :: %{
          tokens: float(),
          compute: float(),
          data: float(),
          funding: float(),
          hype: float(),
          hallucinations: float()
        }

  @type t :: %__MODULE__{
          version: integer(),
          player_id: String.t() | nil,
          display_name: String.t(),
          created_at: integer(),
          last_tick: integer(),
          tick_count: integer(),
          resources: resources(),
          total_tokens_earned: float(),
          buildings: %{atom() => integer()},
          upgrades: [String.t()],
          era: era_id(),
          prestige_count: integer(),
          insight_points: integer(),
          permanent_upgrades: [String.t()],
          reborn_count: integer(),
          reborn_points: integer(),
          unlocked_perks: [String.t()],
          total_prestiges_all_time: integer(),
          ml_steps_trained: integer(),
          ml_capability_score: integer(),
          achievements: [String.t()]
        }

  defstruct version: @save_version,
            player_id: nil,
            display_name: "Anonymous Founder",
            created_at: 0,
            last_tick: 0,
            tick_count: 0,
            resources: %{
              tokens: 0.0,
              compute: 0.0,
              data: 0.0,
              funding: 0.0,
              hype: 0.0,
              hallucinations: 0.0
            },
            total_tokens_earned: 0.0,
            buildings: %{},
            upgrades: [],
            era: 1,
            prestige_count: 0,
            insight_points: 0,
            permanent_upgrades: [],
            reborn_count: 0,
            reborn_points: 0,
            unlocked_perks: [],
            total_prestiges_all_time: 0,
            ml_steps_trained: 0,
            ml_capability_score: 0,
            achievements: []

  @doc "Versão atual do save format."
  def save_version, do: @save_version

  @doc "Cria um estado fresh (reset/prestige/reborn)."
  @spec new(String.t() | nil) :: t()
  def new(player_id \\ nil) do
    now = System.system_time(:millisecond)

    %__MODULE__{
      player_id: player_id,
      created_at: now,
      last_tick: now
    }
  end

  @doc "Serializa pra map JSON-friendly (pra Postgres jsonb ou Phoenix push)."
  @spec to_map(t()) :: map()
  def to_map(%__MODULE__{} = state) do
    state
    |> Map.from_struct()
    |> Map.update!(:buildings, fn buildings ->
      Map.new(buildings, fn {k, v} -> {Atom.to_string(k), v} end)
    end)
  end

  @doc "Reidratatação from map (jsonb do Postgres → struct)."
  @spec from_map(map()) :: t()
  def from_map(map) when is_map(map) do
    base = %__MODULE__{}

    attrs =
      map
      |> Enum.map(fn {k, v} ->
        key = if is_atom(k), do: k, else: String.to_existing_atom(to_string(k))
        {key, v}
      end)
      |> Map.new()

    buildings =
      case Map.get(attrs, :buildings, %{}) do
        b when is_map(b) ->
          Map.new(b, fn {k, v} ->
            key = if is_atom(k), do: k, else: String.to_atom(to_string(k))
            {key, v}
          end)

        _ ->
          %{}
      end

    resources =
      case Map.get(attrs, :resources, base.resources) do
        r when is_map(r) ->
          Map.new(base.resources, fn {key, default} ->
            string_key = Atom.to_string(key)
            value = Map.get(r, key) || Map.get(r, string_key) || default
            {key, to_float(value)}
          end)

        _ ->
          base.resources
      end

    struct(base, Map.merge(attrs, %{buildings: buildings, resources: resources}))
  end

  defp to_float(v) when is_integer(v), do: v * 1.0
  defp to_float(v) when is_float(v), do: v
  defp to_float(_), do: 0.0

  @doc "Quanto de um building específico o player tem."
  @spec owned(t(), atom()) :: integer()
  def owned(%__MODULE__{buildings: buildings}, building_id) when is_atom(building_id) do
    Map.get(buildings, building_id, 0)
  end

  @doc "Aplica um update imutável no struct (conveniência para pipelines)."
  @spec update(t(), (t() -> t())) :: t()
  def update(%__MODULE__{} = state, fun) when is_function(fun, 1), do: fun.(state)
end
