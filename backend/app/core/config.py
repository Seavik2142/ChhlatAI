from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEV_JWT_SECRET = "change-me-in-production"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "OmniChat CRM"
    environment: str = "development"  # development | test | production
    log_level: str = "INFO"
    log_json: bool = False  # one JSON object per line — turn on in production for log shipping

    # PostgreSQL. In production point this at PgBouncer (transaction pooling) when running many API workers.
    database_url: str = "postgresql+psycopg://chhlat:chhlat@localhost:5432/chhlatai"
    db_pool_size: int = 10
    db_max_overflow: int = 20
    db_pool_timeout: int = 30
    db_pool_recycle: int = 1800
    db_statement_timeout_ms: int = 15_000

    # Redis: task queue broker, realtime fan-out between API servers, rate limits.
    # Empty = single-process mode (tasks run inline, events stay in-process) — fine for local development only.
    redis_url: str = ""

    jwt_secret: str = DEV_JWT_SECRET
    jwt_expire_minutes: int = 60 * 24 * 7
    # Fernet key that encrypts channel tokens and bank keys at rest.
    # Generate: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    encryption_key: str = ""

    cors_origins: list[str] = ["http://localhost:5173"]
    public_base_url: str = "http://localhost:8000"

    # File storage: "local" (dev) or "s3" (AWS S3, Cloudflare R2, MinIO …) so every server sees the same files.
    storage_backend: str = "local"
    upload_dir: str = "uploads"
    s3_bucket: str = ""
    s3_endpoint_url: str = ""
    s3_region: str = "auto"
    s3_public_base_url: str = ""  # CDN / public bucket URL that serves uploaded files

    login_rate_limit_per_minute: int = 10
    webhook_rate_limit_per_minute: int = 600

    # AI — CodeCraft API (OpenAI-compatible gateway: https://codecraftapi.com/docs)
    codecraft_api_key: str = ""
    codecraft_base_url: str = "https://codecraftapi.com/v1"
    codecraft_default_model: str = "claude-opus-4.8"

    # AI — Anthropic / Claude direct fallback
    anthropic_api_key: str = ""
    ai_model: str = "claude-opus-5-5"
    gemini_api_key: str = ""
    openai_api_key: str = ""

    meta_verify_token: str = "omnichat-verify"
    meta_app_id: str = ""  # Meta App ID for Facebook & Instagram OAuth 2.0
    meta_app_secret: str = ""  # Meta App Secret for OAuth token exchange & webhook signatures
    meta_redirect_uri: str = ""  # Optional custom OAuth callback URL (defaults to frontend /owner/settings)
    facebook_client_id: str = ""
    facebook_client_secret: str = ""
    facebook_redirect_uri: str = ""
    tiktok_client_key: str = ""  # TikTok Open Platform Client Key
    tiktok_client_secret: str = ""  # TikTok Client Secret
    tiktok_redirect_uri: str = ""
    telegram_api_id: str = ""  # Telegram App api_id from my.telegram.org for normal user accounts
    telegram_api_hash: str = ""  # Telegram App api_hash secret from my.telegram.org
    telegram_bot_token: str = ""  # Platform Super Admin Bot Token (@chhlatAI_bot)
    telegram_bot_username: str = ""  # Platform Super Admin Bot username (@chhlatAI_bot)
    telegram_admin_chat_id: str = ""  # Optional predefined Super Admin Telegram Chat ID
    telegram_redirect_uri: str = ""
    frontend_base_url: str = "http://localhost:5173"

    @property
    def fb_client_id(self) -> str:
        return self.facebook_client_id or self.meta_app_id

    @property
    def fb_client_secret(self) -> str:
        return self.facebook_client_secret or self.meta_app_secret

    @property
    def fb_redirect_uri(self) -> str:
        return (
            self.facebook_redirect_uri
            or self.meta_redirect_uri
            or f"{self.public_base_url}/api/auth/facebook/callback"
        )

    @property
    def ig_redirect_uri(self) -> str:
        return f"{self.public_base_url}/api/auth/instagram/callback"

    @property
    def tt_client_key(self) -> str:
        return self.tiktok_client_key

    @property
    def tt_client_secret(self) -> str:
        return self.tiktok_client_secret

    @property
    def tt_redirect_uri(self) -> str:
        return self.tiktok_redirect_uri or f"{self.public_base_url}/api/auth/tiktok/callback"

    @property
    def tg_redirect_uri(self) -> str:
        return self.telegram_redirect_uri or f"{self.public_base_url}/api/auth/telegram/callback"

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @model_validator(mode="after")
    def _production_requirements(self) -> "Settings":
        if self.is_production:
            missing = [name for name, bad in [
                ("JWT_SECRET", self.jwt_secret == DEV_JWT_SECRET or len(self.jwt_secret) < 32),
                ("ENCRYPTION_KEY", not self.encryption_key),
                ("REDIS_URL", not self.redis_url),
                ("META_APP_SECRET", not self.meta_app_secret),
            ] if bad]
            if missing:
                raise ValueError(f"Production requires: {', '.join(missing)}")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
