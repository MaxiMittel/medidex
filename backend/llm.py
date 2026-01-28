from __future__ import annotations

import config  # noqa: F401
from langchain_openai import ChatOpenAI

MODEL = ChatOpenAI(
    model="gpt-5",
    temperature=0.1,
    model_kwargs={"response_format": {"type": "json_object"}},
)
