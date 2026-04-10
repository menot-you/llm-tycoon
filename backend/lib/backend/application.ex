defmodule Backend.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    # Wave 5: in-memory only. Repo desabilitado temporariamente
    # (será reativado na Wave 6/7 quando implementarmos persistência).
    children =
      [
        BackendWeb.Telemetry,
        {DNSCluster, query: Application.get_env(:backend, :dns_cluster_query) || :ignore},
        {Phoenix.PubSub, name: Backend.PubSub},
        Backend.Leaderboard,
        Backend.Espionage,
        BackendWeb.Endpoint
      ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Backend.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    BackendWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
