from __future__ import annotations

from pydantic import BaseModel, Field


class RoutingPayload(BaseModel):
    danger_routes: list[dict] = Field(default_factory=list)
    safe_routes: list[dict] = Field(default_factory=list)
    alert_message: str = Field(default="No active threat.")
    severity: int = Field(default=1, ge=1, le=5)
