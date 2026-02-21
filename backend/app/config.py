from __future__ import annotations

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "SafeTransit API"
    openai_api_key: str | None = None
    socrata_app_token: str | None = None
    nfl_data_dir: str = "./backend/data/nfl_csvs"
    database_url: str = "sqlite+aiosqlite:///./safetransit.db"
    backend_cors_origins: list[str] = ["http://localhost:5173"]

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def parse_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, list):
            return value
        return [item.strip() for item in value.split(",") if item.strip()]


settings = Settings()
