"""App with authentication enabled."""
from backend.app import *  # Import everything from existing app
from backend.auth import auth_router, init_auth_db

# Add auth routes
app.include_router(auth_router)

# Initialize on startup
@app.on_event("startup")
def startup_with_auth():
    try:
        init_auth_db()
        print("✅ Authentication enabled")
    except Exception as e:
        print(f"⚠️  Auth initialization warning: {e}")