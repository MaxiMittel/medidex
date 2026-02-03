from __future__ import annotations

import config  # noqa: F401
from langchain_openai import ChatOpenAI

DEFAULT_MODEL = "gpt-5"


def build_llm(model: str | None = None) -> ChatOpenAI:
    return ChatOpenAI(
        model=model or DEFAULT_MODEL,
    )


MODEL = build_llm()
