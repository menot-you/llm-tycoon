defmodule BackendWeb.UserSocket do
  use Phoenix.Socket

  # Channels
  channel "player:*", BackendWeb.PlayerChannel

  @impl true
  def connect(_params, socket, _connect_info) do
    # Wave 5: anonymous auth via player_id cliente-gerado (UUID)
    # Wave futura: validação via token JWT
    {:ok, socket}
  end

  @impl true
  def id(_socket), do: nil
end
