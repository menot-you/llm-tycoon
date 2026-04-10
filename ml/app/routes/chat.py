"""POST /chat — chat dinâmico via Claude API (Era 6+).

Pra eras 1-5 o frontend usa hardcoded ou nano-model. Esse endpoint só
responde quando a era >= 6.
"""

import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.prompts.era_prompts import get_system_prompt

router = APIRouter()


class ChatRequest(BaseModel):
    player_id: str
    era: int  # 6, 7, ou 8
    last_action: str  # o que o player acabou de fazer
    capability_score: int = 0


class ChatResponse(BaseModel):
    text: str
    era: int


@router.post("/", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    if req.era < 6:
        raise HTTPException(
            status_code=400,
            detail="Chat via Claude API só está disponível na Era 6+",
        )

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        # Fallback gracioso pra dev sem API key
        return ChatResponse(
            text="(modelo silencioso — ANTHROPIC_API_KEY não configurada)",
            era=req.era,
        )

    # Import lazy pra evitar custo no startup se não usar
    from anthropic import AsyncAnthropic

    client = AsyncAnthropic(api_key=api_key)
    system_prompt = get_system_prompt(req.era)

    user_message = (
        f"The player just did: {req.last_action}. "
        f"Their current capability score is {req.capability_score}. "
        f"Respond as the AI model now."
    )

    response = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=200,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}],
    )

    # Pega o text do primeiro content block
    text = ""
    for block in response.content:
        if hasattr(block, "text"):
            text = block.text
            break

    return ChatResponse(text=text or "(silêncio)", era=req.era)
