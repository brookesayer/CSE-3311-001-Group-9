import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
from flask import Flask, g, jsonify
from flask_cors import CORS

# Load environment variables from .env
load_dotenv()

app = Flask(__name__)
CORS(app)

# --- Database Connection Management ---

def get_db():
    """
    Opens a new database connection if there isn't one for the current app context.
    """
    if "db" not in g:
        db_url = os.environ.get("DATABASE_URL")
        if not db_url:
            raise RuntimeError("DATABASE_URL is not set")
        g.db = psycopg2.connect(db_url)
    return g.db

@app.teardown_appcontext
def close_db(e=None):
    """Closes the database connection at the end of the request."""
    db = g.pop("db", None)
    if db is not None:
        db.close()

# --- Idempotent Database Initialization (Race Condition Safe) ---

def init_db():
    """
    Creates the 'places' table if it doesn't exist and seeds sample rows if empty.
    This is guarded by a Postgres advisory lock to prevent race conditions.
    """
    db = get_db()
    # 'with db' handles transactions (commit/rollback) automatically
    with db, db.cursor() as cursor:
        # 1. Acquire a lock. Any other worker trying to get this lock will wait.
        cursor.execute("SELECT pg_advisory_lock(1);")

        # 2. Create the table only if it's missing. This is idempotent.
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS places (
                id SERIAL PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                location VARCHAR(150) NOT NULL,
                description TEXT
            );
            """
        )

        # 3. Seed the table only if it is completely empty.
        cursor.execute("SELECT COUNT(*) FROM places;")
        (count,) = cursor.fetchone()
        if count == 0:
            print("Seeding the 'places' table with sample data.")
            cursor.execute(
                "INSERT INTO places (name, location, description) VALUES (%s, %s, %s)",
                ("Eiffel Tower", "Paris, France", "Iconic wrought-iron lattice tower."),
            )
            cursor.execute(
                "INSERT INTO places (name, location, description) VALUES (%s, %s, %s)",
                ("Statue of Liberty", "New York, USA", "A colossal neoclassical sculpture."),
            )
        else:
            print("Table 'places' already exists and has data.")

        # 4. Release the lock so other workers can proceed if they were waiting.
        cursor.execute("SELECT pg_advisory_unlock(1);")


# Run the safe initialization once when the application starts.
with app.app_context():
    init_db()


# --- API Routes ---

@app.route("/api/places")
def get_places():
    """Fetches all places from the database."""
    db = get_db()
    with db.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
        cursor.execute("SELECT * FROM places ORDER BY name;")
        places = cursor.fetchall()
    return jsonify(places)

@app.route("/")
def index():
    return "Backend is running!"

# This part is only for local development (e.g., `python app.py`)
# It is NOT used by Gunicorn in Docker.
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)    


### What I Changed to Fix the Errors

#1.  **No More `DROP TABLE`:** The `init_db` function now uses `CREATE TABLE IF NOT EXISTS`. This is much safer and prevents the "DuplicateTable" error.
#2.  **Conditional Seeding:** It now checks if the table is empty (`SELECT COUNT(*)`) before trying to `INSERT` the sample data. This prevents duplicate data on restarts.
#3.  **Race Condition Lock:** The most important change is the **PostgreSQL advisory lock**. Think of it as a "talking stick." The first worker process that starts grabs the lock. Any other workers that start at the same time have to wait until the first one is finished and releases the lock. This completely prevents them from trying to create the table at the same time.

### What to Do Next

#1.  **Stop your running containers:**
   # ```bash
   # docker compose down
    #```
#2.  **Force a clean rebuild of the backend** to ensure it uses your new `app.py`:
   # ```bash
   # docker compose build --no-cache backend
   # ```
#3.  **Start everything up:**
#    ```bash
#    docker compose up
    
