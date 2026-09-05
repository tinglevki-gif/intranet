import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.core.database import SessionLocal
from app.models.geofence import Geofence

db = SessionLocal()
for g in db.query(Geofence).all():
    print(f"ID: {g.id} | Name: {g.name} | Type: {g.type.value} | Coords: ({g.latitude}, {g.longitude}) | Desc: {g.description}")
db.close()
