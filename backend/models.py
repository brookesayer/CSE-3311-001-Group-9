# models.py
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Text,
    DateTime,
    ForeignKey,
    Boolean,
)
from sqlalchemy.orm import relationship
from datetime import datetime
from .db import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    slug = Column(String, nullable=False, unique=True)

    places = relationship("Place", back_populates="category_ref", lazy="selectin")


class City(Base):
    __tablename__ = "cities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    state = Column(String, nullable=True)
    slug = Column(String, nullable=False, unique=True)

    places = relationship("Place", back_populates="city_ref", lazy="selectin")


class Place(Base):
    __tablename__ = "places"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)

    # Keep legacy free-text columns for compatibility
    category = Column(String)  # legacy text category
    city = Column(String)      # legacy text city/region

    description = Column(Text)
    address = Column(String)
    lat = Column(Float)
    lon = Column(Float)
    rating = Column(Float)  # 0..5

    # Optional FKs to normalized lookup tables
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    city_id = Column(Integer, ForeignKey("cities.id"), nullable=True)

    # Extra fields used by the API/UI
    price_level = Column(Integer, nullable=True)
    image_url = Column(Text, nullable=True)
    maps_url = Column(Text, nullable=True)

    category_ref = relationship("Category", back_populates="places", lazy="joined")
    city_ref = relationship("City", back_populates="places", lazy="joined")


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    places_data = Column(Text, nullable=True)  # JSON string storing place objects
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to User (you'll need to add this to your User model in auth/models.py)
    items = relationship("TripItem", back_populates="trip", cascade="all,delete-orphan")


class TripItem(Base):
    __tablename__ = "trip_items"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    place_id = Column(Integer, ForeignKey("places.id", ondelete="CASCADE"), nullable=False)
    position = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    added_at = Column(DateTime, default=datetime.utcnow)

    trip = relationship("Trip", back_populates="items")
    place = relationship("Place")