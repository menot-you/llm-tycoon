"""
ModelStore — persiste pesos do nano-transformer por player_id.

Cada player tem seu próprio modelo em disco. Salva após cada train_step
para não perder progresso entre requests.
"""

import os
from pathlib import Path
from threading import Lock

import torch

from app.models.nano_transformer import NanoTransformer

_STORAGE_PATH = Path(os.environ.get("MODEL_STORE_PATH", "./ml_data/models"))
_lock = Lock()
_cache: dict[str, NanoTransformer] = {}


class ModelStore:
    @staticmethod
    def ensure_storage_dir() -> None:
        _STORAGE_PATH.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def _path_for(player_id: str) -> Path:
        # Sanitiza pra evitar path traversal
        safe = "".join(c for c in player_id if c.isalnum() or c in "-_")
        return _STORAGE_PATH / f"{safe}.pt"

    @classmethod
    def get_or_create(cls, player_id: str) -> NanoTransformer:
        with _lock:
            if player_id in _cache:
                return _cache[player_id]

            model = NanoTransformer()
            path = cls._path_for(player_id)
            if path.exists():
                state = torch.load(path, weights_only=True)
                model.load_state_dict(state["model"])
                model.steps_trained = state.get("steps_trained", 0)

            _cache[player_id] = model
            return model

    @classmethod
    def save(cls, player_id: str) -> None:
        with _lock:
            if player_id not in _cache:
                return
            model = _cache[player_id]
            path = cls._path_for(player_id)
            torch.save(
                {
                    "model": model.state_dict(),
                    "steps_trained": model.steps_trained,
                },
                path,
            )
