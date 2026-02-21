from __future__ import annotations

from sqlalchemy import JSON, DateTime, Float, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class TransitCache(Base):
    __tablename__ = "transit_cache"
    __table_args__ = (
        UniqueConstraint(
            "scenario_id",
            "minute",
            "location_id",
            name="uq_transit_cache_scenario_minute_location",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    scenario_id: Mapped[str] = mapped_column(String(64), index=True)
    minute: Mapped[int] = mapped_column(Integer, index=True)
    location_id: Mapped[str] = mapped_column(String(128), index=True)
    pedestrian_volume: Mapped[int] = mapped_column(Integer, default=0)
    transit_load: Mapped[int] = mapped_column(Integer, default=0)
    source_timestamp: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Predictions(Base):
    __tablename__ = "predictions"
    __table_args__ = (
        UniqueConstraint("scenario_id", "minute", name="uq_predictions_scenario_minute"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    scenario_id: Mapped[str] = mapped_column(String(64), index=True)
    minute: Mapped[int] = mapped_column(Integer, index=True)
    egress_threat_score: Mapped[float] = mapped_column(Float, default=0.0)
    estimated_crowd_volume: Mapped[int] = mapped_column(Integer, default=0)
    game_state: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class RoutingDecisions(Base):
    __tablename__ = "routing_decisions"
    __table_args__ = (
        UniqueConstraint("scenario_id", "minute", name="uq_routing_scenario_minute"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    scenario_id: Mapped[str] = mapped_column(String(64), index=True)
    minute: Mapped[int] = mapped_column(Integer, index=True)
    danger_routes: Mapped[list[dict] | None] = mapped_column(JSON, nullable=True)
    safe_routes: Mapped[list[dict] | None] = mapped_column(JSON, nullable=True)
    alert_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    severity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
