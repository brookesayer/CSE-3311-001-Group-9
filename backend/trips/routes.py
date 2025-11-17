"""Trip management routes with sharing functionality - FIXED IMAGE URLS AND TYPE HANDLING."""
import time
import secrets
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text, or_

from backend.auth.auth_module import get_current_user
from backend.auth.models import User
from backend.db import SessionLocal
from backend.trips.models import TripVisibility

trips_router = APIRouter(prefix="/api/trips", tags=["trips"])

# Pydantic models
class TripCreate(BaseModel):
    name: str
    description: Optional[str] = ''
    visibility: Optional[str] = 'private'

class TripUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    visibility: Optional[str] = None

class TripPlaceAdd(BaseModel):
    place_id: int

class TripResponse(BaseModel):
    id: str
    name: str
    description: str
    visibility: str
    shareToken: Optional[str]
    createdAt: Optional[str] = ''
    updatedAt: Optional[str] = ''
    places: List[dict]
    owner: Optional[dict] = None

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def generate_share_token():
    """Generate a secure random share token."""
    return secrets.token_urlsafe(16)

def format_datetime(dt):
    """Convert datetime to ISO string, handling both datetime objects and strings."""
    if dt is None:
        return ''
    if hasattr(dt, 'isoformat'):
        return dt.isoformat()
    return str(dt) if dt else ''

def resolve_image_url(raw_url, base_url: str) -> str | None:
    """Resolve image URL to absolute URL - matches app.py logic."""
    if not raw_url:
        return None
    
    raw = str(raw_url)
    
    # Already absolute URL
    if raw.startswith(("http://", "https://")):
        return raw
    
    # Clean and resolve relative URL
    cleaned = raw.lstrip("/")
    if cleaned.startswith("static/"):
        cleaned = cleaned[len("static/"):]
    
    return f"{base_url}/static/{cleaned}"

def safe_int(value) -> int | None:
    """Safely convert value to integer."""
    if value is None:
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None

def safe_float(value) -> float | None:
    """Safely convert value to float."""
    if value is None:
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None

def format_place_data(place, base_url: str) -> dict:
    """Format place data with proper image URL resolution and type handling."""
    # Try multiple possible image field names
    image_url = resolve_image_url(
        place.get('image_url') or place.get('imageUrl') or place.get('photo_url'),
        base_url
    )
    
    # Safely handle price_level - convert to int
    price_level = safe_int(place.get('price_level'))
    price_display = None
    if price_level and price_level > 0:
        price_display = '$' * price_level
    
    return {
        'id': place.get('place_id'),
        'name': place.get('name'),
        'category': place.get('category'),
        'description': place.get('description'),
        'address': place.get('address'),
        'city': place.get('city'),
        'lat': safe_float(place.get('lat')),
        'lon': safe_float(place.get('lon')),
        'rating': safe_float(place.get('rating')),
        'priceLevel': price_level,
        'priceDisplay': price_display,
        'imageUrl': image_url,
        'mapsUrl': place.get('maps_url') or place.get('directions_url'),
    }

def check_trip_access(trip_row, current_user_id: Optional[int], require_owner: bool = False):
    """Check if user has access to trip."""
    if trip_row['user_id'] == current_user_id:
        return True
    if require_owner:
        return False
    visibility = trip_row.get('visibility', 'private')
    if visibility in ['public', 'unlisted']:
        return True
    return False

