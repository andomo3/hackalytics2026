from __future__ import annotations

import json
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
    backend_cors_origins: str = "http://localhost:5173"

    @property
    def cors_origins(self) -> list[str]:
        raw_value = self.backend_cors_origins.strip()
        if not raw_value:
            return ["http://localhost:5173"]

        if raw_value.startswith("["):
            try:
                decoded = json.loads(raw_value)
                if isinstance(decoded, list):
                    return [str(origin).strip() for origin in decoded if str(origin).strip()]
            except json.JSONDecodeError:
                pass

        return [origin.strip() for origin in raw_value.split(",") if origin.strip()]


settings = Settings()
