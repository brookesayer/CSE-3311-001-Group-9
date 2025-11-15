import sqlite3
import os
from pathlib import Path

# Find the database - it's in the parent directory of backend/
script_dir = Path(__file__).resolve().parent
db_path = script_dir / 'dev.db'

if not db_path.exists():
    print(f"❌ Database not found at: {db_path}")
    print("\nSearching for dev.db...")
    # Search in common locations
    for possible_path in [
        script_dir / 'backend' / 'dev.db',
        script_dir.parent / 'dev.db',
    ]:
        if possible_path.exists():
            db_path = possible_path
            print(f"✅ Found database at: {db_path}")
            break
    else:
        print("Could not find dev.db anywhere!")
        exit(1)

print(f"📁 Using database: {db_path}")

# Connect to database
conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

# First, check current schema
print("\n📋 Current trips table schema:")
try:
    cursor.execute("PRAGMA table_info(trips)")
    columns = cursor.fetchall()
    for col in columns:
        print(f"  - {col[1]} ({col[2]})")
    
    existing_columns = [col[1] for col in columns]
except sqlite3.OperationalError:
    print("  ⚠️  Trips table doesn't exist yet")
    existing_columns = []

# Add visibility column if it doesn't exist
if 'visibility' not in existing_columns:
    try:
        cursor.execute("ALTER TABLE trips ADD COLUMN visibility VARCHAR(20) DEFAULT 'private' NOT NULL")
        print("\n✅ Added 'visibility' column")
    except sqlite3.OperationalError as e:
        print(f"\n❌ Error adding visibility column: {e}")
else:
    print("\n⚠️  'visibility' column already exists")

# Add share_token column if it doesn't exist
if 'share_token' not in existing_columns:
    try:
        cursor.execute("ALTER TABLE trips ADD COLUMN share_token VARCHAR(255)")
        print("✅ Added 'share_token' column")
    except sqlite3.OperationalError as e:
        print(f"❌ Error adding share_token column: {e}")
else:
    print("⚠️  'share_token' column already exists")

# Create indexes
try:
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_trips_share_token ON trips(share_token)")
    print("✅ Created share_token index")
except sqlite3.OperationalError as e:
    print(f"⚠️  Index creation: {e}")

try:
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_trips_visibility ON trips(visibility)")
    print("✅ Created visibility index")
except sqlite3.OperationalError as e:
    print(f"⚠️  Index creation: {e}")

# Commit changes
conn.commit()

# Show final schema
print("\n📋 Updated trips table schema:")
cursor.execute("PRAGMA table_info(trips)")
columns = cursor.fetchall()
for col in columns:
    print(f"  - {col[1]} ({col[2]})")

conn.close()

print("\n🎉 Migration complete!")
print("⚠️  IMPORTANT: Restart your backend server for changes to take effect!")