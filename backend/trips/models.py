"""Trip models for user-specific trip planning."""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.db import Base

# Association table for many-to-many relationship between trips and places
trip_places = Table(
    'trip_places',
    Base.metadata,
    Column('trip_id', String, ForeignKey('trips.id', ondelete='CASCADE'), primary_key=True),
    Column('place_id', Integer, primary_key=True),
    Column('position', Integer, default=0)  # For ordering places in trip
)

class Trip(Base):
    """Trip model for storing user trip plans."""
    __tablename__ = "trips"
    
    id = Column(String, primary_key=True)  # Format: "trip-{user_id}-{timestamp}"
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(String, default='')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship to user - using string to avoid circular import
    user = relationship("User", back_populates="trips")
    
    def to_dict(self):
        """Convert trip to dictionary format."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
            'places': []  # Places will be populated separately
        }