@trips_router.get("/", response_model=List[TripResponse])
async def get_user_trips(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all trips for the current user."""
    try:
        base_url = str(request.base_url).rstrip("/")
        
        trips_query = text("""
            SELECT id, name, description, visibility, share_token, created_at, updated_at
            FROM trips
            WHERE user_id = :user_id
            ORDER BY created_at DESC
        """)
        trips = db.execute(trips_query, {"user_id": current_user.id}).mappings().all()
        
        result = []
        for trip in trips:
            places_query = text("""
                SELECT tp.place_id, tp.position, p.*
                FROM trip_places tp
                JOIN places p ON p.id = tp.place_id
                WHERE tp.trip_id = :trip_id
                ORDER BY tp.position ASC
            """)
            places = db.execute(places_query, {"trip_id": trip['id']}).mappings().all()
            
            places_data = [format_place_data(dict(place), base_url) for place in places]
            
            result.append({
                'id': trip['id'],
                'name': trip['name'],
                'description': trip['description'] or '',
                'visibility': trip.get('visibility', 'private'),
                'shareToken': trip.get('share_token'),
                'createdAt': format_datetime(trip.get('created_at')),
                'updatedAt': format_datetime(trip.get('updated_at')),
                'places': places_data
            })
        
        return result
    except Exception as e:
        print(f"Error fetching trips: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@trips_router.get("/public", response_model=List[TripResponse])
async def get_public_trips(
    request: Request,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get public trips that anyone can see."""
    try:
        base_url = str(request.base_url).rstrip("/")
        
        trips_query = text("""
            SELECT t.id, t.name, t.description, t.visibility, t.share_token, 
                   t.created_at, t.updated_at, t.user_id,
                   u.username, u.name as user_name
            FROM trips t
            JOIN users u ON u.id = t.user_id
            WHERE t.visibility = 'public'
            ORDER BY t.created_at DESC
            LIMIT :limit OFFSET :offset
        """)
        trips = db.execute(trips_query, {"limit": limit, "offset": offset}).mappings().all()
        
        result = []
        for trip in trips:
            places_query = text("""
                SELECT tp.place_id, tp.position, p.*
                FROM trip_places tp
                JOIN places p ON p.id = tp.place_id
                WHERE tp.trip_id = :trip_id
                ORDER BY tp.position ASC
            """)
            places = db.execute(places_query, {"trip_id": trip['id']}).mappings().all()
            
            places_data = [format_place_data(dict(place), base_url) for place in places]
            
            result.append({
                'id': trip['id'],
                'name': trip['name'],
                'description': trip['description'] or '',
                'visibility': trip.get('visibility', 'private'),
                'shareToken': trip.get('share_token'),
                'createdAt': format_datetime(trip.get('created_at')),
                'updatedAt': format_datetime(trip.get('updated_at')),
                'places': places_data,
                'owner': {
                    'username': trip['username'],
                    'name': trip['user_name']
                }
            })
        
        return result
    except Exception as e:
        print(f"Error fetching public trips: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@trips_router.post("/", response_model=TripResponse)
async def create_trip(
    trip_data: TripCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new trip for the current user."""
    try:
        trip_id = f"trip-{current_user.id}-{int(time.time() * 1000)}"
        
        print(f"Creating trip for user {current_user.id} with ID: {trip_id}")
        
        visibility = trip_data.visibility or 'private'
        if visibility not in ['private', 'unlisted', 'public']:
            visibility = 'private'
        
        share_token = generate_share_token() if visibility != 'private' else None
        
        insert_query = text("""
            INSERT INTO trips (id, user_id, name, description, visibility, share_token)
            VALUES (:id, :user_id, :name, :description, :visibility, :share_token)
        """)
        db.execute(insert_query, {
            "id": trip_id,
            "user_id": current_user.id,
            "name": trip_data.name,
            "description": trip_data.description or '',
            "visibility": visibility,
            "share_token": share_token
        })
        db.commit()
        
        print(f"Successfully created trip {trip_id} for user {current_user.id}")
        
        select_query = text("""
            SELECT id, name, description, visibility, share_token, created_at, updated_at
            FROM trips
            WHERE id = :trip_id
        """)
        trip = db.execute(select_query, {"trip_id": trip_id}).mappings().first()
        
        return {
            'id': trip['id'],
            'name': trip['name'],
            'description': trip['description'] or '',
            'visibility': trip.get('visibility', 'private'),
            'shareToken': trip.get('share_token'),
            'createdAt': format_datetime(trip.get('created_at')),
            'updatedAt': format_datetime(trip.get('updated_at')),
            'places': []
        }
    except Exception as e:
        db.rollback()
        print(f"Error creating trip: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@trips_router.get("/shared/{share_token}", response_model=TripResponse)
async def get_trip_by_share_token(
    share_token: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get a trip by its share token (for unlisted/public trips)."""
    try:
        base_url = str(request.base_url).rstrip("/")
        
        trip_query = text("""
            SELECT t.id, t.name, t.description, t.visibility, t.share_token, 
                   t.created_at, t.updated_at, t.user_id,
                   u.username, u.name as user_name
            FROM trips t
            JOIN users u ON u.id = t.user_id
            WHERE t.share_token = :share_token
            AND t.visibility IN ('public', 'unlisted')
        """)
        trip = db.execute(trip_query, {"share_token": share_token}).mappings().first()
        
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found or not shared")
        
        places_query = text("""
            SELECT tp.place_id, tp.position, p.*
            FROM trip_places tp
            JOIN places p ON p.id = tp.place_id
            WHERE tp.trip_id = :trip_id
            ORDER BY tp.position ASC
        """)
        places = db.execute(places_query, {"trip_id": trip['id']}).mappings().all()
        
        places_data = [format_place_data(dict(place), base_url) for place in places]
        
        return {
            'id': trip['id'],
            'name': trip['name'],
            'description': trip['description'] or '',
            'visibility': trip.get('visibility', 'private'),
            'shareToken': trip.get('share_token'),
            'createdAt': format_datetime(trip.get('created_at')),
            'updatedAt': format_datetime(trip.get('updated_at')),
            'places': places_data,
            'owner': {
                'username': trip['username'],
                'name': trip['user_name']
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching shared trip: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@trips_router.get("/{trip_id}", response_model=TripResponse)
async def get_trip(
    trip_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific trip by ID."""
    try:
        base_url = str(request.base_url).rstrip("/")
        
        trip_query = text("""
            SELECT id, name, description, visibility, share_token, created_at, updated_at, user_id
            FROM trips
            WHERE id = :trip_id
        """)
        trip = db.execute(trip_query, {"trip_id": trip_id}).mappings().first()
        
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        
        if not check_trip_access(trip, current_user.id, require_owner=False):
            raise HTTPException(status_code=403, detail="Access denied")
        
        places_query = text("""
            SELECT tp.place_id, tp.position, p.*
            FROM trip_places tp
            JOIN places p ON p.id = tp.place_id
            WHERE tp.trip_id = :trip_id
            ORDER BY tp.position ASC
        """)
        places = db.execute(places_query, {"trip_id": trip_id}).mappings().all()
        
        places_data = [format_place_data(dict(place), base_url) for place in places]
        
        return {
            'id': trip['id'],
            'name': trip['name'],
            'description': trip['description'] or '',
            'visibility': trip.get('visibility', 'private'),
            'shareToken': trip.get('share_token'),
            'createdAt': format_datetime(trip.get('created_at')),
            'updatedAt': format_datetime(trip.get('updated_at')),
            'places': places_data
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching trip: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@trips_router.put("/{trip_id}", response_model=TripResponse)
async def update_trip(
    trip_id: str,
    trip_data: TripUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a trip."""
    try:
        base_url = str(request.base_url).rstrip("/")
        
        check_query = text("SELECT user_id, visibility, share_token FROM trips WHERE id = :trip_id")
        trip = db.execute(check_query, {"trip_id": trip_id}).mappings().first()
        
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        
        trip_user_id = int(trip['user_id']) if trip['user_id'] is not None else None
        current_user_id = int(current_user.id) if current_user.id is not None else None
        
        if trip_user_id != current_user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        updates = []
        params = {"trip_id": trip_id}
        
        if trip_data.name is not None:
            updates.append("name = :name")
            params["name"] = trip_data.name
        
        if trip_data.description is not None:
            updates.append("description = :description")
            params["description"] = trip_data.description
        
        if trip_data.visibility is not None:
            if trip_data.visibility not in ['private', 'unlisted', 'public']:
                raise HTTPException(status_code=400, detail="Invalid visibility value")
            
            updates.append("visibility = :visibility")
            params["visibility"] = trip_data.visibility
            
            if trip_data.visibility == 'private':
                updates.append("share_token = NULL")
            elif not trip['share_token']:
                share_token = generate_share_token()
                updates.append("share_token = :share_token")
                params["share_token"] = share_token
        
        if updates:
            updates.append("updated_at = CURRENT_TIMESTAMP")
            update_query = text(f"""
                UPDATE trips
                SET {', '.join(updates)}
                WHERE id = :trip_id
            """)
            db.execute(update_query, params)
            db.commit()
        
        select_query = text("""
            SELECT id, name, description, visibility, share_token, created_at, updated_at
            FROM trips
            WHERE id = :trip_id
        """)
        updated_trip = db.execute(select_query, {"trip_id": trip_id}).mappings().first()
        
        places_query = text("""
            SELECT tp.place_id, tp.position, p.*
            FROM trip_places tp
            JOIN places p ON p.id = tp.place_id
            WHERE tp.trip_id = :trip_id
            ORDER BY tp.position ASC
        """)
        places = db.execute(places_query, {"trip_id": trip_id}).mappings().all()
        
        places_data = [format_place_data(dict(place), base_url) for place in places]
        
        return {
            'id': updated_trip['id'],
            'name': updated_trip['name'],
            'description': updated_trip['description'] or '',
            'visibility': updated_trip.get('visibility', 'private'),
            'shareToken': updated_trip.get('share_token'),
            'createdAt': format_datetime(updated_trip.get('created_at')),
            'updatedAt': format_datetime(updated_trip.get('updated_at')),
            'places': places_data
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating trip: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@trips_router.delete("/{trip_id}")
async def delete_trip(
    trip_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a trip."""
    try:
        check_query = text("SELECT user_id FROM trips WHERE id = :trip_id")
        trip = db.execute(check_query, {"trip_id": trip_id}).mappings().first()
        
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        
        trip_user_id = int(trip['user_id']) if trip['user_id'] is not None else None
        current_user_id = int(current_user.id) if current_user.id is not None else None
        
        if trip_user_id != current_user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
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
        check_query = text("SELECT user_id FROM trips WHERE id = :trip_id")
        trip = db.execute(check_query, {"trip_id": trip_id}).mappings().first()
        
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        
        trip_user_id = int(trip['user_id']) if trip['user_id'] is not None else None
        current_user_id = int(current_user.id) if current_user.id is not None else None
        
        if trip_user_id != current_user_id:
            raise HTTPException(status_code=403, detail="You don't have permission to add places to this trip")
        
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
        
        place_check = text("SELECT id FROM places WHERE id = :place_id")
        place_exists = db.execute(place_check, {"place_id": place_data.place_id}).first()
        
        if not place_exists:
            raise HTTPException(status_code=404, detail="Place not found")
        
        max_pos_query = text("""
            SELECT COALESCE(MAX(position), -1) as max_pos
            FROM trip_places
            WHERE trip_id = :trip_id
        """)
        max_pos = db.execute(max_pos_query, {"trip_id": trip_id}).scalar()
        
        insert_query = text("""
            INSERT INTO trip_places (trip_id, place_id, position)
            VALUES (:trip_id, :place_id, :position)
        """)
        db.execute(insert_query, {
            "trip_id": trip_id,
            "place_id": place_data.place_id,
            "position": max_pos + 1
        })
        
        update_query = text("""
            UPDATE trips SET updated_at = CURRENT_TIMESTAMP WHERE id = :trip_id
        """)
        db.execute(update_query, {"trip_id": trip_id})
        db.commit()
        
        return {
            "message": "Place added to trip successfully",
            "trip_id": trip_id,
            "place_id": place_data.place_id
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error adding place to trip: {e}")
        import traceback
        traceback.print_exc()
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
        check_query = text("SELECT user_id FROM trips WHERE id = :trip_id")
        trip = db.execute(check_query, {"trip_id": trip_id}).mappings().first()
        
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        
        trip_user_id = int(trip['user_id']) if trip['user_id'] is not None else None
        current_user_id = int(current_user.id) if current_user.id is not None else None
        
        if trip_user_id != current_user_id:
            raise HTTPException(status_code=403, detail="You don't have permission to modify this trip")
        
        delete_query = text("""
            DELETE FROM trip_places 
            WHERE trip_id = :trip_id AND place_id = :place_id
        """)
        result = db.execute(delete_query, {"trip_id": trip_id, "place_id": place_id})
        
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Place not found in trip")
        
        update_query = text("""
            UPDATE trips SET updated_at = CURRENT_TIMESTAMP WHERE id = :trip_id
        """)
        db.execute(update_query, {"trip_id": trip_id})
        db.commit()
        
        return {"message": "Place removed from trip successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error removing place from trip: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))