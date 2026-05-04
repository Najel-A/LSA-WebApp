"""Request schemas for the NexusTrace sanity-check inference service."""

from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class NexusQueryRequest(BaseModel):
    """Body sent by the LSA frontend via nginx `POST /query` (same contract as Vite dev proxy)."""

    system_prompt: str = Field(default="", max_length=50_000)
    prompt: str = Field(..., min_length=1, max_length=500_000)
    max_new_tokens: int = Field(default=1024, ge=1, le=128_000)
    max_time: int = Field(default=120, ge=1, le=3600)
    temperature: float = Field(default=0.0, ge=0.0, le=2.0)
    top_p: float = Field(default=1.0, ge=0.0, le=1.0)

    @field_validator("prompt")
    @classmethod
    def _prompt_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("prompt must not be blank")
        return v


class AnalyzeRequest(BaseModel):
    """Single-incident analyze request.

    Matches the contract documented in the fastapi/ README:
        {
          "incident_id": "optional-id",
          "evidence_text": "raw Kubernetes incident evidence"
        }
    """

    incident_id: str | None = Field(
        default=None,
        description="Caller-supplied incident id. Service generates one if omitted.",
        max_length=128,
    )
    evidence_text: str = Field(
        ...,
        description="Raw Kubernetes incident evidence (describe / events / logs blob).",
        min_length=1,
    )

    @field_validator("evidence_text")
    @classmethod
    def _evidence_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("evidence_text must not be blank")
        return v
