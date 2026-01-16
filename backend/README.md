# AI Demo Server

Minimal FastAPI + LangGraph demo that evaluates a report against a list of studies.

## Run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env` with:

```bash
OPENAI_API_KEY="your-api-key"
```

Then run:

```bash
uvicorn main:app --reload --port 8001
```

## Example

```bash
curl "http://localhost:8001/evaluate/mock?evaluation_prompt=Prefer%20randomized%20trials%20in%20older%20adults"
```

For a real request, POST `/evaluate` using the `ReportDto` and `StudyDto` shapes. See the mock objects in `backend/main.py`.
