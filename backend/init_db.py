"""
Database Initialization & Seeder Script for Tiglev Elementfabrik Intranet Platform.
Can be executed standalone: python init_db.py
"""
import os
import sys
import logging
from sqlalchemy import text
from app.core.database import engine, Base, SessionLocal
from app.models.role import Role
from app.models.user import User
from app.models.announcement import Announcement
from app.models.document import Document, DocumentChunk
from app.models.event import Event
from app.models.menu import MenuItem
from app.models.schulung import TrainingDocument, TrainingChunk
from app.services.seeder import seed_database
from app.services.role_service import seed_default_roles
from app.services.training_ai_service import seed_default_training_manuals

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("init_db")

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_ROOT = os.path.join(BACKEND_DIR, "uploads")

def ensure_schema_migrations():
    """Ensure newly added columns exist in SQLite database if tables already existed."""
    with engine.connect() as conn:
        try:
            # Check if allowed_modules column exists in users
            result = conn.execute(text("PRAGMA table_info(users)"))
            columns = [row[1] for row in result.fetchall()]
            if "allowed_modules" not in columns:
                logger.info("Migrating schema: Adding 'allowed_modules' column to 'users' table...")
                conn.execute(text("ALTER TABLE users ADD COLUMN allowed_modules JSON DEFAULT NULL;"))
                conn.commit()
                logger.info("Column 'allowed_modules' successfully added.")

            if "custom_role_id" not in columns:
                logger.info("Migrating schema: Adding 'custom_role_id' column to 'users' table...")
                conn.execute(text("ALTER TABLE users ADD COLUMN custom_role_id INTEGER DEFAULT NULL;"))
                conn.commit()
                logger.info("Column 'custom_role_id' successfully added.")
        except Exception as e:
            logger.warning(f"Schema migration note: {e}")

def init():
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Tables created successfully.")

    ensure_schema_migrations()

    logger.info("Seeding initial corporate demo data...")
    db = SessionLocal()
    try:
        seed_database(db)
        seed_default_roles(db)
        seed_default_training_manuals(db, UPLOAD_ROOT)
        logger.info("Database seeding completed successfully.")
    except Exception as e:
        logger.error(f"Error during database seeding: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    init()
