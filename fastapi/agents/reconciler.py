"""Reconciliation agent.

When `EXECUTOR_URL` is set, calls the mrunalikatta/executor-mistral-24b
model and asks it for a JSON object with `diagnosis`, `fix_plan`, and
`commands`. We parse it and use the parsed values verbatim, falling
back to canned stubs only if the model returns unparseable output.

When `EXECUTOR_URL` is unset, behaves exactly as the original stub:
picks the higher-confidence diagnosis verbatim and uses canned plan
and commands.
"""

from __future__ import annotations

import asyncio
import json
import re

import httpx

from schemas.responses import AgentDiagnosis, ReconcilerOutput
from services.memory import IncidentBlackboard
from services.model_client import ModelEndpoint, call_model

_LATENCY_S = 0.10
_ENDPOINT = ModelEndpoint.from_env(
    name="reconciler",
    url_env="EXECUTOR_URL",
    model_env="EXECUTOR_MODEL",
)

_STUB_FIX_PLAN = [
    "Identify the missing resource named in the pod event message.",
    "Create or correct the missing Secret / ConfigMap / image tag.",
    "Restart the pod (delete + let the Deployment recreate it) and confirm it reaches Running.",
]
_STUB_COMMANDS = [
    "kubectl -n <namespace> describe pod <pod_name>",
    "kubectl -n <namespace> get events --sort-by=.lastTimestamp | tail -20",
    "kubectl -n <namespace> delete pod <pod_name>",
    "kubectl -n <namespace> get pod <pod_name> -w",
]

_SYSTEM_PROMPT = (
    "You are a Kubernetes Site Reliability Engineering (SRE) executor. "
    "Two upstream RCA agents have proposed competing diagnoses for the same "
    "incident. Synthesize them into a final diagnosis, then propose a "
    "concrete fix plan and the kubectl commands to apply it. Keep concrete "
    "specifics (resource names, namespaces, error reasons) that either "
    "agent got right; drop hedging. Respond as JSON only — no prose, no "
    "code fences, no commentary."
)

_PROMPT_TEMPLATE = """Two RCA agents proposed competing diagnoses for the same Kubernetes incident.

Agent 1 diagnosis (confidence 0.82):
{a1}

Agent 2 diagnosis (confidence 0.78):
{a2}

Return JSON only, with this exact shape:
{{
  "diagnosis": "<one concise paragraph naming the specific resource/error>",
  "fix_plan": ["<step 1>", "<step 2>", "<step 3>"],
  "commands": ["kubectl ...", "kubectl ..."]
}}"""

# Tolerant JSON extractor — handles models that wrap the object in
# ```json ... ``` fences or add a stray sentence before/after.
_JSON_BLOCK_RE = re.compile(r"\{.*\}", re.DOTALL)


def _parse_json(text: str) -> dict | None:
    if not text:
        return None
    match = _JSON_BLOCK_RE.search(text)
    if not match:
        return None
    try:
        parsed = json.loads(match.group(0))
    except json.JSONDecodeError:
        return None
    return parsed if isinstance(parsed, dict) else None


def _coerce_str_list(value, fallback: list[str]) -> list[str]:
    if not isinstance(value, list) or not value:
        return list(fallback)
    return [str(item) for item in value if str(item).strip()]


async def run(bb: IncidentBlackboard, incident_id: str) -> ReconcilerOutput:
    a1: AgentDiagnosis = await bb.read(incident_id, "agent_1_output")
    a2: AgentDiagnosis = await bb.read(incident_id, "agent_2_output")
    if a1 is None or a2 is None:
        raise RuntimeError(
            f"reconciler: missing agent output(s) for {incident_id!r} "
            f"(agent_1={a1 is not None}, agent_2={a2 is not None})"
        )

    winner, loser = (a1, a2) if a1.confidence >= a2.confidence else (a2, a1)
    diagnosis_text, fix_plan, commands, mode = await _reconcile(a1, a2, winner)

    output = ReconcilerOutput(
        diagnosis=diagnosis_text,
        fix_plan=fix_plan,
        commands=commands,
        chosen_source=winner.agent,
        notes=(
            f"[{mode}] selected {winner.agent} (conf={winner.confidence:.2f}) "
            f"over {loser.agent} (conf={loser.confidence:.2f})."
        ),
    )
    await bb.write(incident_id, "reconciler_output", output)
    return output


async def _reconcile(
    a1: AgentDiagnosis,
    a2: AgentDiagnosis,
    winner: AgentDiagnosis,
) -> tuple[str, list[str], list[str], str]:
    if _ENDPOINT is None:
        await asyncio.sleep(_LATENCY_S)
        return winner.diagnosis, list(_STUB_FIX_PLAN), list(_STUB_COMMANDS), "stub"
    try:
        prompt = _PROMPT_TEMPLATE.format(a1=a1.diagnosis, a2=a2.diagnosis)
        text = await call_model(
            _ENDPOINT,
            prompt,
            system_prompt=_SYSTEM_PROMPT,
            max_tokens=1200,
            response_format={"type": "json_object"},
        )
        parsed = _parse_json(text)
        if not parsed:
            return (
                winner.diagnosis,
                list(_STUB_FIX_PLAN),
                list(_STUB_COMMANDS),
                "real-parse-fallback",
            )
        return (
            str(parsed.get("diagnosis") or winner.diagnosis).strip(),
            _coerce_str_list(parsed.get("fix_plan"), _STUB_FIX_PLAN),
            _coerce_str_list(parsed.get("commands"), _STUB_COMMANDS),
            "real",
        )
    except (httpx.HTTPError, httpx.RequestError) as e:
        return (
            f"{winner.diagnosis} (executor call failed: {e!r})",
            list(_STUB_FIX_PLAN),
            list(_STUB_COMMANDS),
            "real-error-fallback",
        )
