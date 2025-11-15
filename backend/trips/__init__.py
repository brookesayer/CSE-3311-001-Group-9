"""Trips module for user-specific trip planning."""
from .models import Trip
from .routes import trips_router

__all__ = ['trips_router', 'Trip']