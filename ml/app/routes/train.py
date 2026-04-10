"""POST /train — SGD step real no nano-transformer do player."""

import torch
from fastapi import APIRouter
from pydantic import BaseModel

from app.models.model_store import ModelStore

router = APIRouter()

# Pequeno corpus de "training data" — em produção viria do DB
# (proporcional aos dados que o player "comprou" no jogo)
DEFAULT_CORPUS = (
    b"the quick brown fox jumps over the lazy dog. "
    b"to be or not to be, that is the question. "
    b"in the beginning there was the word and the word was code. "
    b"attention is all you need. transformers are large language models. "
)


class TrainRequest(BaseModel):
    player_id: str
    batch_size: int = 8
    seq_len: int = 32


class TrainResponse(BaseModel):
    loss: float
    perplexity: float
    steps_trained: int
    param_count: int


@router.post("/", response_model=TrainResponse)
def train_step(req: TrainRequest) -> TrainResponse:
    model = ModelStore.get_or_create(req.player_id)

    # Sample um batch random do corpus
    batch = []
    for _ in range(req.batch_size):
        start = torch.randint(0, max(1, len(DEFAULT_CORPUS) - req.seq_len), (1,)).item()
        chunk = DEFAULT_CORPUS[start : start + req.seq_len + 1]
        chunk_padded = chunk + b" " * (req.seq_len + 1 - len(chunk))
        batch.append(list(chunk_padded[: req.seq_len + 1]))

    batch_tensor = torch.tensor(batch, dtype=torch.long)
    metrics = model.train_step(batch_tensor)
    ModelStore.save(req.player_id)

    return TrainResponse(
        loss=metrics["loss"],
        perplexity=metrics["perplexity"],
        steps_trained=metrics["steps_trained"],
        param_count=model.param_count(),
    )
