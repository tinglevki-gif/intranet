import io
import csv
import json
import re
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.user import User, RoleEnum
from app.models.role import Role
from app.core.security import get_password_hash
from app.schemas.user import UserImportRow, UserImportPreviewResponse, UserImportSummaryResponse

CSV_COLUMNS = [
    "email",
    "first_name",
    "last_name",
    "full_name",
    "department",
    "position",
    "phone",
    "mobile",
    "location",
    "role",
    "supervisor_email",
    "can_manage_canteen",
    "is_active",
    "password"
]

EMAIL_REGEX = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")

def get_csv_import_template() -> str:
    """Generates official CSV template with headers and demo rows for user import."""
    output = io.StringIO()
    # Write UTF-8 BOM for direct Microsoft Excel compatibility
    output.write("\ufeff")
    writer = csv.writer(output, delimiter=";", quoting=csv.QUOTE_MINIMAL)
    writer.writerow(CSV_COLUMNS)
    
    # Demo sample rows
    writer.writerow([
        "m.mustermann@tinglev.de",
        "Max",
        "Mustermann",
        "Max Mustermann",
        "Produktion / Fertigung",
        "Schichtleiter Elementbau",
        "+49 33439 86-110",
        "0171 / 12 34 567",
        "Werk Tinglev",
        "EMPLOYEE",
        "h.senf@tinglev.de",
        "Nein",
        "Ja",
        "Passwort123!"
    ])
    writer.writerow([
        "e.musterfrau@tinglev.de",
        "Erika",
        "Musterfrau",
        "Erika Musterfrau",
        "Planung & CAD",
        "BIM-Konstrukteurin",
        "+49 33439 86-220",
        "0172 / 98 76 543",
        "Planungsbüro Nord",
        "EMPLOYEE",
        "h.senf@tinglev.de",
        "Nein",
        "Ja",
        "Passwort123!"
    ])
    writer.writerow([
        "k.koch@tinglev.de",
        "Klaus",
        "Koch",
        "Klaus Koch",
        "Kantine & Catering",
        "Küchenchef Betriebsrestaurant",
        "+49 33439 86-330",
        "",
        "Kantine Tinglev",
        "EMPLOYEE",
        "h.senf@tinglev.de",
        "Ja",
        "Ja",
        "Passwort123!"
    ])
    return output.getvalue()

def export_users_to_csv(users: List[User], db: Session) -> str:
    """Exports user list into UTF-8 CSV with BOM for Microsoft Excel."""
    output = io.StringIO()
    output.write("\ufeff")
    writer = csv.writer(output, delimiter=";", quoting=csv.QUOTE_MINIMAL)
    
    headers = [
        "ID",
        "E-Mail",
        "Vorname",
        "Nachname",
        "Vollständiger Name",
        "Abteilung",
        "Position",
        "Telefon",
        "Mobiltelefon",
        "Standort",
        "Rolle",
        "Vorgesetzter (E-Mail)",
        "Vorgesetzter (Name)",
        "Kantine verwalten",
        "Aktiv",
        "Erstellt am"
    ]
    writer.writerow(headers)

    # Preload supervisors dictionary for speed
    all_users_map = {u.id: u for u in db.query(User).all()}

    for u in users:
        supervisor = all_users_map.get(u.supervisor_id) if u.supervisor_id else None
        sup_email = supervisor.email if supervisor else ""
        sup_name = supervisor.full_name if supervisor else ""
        role_val = u.role.value if hasattr(u.role, 'value') else str(u.role)
        canteen_val = "Ja" if u.can_manage_canteen else "Nein"
        active_val = "Ja" if u.is_active else "Nein"
        created_str = u.created_at.strftime("%Y-%m-%d %H:%M") if u.created_at else ""

        writer.writerow([
            u.id,
            u.email,
            u.first_name or "",
            u.last_name or "",
            u.full_name or f"{u.first_name or ''} {u.last_name or ''}".strip(),
            u.department or "General",
            u.position or "Mitarbeiter",
            u.phone or "",
            u.mobile or "",
            u.location or "Tinglev Headquarter",
            role_val,
            sup_email,
            sup_name,
            canteen_val,
            active_val,
            created_str
        ])

    return output.getvalue()

