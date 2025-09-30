# db.py
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dev.db")
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
 