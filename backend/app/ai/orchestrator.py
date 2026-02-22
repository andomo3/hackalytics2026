"""AI routing orchestrator for crowd egress decisions.

Uses a Pydantic AI agent (OpenAI GPT-4o) with dynamic system prompts and
output validation when OPENAI_API_KEY is set; falls back to rule-based
logic otherwise.
"""

from __future__ import annotations

import json
from dataclasses import dataclass

from pydantic_ai import Agent, ModelRetry, RunContext

from app.ai.schemas import RoutingPayload
from app.config import settings


@dataclass
class EgressContext:
    egress_threat_score: float
    estimated_crowd_volume: int
    game_state: dict | None
    transit_loads: dict[str, int]
    pedestrian_volume: dict[str, int]
    available_routes: list[dict]


_STATIC_PROMPT = """\
You are a crowd safety routing advisor for Lumen Field in Seattle during \
major events (e.g. World Cup 2026).

Given real-time egress threat data, game state, and corridor traffic loads:
1. Select DANGEROUS routes (overwhelmed, high crush risk) → danger_routes
2. Select SAFE routes (recommended alternatives) → safe_routes
3. Write a concise alert_message (1–2 sentences) for transit operators
4. Set severity 1–5 (5 = critical)

CRITICAL: Return route objects ONLY from the available_routes list. \
Copy the full route object (id, label, corridor, path) exactly — \
do not invent or modify coordinates.

If threat is low (≤0.3), return empty danger/safe routes, severity 1, \
and a calm message."""


def _build_agent() -> Agent[EgressContext, RoutingPayload]:
    agent = Agent[EgressContext, RoutingPayload](
        "openai:gpt-4o",
        deps_type=EgressContext,
        output_type=RoutingPayload,
        system_prompt=_STATIC_PROMPT,
        retries=2,
    )

    @agent.system_prompt
    def inject_live_context(ctx: RunContext[EgressContext]) -> str:
        ec = ctx.deps
        parts = [
            f"Egress threat score: {ec.egress_threat_score:.2f} (0–1)",
            f"Estimated crowd volume: {ec.estimated_crowd_volume:,}",
        ]
        if ec.game_state:
            gs = ec.game_state
            parts.append(
                f"Game: Q{gs.get('quarter', '?')} {gs.get('clock', '')} — "
                f"Home {gs.get('home', 0)} vs Away {gs.get('away', 0)}"
            )
            if gs.get("play"):
                parts.append(f"Last play: {str(gs['play'])[:120]}")
        if ec.transit_loads:
            parts.append("Corridor transit loads: " + json.dumps(ec.transit_loads))
        if ec.pedestrian_volume:
            parts.append("Corridor pedestrian volume: " + json.dumps(ec.pedestrian_volume))
        parts.append("\nAvailable routes (select from these ONLY):")
        for r in ec.available_routes:
            parts.append(f"  - {json.dumps(r)}")
        return "\n".join(parts)

    
    def validate_routes(
        ctx: RunContext[EgressContext], output: RoutingPayload
    ) -> RoutingPayload:
        valid_ids = {r.get("id") for r in ctx.deps.available_routes}
        bad = [
            r.get("id")
            for r in output.danger_routes + output.safe_routes
            if r.get("id") not in valid_ids
        ]
        if bad:
            raise ModelRetry(
                f"Route ids {bad} are not in available_routes. "
                "Only use routes from the provided list."
            )
        overlap = {r.get("id") for r in output.danger_routes} & {
            r.get("id") for r in output.safe_routes
        }
        if overlap:
            raise ModelRetry(
                f"Route ids {list(overlap)} appear in both danger and safe. "
                "A route cannot be both dangerous and safe."
            )
        return output

    return agent


_agent: Agent[EgressContext, RoutingPayload] | None = None


def _get_agent() -> Agent[EgressContext, RoutingPayload] | None:
    global _agent
    if _agent is not None:
        return _agent
    if not settings.openai_api_key:
        return None
    try:
        _agent = _build_agent()
        return _agent
    except Exception:
        return None


def _rule_based_fallback(ctx: EgressContext) -> RoutingPayload:
    """Deterministic fallback when OpenAI is unavailable."""
    if ctx.egress_threat_score <= 0.5:
        return RoutingPayload(
            danger_routes=[],
            safe_routes=[],
            alert_message="Crowd conditions stable.",
            severity=1,
        )
    return RoutingPayload(
        danger_routes=ctx.available_routes[:1],
        safe_routes=ctx.available_routes[1:3],
        alert_message="Crowd Crush Risk elevated. Redirect passengers to alternate corridors.",
        severity=4,
    )


async def build_routing_decision_async(context: EgressContext) -> RoutingPayload:
    """Build routing decision using Pydantic AI agent or rule-based fallback."""
    agent = _get_agent()
    if agent is None:
        return _rule_based_fallback(context)
    try:
        result = await agent.run(
            "Analyze the current egress situation and provide routing.",
            deps=context,
        )
        return result.output
    except Exception:
        return _rule_based_fallback(context)


def build_routing_decision(context: EgressContext) -> RoutingPayload:
    """Synchronous wrapper for non-async callers."""
    import asyncio

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None
    if loop and loop.is_running():
        raise RuntimeError(
            "Use build_routing_decision_async when already in an async context"
        )
    return asyncio.run(build_routing_decision_async(context))
