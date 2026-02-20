from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:1234@localhost:5432/raj_dev"

    class Config:
        env_file = ".env"

settings = Settings()
