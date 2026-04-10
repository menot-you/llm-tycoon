"""
LLM Tycoon — ML Service
=======================

FastAPI service que roda o nano-transformer real e o chat com Claude.

Endpoints:
- POST /train      → SGD step real, retorna loss + perplexity
- POST /generate   → inference do nano-model do player
- POST /chat       → chat dinâmico via Claude API (Era 6+)
- POST /evaluate   → benchmark do modelo (capability score real)
- GET  /health
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.routes import chat, evaluate, generate, train


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Startup: garante diretórios de model store, etc.
    from app.models.model_store import ModelStore

    ModelStore.ensure_storage_dir()
    yield
    # Shutdown: nada por enquanto


app = FastAPI(
    title="LLM Tycoon ML Service",
    description="Real transformer training + Claude API for the LLM Tycoon idle game",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(train.router, prefix="/train", tags=["train"])
app.include_router(generate.router, prefix="/generate", tags=["generate"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(evaluate.router, prefix="/evaluate", tags=["evaluate"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "llm-tycoon-ml"}
