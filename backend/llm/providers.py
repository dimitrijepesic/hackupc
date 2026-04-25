"""Single Groq provider via OpenAI-compatible SDK."""
import os
from dataclasses import dataclass
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()


@dataclass
class LLMResponse:
    text: str
    input_tokens: int
    output_tokens: int
    model_name: str
    provider_name: str


class GroqProvider:
    def __init__(self):
        self.api_key = os.environ["LLM_API_KEY"]
        self.base_url = os.environ.get("LLM_BASE_URL", "https://api.groq.com/openai/v1")
        self.model = os.environ.get("LLM_MODEL", "llama-3.3-70b-versatile")
        self.client = OpenAI(api_key=self.api_key, base_url=self.base_url)

    def complete(self, system: str, user: str, max_tokens: int = 800) -> LLMResponse:
        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            max_tokens=max_tokens,
            temperature=0.3,
        )
        return LLMResponse(
            text=resp.choices[0].message.content,
            input_tokens=resp.usage.prompt_tokens,
            output_tokens=resp.usage.completion_tokens,
            model_name=self.model,
            provider_name="groq",
        )


_LLM = None

def get_llm() -> GroqProvider:
    global _LLM
    if _LLM is None:
        _LLM = GroqProvider()
    return _LLM