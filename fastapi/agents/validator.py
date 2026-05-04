"""Validation agent.

When `VALIDATOR_URL` is set, calls the mrunalikatta/validator-llama-3b
model and asks it for a JSON object with `safety_notes`, `verification`,
and `rollback`. We parse the JSON and use the parsed values verbatim,
falling back to canned stubs only if parsing fails.

When `VALIDATOR_URL` is unset, behaves exactly as the original stub.
"""

from __future__ import annotations

import asyncio
import json
import re

import httpx

from schemas.responses import ReconcilerOutput, ValidatorOutput
from services.memory import IncidentBlackboard
from services.model_client import ModelEndpoint, call_model

_LATENCY_S = 0.08
_ENDPOINT = ModelEndpoint.from_env(
    name="validator",
    url_env="VALIDATOR_URL",
    model_env="VALIDATOR_MODEL",
)

_STUB_VERIFICATION = [
    "Pod transitions from Pending/CrashLoopBackOff to Running.",
    "No new error events appear under `kubectl describe pod`.",
    "Container logs show normal startup — no fatal errors.",
]
_STUB_ROLLBACK = [
    "kubectl -n <namespace> rollout undo deployment/<name>",
    "Re-create or restore the previously-removed resource if the fix removed it.",
]
_STUB_SAFETY_BASE = (
    "Stub validator. Human review required because the reconciler "
    "proposed commands that mutate cluster state."
)
_STUB_SAFETY_NO_COMMANDS = (
    "No mutating commands proposed; review optional."
)

_SYSTEM_PROMPT = (
    "You are a Kubernetes Site Reliability Engineering (SRE) safety validator. "
    "Given a final diagnosis and a set of proposed remediation commands, "
    "assess safety and produce concrete verification steps and rollback "
    "guidance. Flag any commands that mutate cluster state (delete, apply, "
    "patch, scale, rollout), preconditions that must hold (correct namespace, "
    "resource exists, no in-flight rollout), and obvious risks (downtime, "
    "data loss, blast radius). Respond as JSON only — no prose, no code "
    "fences, no commentary."
)

_PROMPT_TEMPLATE = """Assess the safety of running the proposed remediation commands against the named Kubernetes incident.

Diagnosis:
{diagnosis}

Proposed commands:
{commands}

Return JSON only, with this exact shape:
{{
  "safety_notes": "<one concise paragraph: mutation flags, preconditions, risks>",
  "verification": ["<post-fix check 1>", "<post-fix check 2>"],
  "rollback": ["<rollback step 1>", "<rollback step 2>"]
}}"""

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


async def run(bb: IncidentBlackboard, incident_id: str) -> ValidatorOutput:
    rec: ReconcilerOutput = await bb.read(incident_id, "reconciler_output")
    if rec is None:
        raise RuntimeError(
            f"validator: missing reconciler_output for {incident_id!r}"
        )

    has_commands = bool(rec.commands)
    safety_notes, verification, rollback, mode = await _assess(rec, has_commands)

    output = ValidatorOutput(
        verification=verification,
        rollback=rollback,
        requires_human_review=has_commands,
        safety_notes=f"[{mode}] {safety_notes}",
    )
    await bb.write(incident_id, "validation_output", output)
    return output


async def _assess(
    rec: ReconcilerOutput,
    has_commands: bool,
) -> tuple[str, list[str], list[str], str]:
    fallback_safety = _STUB_SAFETY_BASE if has_commands else _STUB_SAFETY_NO_COMMANDS
    if _ENDPOINT is None:
        await asyncio.sleep(_LATENCY_S)
        return (
            fallback_safety,
            list(_STUB_VERIFICATION),
            list(_STUB_ROLLBACK),
            "stub",
        )
    try:
        prompt = _PROMPT_TEMPLATE.format(
            diagnosis=rec.diagnosis,
            commands="\n".join(f"- {c}" for c in rec.commands) or "(none)",
        )
        text = await call_model(
            _ENDPOINT,
            prompt,
            system_prompt=_SYSTEM_PROMPT,
            max_tokens=900,
            response_format={"type": "json_object"},
        )
        parsed = _parse_json(text)
        if not parsed:
            return (
                fallback_safety,
                list(_STUB_VERIFICATION),
                list(_STUB_ROLLBACK),
                "real-parse-fallback",
            )
        return (
            str(parsed.get("safety_notes") or fallback_safety).strip(),
            _coerce_str_list(parsed.get("verification"), _STUB_VERIFICATION),
            _coerce_str_list(parsed.get("rollback"), _STUB_ROLLBACK),
            "real",
        )
    except (httpx.HTTPError, httpx.RequestError) as e:
        return (
            f"{fallback_safety} (validator call failed: {e!r})",
            list(_STUB_VERIFICATION),
            list(_STUB_ROLLBACK),
            "real-error-fallback",
        )