def export_users_to_json(users: List[User], db: Session) -> List[Dict[str, Any]]:
    """Exports user list into structured JSON array."""
    all_users_map = {u.id: u for u in db.query(User).all()}
    result = []
    for u in users:
        supervisor = all_users_map.get(u.supervisor_id) if u.supervisor_id else None
        role_val = u.role.value if hasattr(u.role, 'value') else str(u.role)
        result.append({
            "id": u.id,
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "full_name": u.full_name,
            "department": u.department,
            "position": u.position,
            "phone": u.phone,
            "mobile": u.mobile,
            "location": u.location,
            "role": role_val,
            "supervisor_id": u.supervisor_id,
            "supervisor_email": supervisor.email if supervisor else None,
            "supervisor_name": supervisor.full_name if supervisor else None,
            "can_manage_canteen": bool(u.can_manage_canteen),
            "is_active": bool(u.is_active),
            "allowed_modules": u.allowed_modules or [],
            "custom_permissions": u.custom_permissions or {},
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "updated_at": u.updated_at.isoformat() if u.updated_at else None
        })
    return result

def parse_raw_content(file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
    """Parses uploaded file bytes (CSV or JSON) with encoding and delimiter auto-detection."""
    # Try decoding with utf-8-sig (handles BOM), then utf-8, then latin-1
    text_content = ""
    for enc in ["utf-8-sig", "utf-8", "cp1252", "latin-1"]:
        try:
            text_content = file_bytes.decode(enc)
            break
        except Exception:
            continue

    if not text_content:
        raise ValueError("Die Datei konnte mit keiner gängigen Zeichenkodierung (UTF-8, Latin-1) gelesen werden.")

    # 1. JSON parsing
    if filename.lower().endswith(".json") or text_content.strip().startswith("["):
        try:
            data = json.loads(text_content)
            if not isinstance(data, list):
                raise ValueError("JSON-Datei muss eine Liste von Benutzerobjekten enthalten.")
            return data
        except json.JSONDecodeError as e:
            raise ValueError(f"Ungültige JSON-Struktur: {str(e)}")

    # 2. CSV parsing with delimiter sniff
    first_lines = text_content[:4096]
    delimiter = ";"
    if "," in first_lines and first_lines.count(",") > first_lines.count(";"):
        delimiter = ","
    elif "\t" in first_lines and first_lines.count("\t") > first_lines.count(";"):
        delimiter = "\t"

    reader = csv.DictReader(io.StringIO(text_content), delimiter=delimiter)
    
    # Normalize headers (remove BOM, strip, lowercase)
    normalized_rows = []
    for raw_row in reader:
        norm_row = {}
        for k, v in raw_row.items():
            if k is None:
                continue
            clean_k = k.replace("\ufeff", "").strip().lower()
            # Map alternate German / English / Spanish field names
            if clean_k in ["email", "e-mail", "correo", "mail"]:
                norm_row["email"] = v.strip() if v else ""
            elif clean_k in ["first_name", "vorname", "nombre"]:
                norm_row["first_name"] = v.strip() if v else ""
            elif clean_k in ["last_name", "nachname", "apellidos", "apellido"]:
                norm_row["last_name"] = v.strip() if v else ""
            elif clean_k in ["full_name", "vollständiger name", "name", "nombre completo"]:
                norm_row["full_name"] = v.strip() if v else ""
            elif clean_k in ["department", "abteilung", "departamento"]:
                norm_row["department"] = v.strip() if v else ""
            elif clean_k in ["position", "cargo", "stelle", "titel"]:
                norm_row["position"] = v.strip() if v else ""
            elif clean_k in ["phone", "telefon", "teléfono", "tel"]:
                norm_row["phone"] = v.strip() if v else ""
            elif clean_k in ["mobile", "mobiltelefon", "handy", "móvil"]:
                norm_row["mobile"] = v.strip() if v else ""
            elif clean_k in ["location", "standort", "ubicación", "werk"]:
                norm_row["location"] = v.strip() if v else ""
            elif clean_k in ["role", "rolle", "rol"]:
                norm_row["role"] = v.strip().upper() if v else ""
            elif clean_k in ["supervisor_email", "vorgesetzter (e-mail)", "vorgesetzter_email", "supervisor"]:
                norm_row["supervisor_email"] = v.strip() if v else ""
            elif clean_k in ["can_manage_canteen", "kantine verwalten", "kantine_verwalten", "kantine"]:
                norm_row["can_manage_canteen"] = v.strip() if v else ""
            elif clean_k in ["is_active", "aktiv", "activo", "status"]:
                norm_row["is_active"] = v.strip() if v else ""
            elif clean_k in ["password", "passwort", "contraseña", "pwd"]:
                norm_row["password"] = v.strip() if v else ""
            else:
                norm_row[clean_k] = v.strip() if v else ""
        normalized_rows.append(norm_row)

    return normalized_rows

def normalize_bool(val: Any, default: bool = True) -> bool:
    if val is None or val == "":
        return default
    if isinstance(val, bool):
        return val
    str_val = str(val).strip().lower()
    return str_val in ["1", "true", "yes", "ja", "si", "sí", "wahr", "y"]

def preview_user_import(file_bytes: bytes, filename: str, db: Session) -> UserImportPreviewResponse:
    """Pre-validates and generates a preview of users to be created/updated with errors."""
    raw_rows = parse_raw_content(file_bytes, filename)
    
    existing_users = {u.email.lower(): u for u in db.query(User).all()}
    existing_roles = {r.value if hasattr(r, 'value') else str(r) for r in RoleEnum}
    # Add dynamic DB roles
    for r in db.query(Role).all():
        existing_roles.add(r.name.upper())

    preview_rows: List[UserImportRow] = []
    seen_emails_in_file = set()
    create_cnt = 0
    update_cnt = 0
    error_cnt = 0

    for idx, row in enumerate(raw_rows, start=1):
        errors = []
        email = row.get("email", "").strip().lower()

        if not email:
            errors.append("E-Mail-Adresse fehlt.")
        elif not EMAIL_REGEX.match(email):
            errors.append(f"Ungültiges E-Mail-Format '{email}'.")
        elif email in seen_emails_in_file:
            errors.append(f"E-Mail '{email}' ist mehrfach in dieser Datei enthalten.")
        
        if email:
            seen_emails_in_file.add(email)

        first_name = row.get("first_name", "")
        last_name = row.get("last_name", "")
        full_name = row.get("full_name", "")
        if not full_name:
            if first_name or last_name:
                full_name = f"{first_name} {last_name}".strip()
            else:
                full_name = email.split("@")[0].capitalize() if email else "Unbekannt"

        role = row.get("role", "EMPLOYEE").upper()
        if role and role not in existing_roles:
            role = "EMPLOYEE"

        supervisor_email = row.get("supervisor_email", "").strip().lower() or None
        if supervisor_email and supervisor_email not in existing_users and supervisor_email != email:
            # Not an error, will just be warned or ignored
            pass

        can_manage_canteen = normalize_bool(row.get("can_manage_canteen"), default=False)
        is_active = normalize_bool(row.get("is_active"), default=True)

        is_existing = email in existing_users
        if errors:
            action = "ERROR"
            error_cnt += 1
        elif is_existing:
            action = "UPDATE"
            update_cnt += 1
        else:
            action = "CREATE"
            create_cnt += 1

        preview_rows.append(UserImportRow(
            row_number=idx,
            email=email,
            first_name=first_name or None,
            last_name=last_name or None,
            full_name=full_name,
            department=row.get("department", "General") or "General",
            position=row.get("position", "Mitarbeiter") or "Mitarbeiter",
            phone=row.get("phone", "") or None,
            mobile=row.get("mobile", "") or None,
            location=row.get("location", "Tinglev Headquarter") or "Tinglev Headquarter",
            role=role,
            supervisor_email=supervisor_email,
            can_manage_canteen=can_manage_canteen,
            is_active=is_active,
            password=row.get("password", "") or None,
            action=action,
            errors=errors
        ))

    return UserImportPreviewResponse(
        total_rows=len(preview_rows),
        valid_rows=len(preview_rows) - error_cnt,
        create_count=create_cnt,
        update_count=update_cnt,
        error_count=error_cnt,
        rows=preview_rows
    )

def execute_user_import(
    file_bytes: bytes,
    filename: str,
    update_existing: bool,
    default_password: str,
    db: Session
) -> UserImportSummaryResponse:
    """Executes safe transactional import of user records into database."""
    preview = preview_user_import(file_bytes, filename, db)
    
    created_cnt = 0
    updated_cnt = 0
    skipped_cnt = 0
    error_cnt = 0
    general_errors = []

    fallback_pwd = default_password.strip() if default_password and default_password.strip() else "Passwort123!"

    # Cache users for supervisor linking
    all_users_by_email = {u.email.lower(): u for u in db.query(User).all()}

    try:
        # Phase 1: Create and Update Users
        for row in preview.rows:
            if row.errors or row.action == "ERROR":
                error_cnt += 1
                general_errors.append(f"Zeile {row.row_number} ({row.email or 'ohne E-Mail'}): {', '.join(row.errors)}")
                continue

            email_lower = row.email.lower()
            existing_user = all_users_by_email.get(email_lower)

            if existing_user:
                if update_existing:
                    # Update fields
                    existing_user.first_name = row.first_name or existing_user.first_name
                    existing_user.last_name = row.last_name or existing_user.last_name
                    existing_user.full_name = row.full_name or existing_user.full_name
                    existing_user.department = row.department or existing_user.department
                    existing_user.position = row.position or existing_user.position
                    if row.phone is not None:
                        existing_user.phone = row.phone
                    if row.mobile is not None:
                        existing_user.mobile = row.mobile
                    if row.location is not None:
                        existing_user.location = row.location
                    if row.role:
                        existing_user.role = row.role
                    existing_user.can_manage_canteen = row.can_manage_canteen
                    existing_user.is_active = row.is_active
                    
                    # Update password only if explicitly provided in file
                    if row.password and row.password.strip():
                        existing_user.hashed_password = get_password_hash(row.password.strip())
                    
                    updated_cnt += 1
                else:
                    skipped_cnt += 1
            else:
                # Create New User
                pwd_to_use = row.password.strip() if row.password and row.password.strip() else fallback_pwd
                custom_perms = {"manage_canteen": True} if row.can_manage_canteen else {}
                new_user = User(
                    email=row.email.lower().strip(),
                    first_name=row.first_name,
                    last_name=row.last_name,
                    full_name=row.full_name,
                    department=row.department,
                    position=row.position,
                    phone=row.phone,
                    mobile=row.mobile,
                    location=row.location,
                    role=row.role,
                    custom_permissions=custom_perms,
                    is_active=row.is_active,
                    hashed_password=get_password_hash(pwd_to_use)
                )
                db.add(new_user)
                db.flush()
                all_users_by_email[email_lower] = new_user
                created_cnt += 1

        # Phase 2: Link Supervisors by Email
        for row in preview.rows:
            if not row.supervisor_email or row.action == "ERROR":
                continue
            user_obj = all_users_by_email.get(row.email.lower())
            sup_obj = all_users_by_email.get(row.supervisor_email.lower())
            if user_obj and sup_obj and user_obj.id != sup_obj.id:
                user_obj.supervisor_id = sup_obj.id

        db.commit()

    except Exception as e:
        db.rollback()
        raise ValueError(f"Datenbankfehler beim Importieren: {str(e)}")

    return UserImportSummaryResponse(
        total_processed=preview.total_rows,
        created_count=created_cnt,
        updated_count=updated_cnt,
        skipped_count=skipped_cnt,
        error_count=error_cnt,
        errors=general_errors
    )
