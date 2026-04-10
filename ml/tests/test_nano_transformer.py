"""
Testes do NanoTransformer — valida que SGD real funciona.
"""

import torch

from app.models.nano_transformer import NanoTransformer
from app.routes.train import DEFAULT_CORPUS


def test_param_count_in_target_range():
    model = NanoTransformer()
    count = model.param_count()
    # Target: ~100K params (aceitamos 50K-200K)
    assert 50_000 <= count <= 200_000, f"expected 50K-200K params, got {count}"


def test_forward_shape():
    model = NanoTransformer()
    batch = torch.randint(0, 256, (2, 16))
    logits = model.forward(batch)
    assert logits.shape == (2, 16, 256)


def test_train_step_reduces_loss():
    """Treina 10 steps num batch fixo e valida que a loss cai."""
    torch.manual_seed(42)
    model = NanoTransformer()

    # batch fixo do corpus
    seq_len = 32
    chunk = DEFAULT_CORPUS[:seq_len + 1]
    batch = torch.tensor([list(chunk), list(chunk)], dtype=torch.long)

    initial_loss = None
    final_loss = None
    for i in range(10):
        metrics = model.train_step(batch)
        if i == 0:
            initial_loss = metrics["loss"]
        final_loss = metrics["loss"]

    assert final_loss < initial_loss, (
        f"SGD nao reduziu loss: {initial_loss:.4f} -> {final_loss:.4f}"
    )
    assert model.steps_trained == 10


def test_perplexity_matches_loss():
    model = NanoTransformer()
    batch = torch.randint(0, 256, (1, 16))
    metrics = model.train_step(batch)
    # perplexity = exp(loss) (com cap)
    import math
    expected_ppl = math.exp(min(metrics["loss"], 20))
    assert abs(metrics["perplexity"] - expected_ppl) < 0.01


def test_generate_produces_text():
    model = NanoTransformer()
    text = model.generate(prompt_bytes=b"hello", max_new_tokens=10)
    # Pelo menos tem o prompt + 10 chars (pode ter chars inválidos decodificados como replacement)
    assert len(text) >= 5
    assert text.startswith("hello")
