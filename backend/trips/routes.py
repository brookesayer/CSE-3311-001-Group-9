"""Trip management routes."""
import time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.auth.auth_module import get_current_user
from backend.auth.models import User
from backend.db import SessionLocal

trips_router = APIRouter(prefix="/api/trips", tags=["trips"])

# Pydantic models
class TripCreate(BaseModel):
    name: str
    description: Optional[str] = ''

class TripUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class TripPlaceAdd(BaseModel):
    place_id: int

class TripResponse(BaseModel):
    id: str
    name: str
    description: str
    createdAt: str
    updatedAt: Optional[str] = None
    places: List[dict]

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@trips_router.get("/", response_model=List[TripResponse])
async def get_user_trips(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all trips for the current user."""
    try:
        # Get trips for user
        trips_query = text("""
            SELECT id, name, description, created_at, updated_at
            FROM trips
            WHERE user_id = :user_id
            ORDER BY created_at DESC
        """)
        trips = db.execute(trips_query, {"user_id": current_user.id}).mappings().all()
        
        result = []
        for trip in trips:
            # Get places for this trip
            places_query = text("""
                SELECT tp.place_id, tp.position, p.*
                FROM trip_places tp
                JOIN places p ON p.id = tp.place_id
                WHERE tp.trip_id = :trip_id
                ORDER BY tp.position ASC
            """)
            places = db.execute(places_query, {"trip_id": trip['id']}).mappings().all()
            
            # Format places data
            places_data = []
            for place in places:
                places_data.append({
                    'id': place['place_id'],
                    'name': place.get('name'),
                    'category': place.get('category'),
                    'description': place.get('description'),
                    'address': place.get('address'),
                    'city': place.get('city'),
                    'lat': place.get('lat'),
                    'lon': place.get('lon'),
                    'rating': place.get('rating'),
                    'priceLevel': place.get('price_level'),
                    'imageUrl': place.get('image_url'),
                })
            
            result.append({
                'id': trip['id'],
                'name': trip['name'],
                'description': trip['description'] or '',
                'createdAt': trip['created_at'].isoformat() if trip.get('created_at') else None,
                'updatedAt': trip['updated_at'].isoformat() if trip.get('updated_at') else None,
                'places': places_data
            })
        
        return result
    except Exception as e:
        print(f"Error fetching trips: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@trips_router.post("/", response_model=TripResponse)
async def create_trip(
    trip_data: TripCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new trip for the current user."""
    try:
        # Generate unique trip ID
        trip_id = f"trip-{current_user.id}-{int(time.time() * 1000)}"
        
        # Insert trip
        insert_query = text("""
            INSERT INTO trips (id, user_id, name, description)
            VALUES (:id, :user_id, :name, :description)
        """)
        db.execute(insert_query, {
            "id": trip_id,
            "user_id": current_user.id,
            "name": trip_data.name,
            "description": trip_data.description or ''
        })
        db.commit()
        
        # Fetch created trip
        select_query = text("""
            SELECT id, name, description, created_at, updated_at
            FROM trips
            WHERE id = :trip_id
        """)
        trip = db.execute(select_query, {"trip_id": trip_id}).mappings().first()
        
        return {
            'id': trip['id'],
            'name': trip['name'],
            'description': trip['description'] or '',
            'createdAt': trip['created_at'].isoformat() if trip.get('created_at') else None,
            'updatedAt': trip['updated_at'].isoformat() if trip.get('updated_at') else None,
            'places': []
        }
    except Exception as e:
        db.rollback()
        print(f"Error creating trip: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@trips_router.get("/{trip_id}", response_model=TripResponse)
async def get_trip(
    trip_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific trip by ID."""
    try:
        # Get trip and verify ownership
        trip_query = text("""
            SELECT id, name, description, created_at, updated_at, user_id
            FROM trips
            WHERE id = :trip_id
        """)
        trip = db.execute(trip_query, {"trip_id": trip_id}).mappings().first()
        
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        
        if trip['user_id'] != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get places
        places_query = text("""
            SELECT tp.place_id, tp.position, p.*
            FROM trip_places tp
            JOIN places p ON p.id = tp.place_id
            WHERE tp.trip_id = :trip_id
            ORDER BY tp.position ASC
        """)
        places = db.execute(places_query, {"trip_id": trip_id}).mappings().all()
        
        places_data = [{
            'id': p['place_id'],
            'name': p.get('name'),
            'category': p.get('category'),
            'description': p.get('description'),
            'address': p.get('address'),
            'city': p.get('city'),
            'lat': p.get('lat'),
            'lon': p.get('lon'),
            'rating': p.get('rating'),
            'priceLevel': p.get('price_level'),
            'imageUrl': p.get('image_url'),
        } for p in places]
        
        return {
            'id': trip['id'],
            'name': trip['name'],
            'description': trip['description'] or '',
            'createdAt': trip['created_at'].isoformat() if trip.get('created_at') else None,
            'updatedAt': trip['updated_at'].isoformat() if trip.get('updated_at') else None,
            'places': places_data
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching trip: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@trips_router.put("/{trip_id}", response_model=TripResponse)
async def update_trip(
    trip_id: str,
    trip_data: TripUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a trip."""
    try:
        # Verify ownership
        check_query = text("SELECT user_id FROM trips WHERE id = :trip_id")
        trip = db.execute(check_query, {"trip_id": trip_id}).mappings().first()
        
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        
        if trip['user_id'] != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Build update query
        updates = []
        params = {"trip_id": trip_id}
        
        if trip_data.name is not None:
            updates.append("name = :name")
            params["name"] = trip_data.name
        
        if trip_data.description is not None:
            updates.append("description = :description")
            params["description"] = trip_data.description
        
        if updates:
            update_query = text(f"""
                UPDATE trips
                SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP
                WHERE id = :trip_id
            """)
            db.execute(update_query, params)
            db.commit()
        
        # Return updated trip
        return await get_trip(trip_id, current_user, db)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating trip: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@trips_router.delete("/{trip_id}")
async def delete_trip(
    trip_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a trip."""
    try:
        # Verify ownership
        check_query = text("SELECT user_id FROM trips WHERE id = :trip_id")
        trip = db.execute(check_query, {"trip_id": trip_id}).mappings().first()
        
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        
        if trip['user_id'] != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Delete trip (places will be cascade deleted)
        delete_query = text("DELETE FROM trips WHERE id = :trip_id")
        db.execute(delete_query, {"trip_id": trip_id})
        db.commit()
        
        return {"message": "Trip deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error deleting trip: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@trips_router.post("/{trip_id}/places")
async def add_place_to_trip(
    trip_id: str,
    place_data: TripPlaceAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a place to a trip."""
    try:
        # Verify ownership
        check_query = text("SELECT user_id FROM trips WHERE id = :trip_id")
        trip = db.execute(check_query, {"trip_id": trip_id}).mappings().first()
        
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        
        if trip['user_id'] != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Check if place already exists in trip
        exists_query = text("""
            SELECT 1 FROM trip_places 
            WHERE trip_id = :trip_id AND place_id = :place_id
        """)
        exists = db.execute(exists_query, {
            "trip_id": trip_id,
            "place_id": place_data.place_id
        }).first()
        
        if exists:
            raise HTTPException(status_code=409, detail="Place already in trip")
        
        # Get max position
        max_pos_query = text("""
            SELECT COALESCE(MAX(position), -1) as max_pos
            FROM trip_places
            WHERE trip_id = :trip_id
        """)
        max_pos = db.execute(max_pos_query, {"trip_id": trip_id}).scalar()
        
        # Insert place
        insert_query = text("""
            INSERT INTO trip_places (trip_id, place_id, position)
            VALUES (:trip_id, :place_id, :position)
        """)
        db.execute(insert_query, {
            "trip_id": trip_id,
            "place_id": place_data.place_id,
            "position": max_pos + 1
        })
        
        # Update trip's updated_at
        update_query = text("""
            UPDATE trips SET updated_at = CURRENT_TIMESTAMP WHERE id = :trip_id
        """)
        db.execute(update_query, {"trip_id": trip_id})
        db.commit()
        
        return {"message": "Place added to trip", "trip_id": trip_id, "place_id": place_data.place_id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error adding place to trip: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@trips_router.delete("/{trip_id}/places/{place_id}")
async def remove_place_from_trip(
    trip_id: str,
    place_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a place from a trip."""
    try:
        # Verify ownership
        check_query = text("SELECT user_id FROM trips WHERE id = :trip_id")
        trip = db.execute(check_query, {"trip_id": trip_id}).mappings().first()
        
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        
        if trip['user_id'] != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Delete place from trip
        delete_query = text("""
            DELETE FROM trip_places 
            WHERE trip_id = :trip_id AND place_id = :place_id
        """)
        result = db.execute(delete_query, {"trip_id": trip_id, "place_id": place_id})
        
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Place not found in trip")
        
        # Update trip's updated_at
        update_query = text("""
            UPDATE trips SET updated_at = CURRENT_TIMESTAMP WHERE id = :trip_id
        """)
        db.execute(update_query, {"trip_id": trip_id})
        db.commit()
        
        return {"message": "Place removed from trip"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error removing place from trip: {e}")
        raise HTTPException(status_code=500, detail=str(e))