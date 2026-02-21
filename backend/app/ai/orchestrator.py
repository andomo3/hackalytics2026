from __future__ import annotations

from dataclasses import dataclass

from app.ai.schemas import RoutingPayload


@dataclass
class EgressContext:
    egress_threat_score: float
    estimated_crowd_volume: int
    game_state: dict | None
    transit_loads: dict
    available_routes: list[dict]


def build_routing_decision(context: EgressContext) -> RoutingPayload:
    if context.egress_threat_score <= 0.5:
        return RoutingPayload(
            danger_routes=[],
            safe_routes=[],
            alert_message="Crowd conditions stable.",
            severity=1,
        )

    return RoutingPayload(
        danger_routes=context.available_routes[:1],
        safe_routes=context.available_routes[1:3],
        alert_message=(
            "Crowd Crush Risk elevated. Redirect passengers to alternate corridors."
        ),
        severity=4,
    )
