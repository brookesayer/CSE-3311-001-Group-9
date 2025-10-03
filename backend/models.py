# models.py
from sqlalchemy import Column, Integer, String, Float, Text
from db import Base

class Place(Base):
    __tablename__ = "places"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String)
    description = Column(Text)
    address = Column(String)
    lat = Column(Float)
    lon = Column(Float)

    # NEW FIELDS
    price_level = Column(Integer, nullable=True)  # 0..4 like Google; nullable if unknown
    image_url   = Column(Text, nullable=True)
    maps_url    = Column(Text, nullable=True)
