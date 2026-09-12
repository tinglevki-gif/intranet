import os
import sys
import json
import logging
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.models.role import Role
from app.core.security import get_password_hash

logger = logging.getLogger("seed_employees")
logging.basicConfig(level=logging.INFO)

with open('scratch_full_users_code.json', 'r', encoding='utf-8') as f:
    users_data = json.load(f)

db: Session = SessionLocal()
try:
    added_count = 0
    updated_count = 0
    for udata in users_data:
        email = udata["email"]
        user = db.query(User).filter(User.email == email).first()
        if not user:
            pwd = udata.pop("password", "Passwort123!")
            hashed_pwd = get_password_hash(pwd)
            new_user = User(**udata, hashed_password=hashed_pwd)
            db.add(new_user)
            added_count += 1
        else:
            # Update phone, mobile, department, position if missing
            if not user.phone or user.phone == "+49 33439 86-0":
                user.phone = udata.get("phone")
            if not user.mobile and udata.get("mobile"):
                user.mobile = udata.get("mobile")
            user.department = udata.get("department")
            user.position = udata.get("position")
            updated_count += 1

    db.commit()
    print(f"SUCCESS: Added {added_count} new employees and updated {updated_count} existing employee records!")
except Exception as e:
    db.rollback()
    print(f"ERROR seeding employees: {e}")
finally:
    db.close()
