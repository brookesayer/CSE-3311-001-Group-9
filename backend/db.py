# db.py
import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

# Default DB path in the project home directory (override via DATABASE_URL)
_project_root = Path(__file__).resolve().parent.parent
_project_db_path = _project_root / "dev.db"
_default_sqlite_url = f"sqlite:///{_project_db_path.as_posix()}"

def _resolve_db_url() -> str:
    env_url = os.getenv("DATABASE_URL", "")
    # If a docker-only URL is present (host 'db') but we're not explicitly opting in,
    # prefer the project-root SQLite to avoid connection errors.
    if env_url and ("postgres" in env_url) and ("@db:" in env_url) and os.getenv("USE_DOCKER_DB", "0") != "1":
        return _default_sqlite_url
    return env_url or _default_sqlite_url

DATABASE_URL = _resolve_db_url()
print("Using database at:", DATABASE_URL)

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    # wait up to 30s for a lock instead of erroring immediately
    connect_args = {"check_same_thread": False, "timeout": 30}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

# Turn on WAL and busy timeout at the SQLite level
if DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_conn, _):
        cur = dbapi_conn.cursor()
        cur.execute("PRAGMA journal_mode=WAL;")
        cur.execute("PRAGMA busy_timeout=30000;")  # 30s
        cur.execute("PRAGMA synchronous=NORMAL;")
        cur.close()

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
 
