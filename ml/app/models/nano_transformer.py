"""
NanoTransformer — modelo real treinado pelo player.

~100K parâmetros, char-level. Roda instantâneo no CPU.
A loss e perplexity reportadas no jogo são REAIS, não simuladas.
"""

import math

import torch
import torch.nn as nn
import torch.nn.functional as F


class TransformerBlock(nn.Module):
    def __init__(self, d_model: int, n_heads: int):
        super().__init__()
        self.attn = nn.MultiheadAttention(d_model, n_heads, batch_first=True)
        self.ln1 = nn.LayerNorm(d_model)
        self.ln2 = nn.LayerNorm(d_model)
        self.mlp = nn.Sequential(
            nn.Linear(d_model, d_model * 4),
            nn.GELU(),
            nn.Linear(d_model * 4, d_model),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Attention residual
        attn_out, _ = self.attn(x, x, x, need_weights=False)
        x = self.ln1(x + attn_out)
        # MLP residual
        x = self.ln2(x + self.mlp(x))
        return x


class NanoTransformer(nn.Module):
    """
    Modelo char-level minúsculo. Treinado in-game por SGD real.

    Default config: ~100K params
    - vocab_size: 256 (bytes)
    - d_model: 64
    - n_heads: 4
    - n_layers: 2
    - max_seq_len: 64
    """

    def __init__(
        self,
        vocab_size: int = 256,
        d_model: int = 64,
        n_heads: int = 4,
        n_layers: int = 2,
        max_seq_len: int = 64,
    ):
        super().__init__()
        self.vocab_size = vocab_size
        self.d_model = d_model
        self.max_seq_len = max_seq_len

        self.token_embed = nn.Embedding(vocab_size, d_model)
        self.pos_embed = nn.Embedding(max_seq_len, d_model)
        self.blocks = nn.ModuleList(
            [TransformerBlock(d_model, n_heads) for _ in range(n_layers)]
        )
        self.ln_f = nn.LayerNorm(d_model)
        self.head = nn.Linear(d_model, vocab_size, bias=False)

        self.optimizer = torch.optim.Adam(self.parameters(), lr=3e-4)
        self.steps_trained = 0

    def forward(self, idx: torch.Tensor) -> torch.Tensor:
        b, t = idx.shape
        pos = torch.arange(t, device=idx.device).unsqueeze(0)
        x = self.token_embed(idx) + self.pos_embed(pos)
        for block in self.blocks:
            x = block(x)
        x = self.ln_f(x)
        return self.head(x)

    def train_step(self, batch: torch.Tensor) -> dict:
        """
        Um step real de SGD. Recebe batch [B, T] e treina cross-entropy
        prevendo o próximo token.

        Retorna dict com loss e perplexity reais.
        """
        self.train()
        # Input: tudo menos o último; Target: tudo menos o primeiro
        x = batch[:, :-1]
        y = batch[:, 1:]

        logits = self.forward(x)
        loss = F.cross_entropy(logits.reshape(-1, self.vocab_size), y.reshape(-1))

        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()
        self.steps_trained += 1

        return {
            "loss": float(loss.item()),
            "perplexity": float(math.exp(min(loss.item(), 20))),
            "steps_trained": self.steps_trained,
        }

    @torch.no_grad()
    def generate(self, prompt_bytes: bytes = b"", max_new_tokens: int = 50) -> str:
        """
        Inference real. A qualidade do output depende de quanto o player treinou.
        """
        self.eval()
        if not prompt_bytes:
            prompt_bytes = b" "

        idx = torch.tensor([list(prompt_bytes)], dtype=torch.long)

        for _ in range(max_new_tokens):
            idx_cond = idx[:, -self.max_seq_len :]
            logits = self.forward(idx_cond)
            last_logits = logits[:, -1, :]
            probs = F.softmax(last_logits, dim=-1)
            next_token = torch.multinomial(probs, num_samples=1)
            idx = torch.cat([idx, next_token], dim=1)

        # Decode bytes → string (com fallback pra chars inválidos)
        out_bytes = bytes(idx[0].tolist())
        return out_bytes.decode("utf-8", errors="replace")

    def param_count(self) -> int:
        return sum(p.numel() for p in self.parameters())
