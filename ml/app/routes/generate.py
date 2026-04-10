"""POST /generate — inference real do nano-transformer do player."""

from fastapi import APIRouter
from pydantic import BaseModel

from app.models.model_store import ModelStore

router = APIRouter()


class GenerateRequest(BaseModel):
    player_id: str
    prompt: str = ""
    max_new_tokens: int = 50


class GenerateResponse(BaseModel):
    text: str
    steps_trained: int


@router.post("/", response_model=GenerateResponse)
def generate(req: GenerateRequest) -> GenerateResponse:
    model = ModelStore.get_or_create(req.player_id)
    text = model.generate(
        prompt_bytes=req.prompt.encode("utf-8"),
        max_new_tokens=req.max_new_tokens,
    )
    return GenerateResponse(text=text, steps_trained=model.steps_trained)
