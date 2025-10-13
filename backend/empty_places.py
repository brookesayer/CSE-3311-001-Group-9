import sqlite3

def empty_places(db_path="dfw_places.db"):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Delete all rows
    cur.execute("DELETE FROM places;")

    # Try resetting autoincrement (if AUTOINCREMENT is used)
    try:
        cur.execute("DELETE FROM sqlite_sequence WHERE name='places';")
    except sqlite3.OperationalError:
        print("No sqlite_sequence table found (probably no AUTOINCREMENT). Skipping reset.")

    conn.commit()
    conn.close()
    print("✅ places table emptied.")

if __name__ == "__main__":
    empty_places("dfw_places.db")  # adjust if your DB file has a different name
