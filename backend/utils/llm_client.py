"""
Minimal LLM client for the two chatbot features.

Uses Google's Gemini API (free tier available via Google AI Studio) since
it's the cheapest option with a usable free quota for a project like this.
To swap providers later, only this file needs to change — routes/models
never call the provider API directly.

Token-saving choices baked in here on purpose:
  - small/cheap model by default (override with GEMINI_MODEL env var)
  - hard max_output_tokens cap so replies stay short
  - caller is responsible for trimming chat history before passing it in
    (see models/chat_model.py get_recent_history)
"""

import requests

try:
    from config import GEMINI_API_KEY, GEMINI_MODEL, GEMINI_CAREER_MODEL
except ImportError:
    GEMINI_API_KEY = None
    GEMINI_MODEL = "gemini-3.5-flash-lite"
    GEMINI_CAREER_MODEL = "gemini-3.6-flash"

# Base URL template — model is substituted per-call
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

# Token limits per use-case:
#   General assistant — short, snappy answers, low cost
#   Career guidance  — more detailed analysis allowed
MAX_OUTPUT_TOKENS_GENERAL = 350
MAX_OUTPUT_TOKENS_CAREER  = 700


def is_configured():
    return bool(GEMINI_API_KEY)


def generate_reply(system_prompt, history, user_message, model=None):
    """
    history: list of {"role": "user"|"model", "content": str}, already
             trimmed by the caller (see chat_model.get_recent_history).
    Returns: (reply_text, error) — exactly one will be None.
    """
    if not GEMINI_API_KEY:
        return None, (
            "AI chat isn't configured yet. Add a GEMINI_API_KEY to backend/.env "
            "(free key from https://aistudio.google.com/apikey) to enable this feature."
        )

    # Resolve which model to use and set appropriate token budget
    active_model = model or GEMINI_MODEL
    is_career = (active_model == GEMINI_CAREER_MODEL)
    max_tokens = MAX_OUTPUT_TOKENS_CAREER if is_career else MAX_OUTPUT_TOKENS_GENERAL
    temperature = 0.5 if is_career else 0.65   # slightly more focused for career
    url = GEMINI_BASE_URL.format(model=active_model)

    print(f"[LLM] model={active_model}  max_tokens={max_tokens}")

    contents = []
    for turn in history:
        role = "model" if turn["role"] == "model" else "user"
        contents.append({"role": role, "parts": [{"text": turn["content"]}]})
    contents.append({"role": "user", "parts": [{"text": user_message}]})

    payload = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": contents,
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": temperature,
        },
    }

    try:
        resp = requests.post(
            url,
            params={"key": GEMINI_API_KEY},
            json=payload,
            timeout=30,
        )
        if resp.status_code != 200:
            print("Gemini API error:", resp.status_code, resp.text)
            return None, "The AI service is temporarily unavailable. Please try again shortly."

        data = resp.json()
        candidates = data.get("candidates", [])
        if not candidates:
            return None, "The AI didn't return a response. Please rephrase and try again."

        parts = candidates[0].get("content", {}).get("parts", [])
        reply_text = "".join(p.get("text", "") for p in parts).strip()

        if not reply_text:
            return None, "The AI didn't return a response. Please rephrase and try again."

        return reply_text, None

    except requests.exceptions.RequestException as e:
        print("Gemini request failed:", e)
        return None, "Could not reach the AI service. Please check your connection and try again."
