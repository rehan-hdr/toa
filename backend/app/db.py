"""
Database initialization and session management
"""
from sqlmodel import SQLModel, create_engine, Session
from pathlib import Path

# Database file path
DB_PATH = Path(__file__).parent.parent / "nexus.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

# Create engine
engine = create_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL debugging
    connect_args={"check_same_thread": False}  # Needed for SQLite
)


def init_db():
    """Initialize database tables"""
    SQLModel.metadata.create_all(engine)
    print(f"✅ Database initialized at: {DB_PATH}")


def get_session():
    """Get database session"""
    with Session(engine) as session:
        yield session
