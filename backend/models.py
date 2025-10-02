# models.py
from sqlalchemy import Column, Integer, Text, Float, UniqueConstraint
from db import Base

class Place(Base):
    __tablename__ = "places"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, nullable=False)
    category = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    address = Column(Text, nullable=True)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)

    __table_args__ = (
        UniqueConstraint("name", "address", name="uniq_place"),
    )
