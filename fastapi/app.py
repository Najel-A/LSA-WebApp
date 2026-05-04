"""NexusTrace sanity-check inference service.

Single FastAPI app that orchestrates the full 4-agent pipeline
(Agent 1 + Agent 2 -> Reconciler -> Validator) using asyncio for
parallelism instead of threads + Redis pub/sub.

Run from INSIDE this directory so the local `fastapi/` folder does not
shadow the installed `fastapi` library:

    cd fastapi
    uvicorn app:app --host 0.0.0.0 --port 8001 --reload

Local dev uses port **8001** so it does not clash with other services.
**Docker Compose** runs the same app on **8000** (see `fastapi/Dockerfile`)
so nginx can `proxy_pass` to `http://analyzer:8000/query`.
"""

from __future__ import annotations

import uuid

from fastapi import FastAPI

from schemas.requests import AnalyzeRequest, NexusQueryRequest
from schemas.responses import AnalyzeResponse
from services.memory import IncidentBlackboard
from services.orchestrator import run_pipeline
from services.query_adapter import extract_evidence_from_prompt, format_analyze_response_as_rca_text

app = FastAPI(
    title="NexusTrace Inference (sanity)",
    description="Async 4-agent pipeline — sanity-check tier.",
    version="0.1.0",
)

_blackboard = IncidentBlackboard()


@app.get("/health")
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "service": "fastapi-sanity",
        "agents": ["agent_1", "agent_2", "reconciler", "validator"],
    }


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    incident_id = req.incident_id or uuid.uuid4().hex[:12]
    return await run_pipeline(_blackboard, incident_id, req.evidence_text)


@app.post("/query")
async def query_for_spa(req: NexusQueryRequest) -> dict[str, str]:
    """LSA Web UI compatibility — same JSON body as `postNexusAnalyze` in the SPA.

    Returns `{"text": ...}` with section headers parsed by `parseRcaResponse.ts`.
    """
    incident_id = uuid.uuid4().hex[:12]
    evidence = extract_evidence_from_prompt(req.prompt)
    result = await run_pipeline(_blackboard, incident_id, evidence)
    text = format_analyze_response_as_rca_text(result)
    return {"text": text}
