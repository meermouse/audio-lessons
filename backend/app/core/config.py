from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_ENV: str = "dev"
    BASE_URL: str = "http://localhost:8000"

    LOCAL_STORAGE_DIR: str = "./data"

    REDIS_URL: str = "redis://redis:6379/0"

    STORAGE_BACKEND: str = "local"  # local|s3
    S3_BUCKET: str | None = None
    S3_REGION: str | None = None
    S3_PREFIX: str = "audio-lessons/"

    AWS_ACCESS_KEY_ID: str | None = None
    AWS_SECRET_ACCESS_KEY: str | None = None

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
