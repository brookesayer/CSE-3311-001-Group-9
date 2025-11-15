# init_db.py
from backend.db import Base, engine
from backend.models import User, Trip, TripItem, Place, Category, City

print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("✅ Database tables created successfully!")