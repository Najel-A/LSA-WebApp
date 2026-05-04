"""Bridge LSA Web UI `POST /query` to the internal `/analyze` pipeline.

The SPA posts { system_prompt, prompt, max_new_tokens, ... } and expects
plain text (or JSON with a `text` field) using section headers parsed by
`frontend/src/lib/parseRcaResponse.ts`.
"""

from __future__ import annotations

from schemas.responses import AnalyzeResponse


def extract_evidence_from_prompt(prompt: str) -> str:
    """Prefer the fenced evidence block from `buildEvidencePrompt`; else use full prompt."""
    start = "--- INCIDENT EVIDENCE ---"
    end = "--- END EVIDENCE ---"
    if start in prompt and end in prompt:
        try:
            i = prompt.index(start) + len(start)
            j = prompt.index(end, i)
            return prompt[i:j].strip()
        except ValueError:
            pass
    return prompt.strip()


def format_analyze_response_as_rca_text(resp: AnalyzeResponse) -> str:
    """Section headers must match `parseRcaResponse.ts` matchers."""
    fr = resp.final_recommendation
    rec = resp.reconciler_output
    val = resp.validation_output

    diagnosis = (fr.diagnosis or rec.diagnosis or "").strip()
    fix_lines = list(fr.fix_plan) or list(rec.fix_plan) or []
    cmd_lines = list(fr.commands) or list(rec.commands) or []
    ver_lines = list(fr.verification) or list(val.verification) or []
    roll_lines = list(fr.rollback) or list(val.rollback) or []

    def bullets(items: list[str]) -> str:
        return "\n".join(f"- {s}" for s in items) if items else "- (none)"

    review = (
        f"\n\nNote: Human review {'is' if resp.requires_human_review else 'is not'} required before applying commands."
    )

    return "\n".join(
        [
            "Diagnosis",
            "",
            diagnosis,
            "",
            "Step-by-Step Fix Plan",
            "",
            bullets(fix_lines),
            "",
            "Concrete Actions or Commands to Apply the Fix",
            "",
            bullets(cmd_lines),
            "",
            "Verification Steps to Confirm the Fix Worked",
            "",
            bullets(ver_lines),
            "",
            "Rollback Guidance if the Fix Causes Issues",
            "",
            bullets(roll_lines),
            review.strip(),
        ]
    )
