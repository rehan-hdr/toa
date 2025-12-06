from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Nexus Backend"
    API_V1_STR: str = "/api"
    
    # LLM
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    LLM_MODEL: str = "llama3.2"
    
    # Database
    SQLITE_URL: str = "sqlite:///./nexus.db"
    CHROMA_PERSIST_DIR: str = "./chroma_data"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    class Config:
        case_sensitive = True

settings = Settings()
