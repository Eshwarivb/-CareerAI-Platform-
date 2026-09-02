# RAJR — Feature Update: ATS Score + Chatbots

This update adds ATS scoring, enhanced job matching, and two chatbots on top
of the existing resume analyzer, without changing the existing
`/api/resume/analyze` response shape or breaking existing auth.

## What's new

| Feature | LLM used? | New files |
|---|---|---|
| ATS Score | No — pure keyword/formatting rules | `backend/utils/ats_scorer.py` |
| Job match % + sorting | No — keyword overlap | edited `backend/utils/job_recommender.py` |
| General chatbot | Yes — Gemini | `backend/routes/chat_routes.py`, `backend/utils/llm_client.py` |
| Career guidance chatbot | Yes — Gemini, grounded in resume | same as above |

Only the two chatbots make LLM API calls — ATS scoring and job matching are
100% rule-based, so they cost nothing per request.

## New/changed backend endpoints

### `POST /api/resume/ats-score`
`multipart/form-data`: `resume` (file), `job_description` (text).
No auth required (matches the existing `/analyze` endpoint's permissive pattern).

Returns:
```json
{
  "overall_score": 72,
  "keyword_match_pct": 66,
  "matched_keywords": ["python", "sql"],
  "missing_keywords": ["docker", "aws"],
  "formatting_issues": ["Missing a clearly labeled 'Education' section header."],
  "formatting_score": 83
}
```

### `POST /api/chat/general` — requires `Authorization: Bearer <token>`
Body: `{ "message": "..." }` → `{ "reply": "..." }`

### `POST /api/chat/career` — requires `Authorization: Bearer <token>`
Body:
```json
{
  "message": "What should I learn next?",
  "target_role": "Data Analyst",
  "resume_context": { "skills": [...], "experience_level": "...", "feedback": [...] }
}
```
`resume_context` is what the frontend saved from the last `/analyze` call
(stored in `localStorage`) — this is what grounds the advice in the user's
actual resume without needing to persist parsed resumes server-side.

## Setup

1. Get a free Gemini API key: https://aistudio.google.com/apikey
2. Add it to `backend/.env`:
   ```
   GEMINI_API_KEY=your_key_here
   ```
   Chat endpoints work without this key — they just return a friendly
   "not configured" message instead of erroring.
3. **Bug fixed as part of this update:** `config.py` was reading the Mongo
   connection string as an environment variable *name* instead of its
   *value* (`os.getenv("mongodb+srv://...")` instead of
   `os.getenv("MONGO_URI")`), so `MONGO_URI` was silently falling back to
   `localhost` every time. This is now fixed — new chat history storage
   depends on Mongo actually connecting.
4. No new pip packages required — `requests` was already in
   `requirements.txt` and is reused for the Gemini calls.

## Security note (not part of this update, but worth fixing before sharing this repo)

`backend/.env` contains a live MongoDB password and a live RapidAPI key in
plain text inside the zip you uploaded. If this project is or will be pushed
to a public GitHub repo, rotate both credentials and add `.env` to
`.gitignore` — anyone with the zip/repo currently has full access to your
database and API quota.

## Token/cost controls already built in

- Chat replies capped at 300 output tokens (`llm_client.py`)
- Chat history trimmed to last 6 turns before being sent to the model
  (`chat_model.py`)
- Career chatbot sends only the parsed summary (skills/experience/feedback),
  not the full resume text
- Default model is Gemini Flash-Lite (cheapest/free-tier tier) — override
  via `GEMINI_MODEL` in `.env` if you want a stronger model later
