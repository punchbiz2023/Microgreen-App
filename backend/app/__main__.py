"""
Main entry point for module execution
Initializes database and seeds
"""

from app.database import init_db, SessionLocal
from app.init_seeds import init_seeds, create_default_user

if __name__ == '__main__':
    # Initialize database tables
    try:
        init_db()  
    except Exception as e:
        print(f"Warning during init_db: {e}")
    
    # Create session
    db = SessionLocal()
    
    try:
        # Initialize seeds
        init_seeds(db)
        
        # Create default user
        create_default_user(db)
        
        print("\nDatabase initialization complete!")
    finally:
        db.close()
