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

class PlaceCreate(PlaceBase):
    pass

class PlaceUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None

class PlaceRead(PlaceBase):
    id: int

    class Config:
        from_attributes = True  # Pydantic v2 equivalent of orm_mode
        orm_mode = True  # For Pydantic v1 compatibility