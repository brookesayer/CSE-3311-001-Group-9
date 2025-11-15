"""Trip models for user-specific trip planning with sharing."""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.db import Base
import enum

# Association table for many-to-many relationship between trips and places
trip_places = Table(
    'trip_places',
    Base.metadata,
    Column('trip_id', String, ForeignKey('trips.id', ondelete='CASCADE'), primary_key=True),
    Column('place_id', Integer, primary_key=True),
    Column('position', Integer, default=0)  # For ordering places in trip
)

class TripVisibility(str, enum.Enum):
    """Trip visibility options."""
    PRIVATE = "private"  # Only owner can see
    UNLISTED = "unlisted"  # Anyone with link can see
    PUBLIC = "public"  # Anyone can see, listed publicly

class Trip(Base):
    """Trip model for storing user trip plans."""
    __tablename__ = "trips"
    
    id = Column(String, primary_key=True)  # Format: "trip-{user_id}-{timestamp}"
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(String, default='')
    visibility = Column(Enum(TripVisibility), default=TripVisibility.PRIVATE, nullable=False)
    share_token = Column(String, unique=True, index=True, nullable=True)  # For unlisted/public sharing
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship to user - using string to avoid circular import
    user = relationship("User", back_populates="trips")
    
    def to_dict(self, include_places=False):
        """Convert trip to dictionary format."""
        result = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'visibility': self.visibility.value if isinstance(self.visibility, TripVisibility) else self.visibility,
            'shareToken': self.share_token,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_places:
            result['places'] = []  # Places will be populated separately
        return result