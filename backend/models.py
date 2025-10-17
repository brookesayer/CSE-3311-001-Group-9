# models.py
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Text,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship
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
    price_level = Column(Integer, nullable=True)  # 1..4 typical; nullable if unknown
    image_url = Column(Text, nullable=True)
    maps_url = Column(Text, nullable=True)

    category_ref = relationship("Category", back_populates="places", lazy="joined")
    city_ref = relationship("City", back_populates="places", lazy="joined")


class Trip(Base):
    __tablename__ = "trips"

    # Using text UUIDs for portability across SQLite/Postgres
    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)

    items = relationship("TripItem", back_populates="trip", cascade="all,delete-orphan")


class TripItem(Base):
    __tablename__ = "trip_items"

    id = Column(String, primary_key=True)  # UUID
    trip_id = Column(String, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    place_id = Column(Integer, ForeignKey("places.id", ondelete="CASCADE"), nullable=False)
    position = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    added_at = Column(DateTime, nullable=True)

    trip = relationship("Trip", back_populates="items")
    place = relationship("Place")
