import os
import psycopg2
import psycopg2.extras # Import this to get dict cursors
from dotenv import load_dotenv
from flask import Flask, g, jsonify, request # Import jsonify and request

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# --- Database Connection Management ---

def get_db():
    """
    Opens a new database connection. We will use a DictCursor to get
    column names, which is much better for creating JSON.
    """
    if 'db' not in g:
        db_url = os.environ.get('DATABASE_URL')
        g.db = psycopg2.connect(db_url, cursor_factory=psycopg2.extras.DictCursor)
    return g.db

@app.teardown_appcontext
def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()

# --- Database Initialization Command (No changes needed here) ---

def init_db():
    db = get_db()
    cursor = db.cursor()
    cursor.execute("""
        DROP TABLE IF EXISTS places;
        CREATE TABLE places (
            id SERIAL PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            location VARCHAR(150) NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cursor.execute(
        "INSERT INTO places (name, location, description) VALUES (%s, %s, %s)",
        ('Eiffel Tower', 'Paris, France', 'Iconic wrought-iron lattice tower.')
    )
    cursor.execute(
        "INSERT INTO places (name, location, description) VALUES (%s, %s, %s)",
        ('Statue of Liberty', 'New York, USA', 'A colossal neoclassical sculpture on Liberty Island.')
    )
    db.commit()
    cursor.close()

@app.cli.command('init-db')
def init_db_command():
    init_db()
    print('Initialized the database.')


# --- NEW API Routes for Mobile App ---

@app.route('/api/places', methods=['GET'])
def get_places():
    """API endpoint to get all places."""
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT id, name, location, description FROM places ORDER BY name;")
    places = cursor.fetchall()
    cursor.close()
    
    # Convert list of DictRow objects to a list of standard dictionaries
    places_list = [dict(place) for place in places]
    
    # jsonify converts our list of dictionaries into a JSON response
    return jsonify(places_list)

@app.route('/api/places', methods=['POST'])
def add_place():
    """API endpoint to add a new place."""
    # Get the JSON data sent from the mobile app
    new_place = request.get_json()

    # Basic validation
    if not new_place or 'name' not in new_place or 'location' not in new_place:
        return jsonify({'error': 'Missing name or location'}), 400

    db = get_db()
    cursor = db.cursor()
    cursor.execute(
        "INSERT INTO places (name, location, description) VALUES (%s, %s, %s) RETURNING id",
        (new_place['name'], new_place['location'], new_place.get('description'))
    )
    new_id = cursor.fetchone()['id']
    db.commit()
    cursor.close()

    # Return a success message and the ID of the new place
    return jsonify({'message': 'Place added successfully', 'id': new_id}), 201

