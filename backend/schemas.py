# schemas.py
from pydantic import BaseModel, Field
from typing import Optional

class PlaceBase(BaseModel):
    name: str = Field(..., min_length=1)
    category: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None

    # NEW
    price_level: Optional[int] = None
    image_url: Optional[str] = None
    maps_url: Optional[str] = None

class PlaceCreate(PlaceBase):
    pass

class PlaceUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    # NEW
    price_level: Optional[int] = None
    image_url: Optional[str] = None
    maps_url: Optional[str] = None

class PlaceRead(PlaceBase):
    id: int
    class Config:
        from_attributes = True
        orm_mode = True
        allow_population_by_field_name = True