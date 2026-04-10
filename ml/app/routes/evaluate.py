"""POST /evaluate — calcula capability score real do modelo.

O capability score do PvP é proporcional à inversa da loss do modelo.
Quanto melhor o modelo treinou, maior seu score.
"""

import torch
from fastapi import APIRouter
from pydantic import BaseModel

from app.models.model_store import ModelStore
from app.routes.train import DEFAULT_CORPUS

router = APIRouter()


class EvaluateRequest(BaseModel):
    player_id: str


class EvaluateResponse(BaseModel):
    eval_loss: float
    perplexity: float
    capability_score: int
    steps_trained: int


@router.post("/", response_model=EvaluateResponse)
def evaluate(req: EvaluateRequest) -> EvaluateResponse:
    model = ModelStore.get_or_create(req.player_id)
    model.eval()

    # Eval em todo o corpus
    seq_len = 32
    losses = []
    with torch.no_grad():
        for start in range(0, len(DEFAULT_CORPUS) - seq_len, seq_len):
            chunk = DEFAULT_CORPUS[start : start + seq_len + 1]
            if len(chunk) < seq_len + 1:
                continue
            batch = torch.tensor([list(chunk)], dtype=torch.long)
            x = batch[:, :-1]
            y = batch[:, 1:]
            logits = model.forward(x)
            loss = torch.nn.functional.cross_entropy(
                logits.reshape(-1, model.vocab_size),
                y.reshape(-1),
            )
            losses.append(loss.item())

    avg_loss = sum(losses) / max(1, len(losses))
    perplexity = float(torch.exp(torch.tensor(min(avg_loss, 20))).item())

    # Capability score: quanto menor a loss, maior o score
    # Cap em 1M pra não estourar
    capability_score = int(min(1_000_000, 1000 / max(0.001, avg_loss) * model.steps_trained))

    return EvaluateResponse(
        eval_loss=avg_loss,
        perplexity=perplexity,
        capability_score=capability_score,
        steps_trained=model.steps_trained,
    )
