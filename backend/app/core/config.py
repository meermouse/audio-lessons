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

    # LLM Configuration
    OPENAI_API_KEY: str | None = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    LLM_SYSTEM_PROMPT: str = """You are an expert educational content creator. Your task is to transform raw PDF text into a structured, engaging lesson plan that is suitable for audio narration. 

Structure your output as a clear, organized lesson with:
1. An engaging introduction
2. Main learning points (clear and concise)
3. Key definitions and explanations
4. Practical examples or applications
5. A brief summary and conclusion

Keep the language clear and conversational, as it will be read aloud. Avoid complex formatting."""

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
