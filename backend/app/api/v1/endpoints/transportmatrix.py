import os
import sqlite3
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from pydantic import BaseModel
from app.models.user import User
from app.services.auth_service import get_current_user

router = APIRouter()

# Path to SQLite database
DB_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data")
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, "transportmatrix.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create transport_orders table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transport_orders (
        id TEXT PRIMARY KEY,
        order_number_base TEXT,
        kw INTEGER,
        vehicle_type TEXT,
        trailer_license TEXT,
        delivery_date TEXT,
        delivery_time TEXT,
        assembler TEXT,
        order_crane TEXT,
        element_count INTEGER,
        gross_weight_kg REAL,
        transport_type TEXT,
        carrier_code TEXT,
        loading_site_name TEXT,
        loading_site_street TEXT,
        loading_site_city TEXT,
        client_name TEXT,
        unload_site_name TEXT,
        unload_site_street TEXT,
        unload_site_city TEXT,
        zone TEXT,
        project_number TEXT,
        calc_carrier_cost REAL,
        agreed_revenue REAL,
        revenue_per_tour REAL,
        actual_cost REAL,
        toll_cost REAL,
        waiting_cost REAL,
        trailer_extra_cost REAL,
        site_downtime_cost REAL,
        gross_margin_db1 REAL
    );
    """)

    # Create projects table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS projects (
        project_number TEXT PRIMARY KEY,
        name TEXT,
        client_name text,
        location TEXT,
        total_volume_m3 REAL,
        total_elements INTEGER
    );
    """)

    # Create carriers table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS carriers (
        code TEXT PRIMARY KEY,
        name TEXT,
        contact_person TEXT,
        phone TEXT,
        email TEXT
    );
    """)

    conn.commit()

    # Seed demo data if empty
    cursor.execute("SELECT COUNT(*) FROM transport_orders;")
    if cursor.fetchone()[0] == 0:
        seed_demo_data(cursor)
        conn.commit()

    conn.close()

def seed_demo_data(cursor):
    # Seed Carriers
    carriers = [
        ("DACHSER", "Dachser SE Logistik", "M. Hansen", "+49 461 8892-0", "dispo.flensburg@dachser.com"),
        ("SCHENKER", "DB Schenker Logistik", "K. Schmidt", "+49 40 3341-200", "nord.logistik@dbschenker.com"),
        ("SANDER", "Sander Spedition GmbH", "H. Sander", "+49 431 7721-0", "dispo@sander-spedition.de"),
        ("TINGLEV_EXPRESS", "Tinglev Eigener Fuhrpark", "W. Jürgensen", "+45 74 64 3000", "fuhrpark@tinglev-elementfabrik.dk")
    ]
    cursor.executemany("INSERT OR REPLACE INTO carriers VALUES (?,?,?,?,?);", carriers)

    # Seed Projects
    projects = [
        ("PRJ-2026-NEM-882", "Gewerbepark Tinglev Süd - Halle 3", "Dansk Byggeri A/S", "6360 Tinglev", 340.0, 48),
        ("PRJ-2026-HH-102", "Hafencity Hamburg Baufeld 102", "Nordbau GmbH", "20457 Hamburg", 680.0, 120),
        ("PRJ-2026-FL-550", "Logistikzentrum Handewitt", "Scandic Warehousing", "24983 Handewitt", 510.0, 36)
    ]
    cursor.executemany("INSERT OR REPLACE INTO projects VALUES (?,?,?,?,?,?);", projects)

    # Seed Orders
    demo_orders = [
        (
            "TR-2026-3401", "TR-3401", 34, "Sattelzug 40t", "FL-TL 882", "2026-08-20", "07:30", "Montage-Team A", "Demag 50t",
            6, 24500.0, "Schwergut", "TINGLEV_EXPRESS", "Werk Tinglev", "Fabrikvej 12", "6360 Tinglev",
            "Dansk Byggeri A/S", "Gewerbepark Tinglev Süd", "Industrieallee 4", "6360 Tinglev", "Zone 1", "PRJ-2026-NEM-882",
            1200.0, 1850.0, 1850.0, 1150.0, 85.0, 0.0, 0.0, 0.0, 615.0
        ),
        (
            "TR-2026-3402", "TR-3402", 34, "Tieflader Euro 6", "FL-[# 992", "2026-08-21", "09:00", "Montage-Team B", "Liebherr 70t",
            4, 38200.0, "Überbreite 3.2m", "DACHSER", "Werk Tinglev", "Fabrikvej 12", "6360 Tinglev",
            "Nordbau GmbH", "Hafencity Baufeld 102", "Uferstraße 18", "20457 Hamburg", "Zone 3", "PRJ-2026-HH-102",
            2400.0, 3400.0, 3400.0, 2250.0, 140.0, 100.0, 0.0, 0.0, 910.0
        ),
        (
            "TR-2026-3501", "TR-3501", 35, "Spannbett-Trailer", "FL-SP 104", "2026-08-26", "08:00", "Werkstatt-Direkt", "Portalkran 32t",
            8, 29800.0, "Standard-Fertigteil", "SANDER", "Werk Tinglev", "Fabrikvej 12", "6360 Tinglev",
            "Scandic Warehousing", "Logistikpark Handewitt", "Europastraße 9", "24983 Handewitt", "Zone 2", "PRJ-2026-FL-550",
            1450.0, 2100.0, 2100.0, 1380.0, 60.0, 0.0, 0.0, 0.0, 660.0
        )
    ]

    cursor.executemany("""
    INSERT OR REPLACE INTO transport_orders VALUES (
        ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
    );
    """, demo_orders)

# Initialize database tables on startup
init_db()

@router.get("/orders", status_code=status.HTTP_200_OK)
def get_transport_orders(
    kw: Optional[int] = Query(None),
    carrier: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    conn = get_db_connection()
    cursor = conn.cursor()

    sql = "SELECT * FROM transport_orders WHERE 1=1"
    params = []

    if kw is not None:
        sql += " AND kw = ?"
        params.append(kw)

    if carrier:
        sql += " AND carrier_code = ?"
        params.append(carrier)

    if search:
        sql += " AND (id LIKE ? OR client_name LIKE ? OR unload_site_name LIKE ? OR project_number LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term, term])

    sql += " ORDER BY kw DESC, delivery_date DESC"
    cursor.execute(sql, params)
    rows = cursor.fetchall()
    
    result = [dict(row) for row in rows]
    conn.close()
    return result

@router.get("/orders/{order_id}", status_code=status.HTTP_200_OK)
def get_transport_order(
    order_id: str,
    current_user: User = Depends(get_current_user)
):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transport_orders WHERE id = ?", (order_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Transportauftrag nicht gefunden.")
    return dict(row)

@router.post("/orders", status_code=status.HTTP_201_CREATED)
def create_transport_order(
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    if "id" not in payload or not payload["id"]:
        payload["id"] = f"TR-2026-{int(os.urandom(2).hex(), 16)}"

    # Compute DB1 margin
    rev = float(payload.get("agreed_revenue", 0.0) or 0.0)
    cost = float(payload.get("actual_cost", 0.0) or 0.0)
    toll = float(payload.get("toll_cost", 0.0) or 0.0)
    payload["gross_margin_db1"] = round(rev - cost - toll, 2)

    conn = get_db_connection()
    cursor = conn.cursor()

    keys = list(payload.keys())
    cols = ", ".join(keys)
    placeholders = ", ".join(["?"] * len(keys))
    values = [payload[k] for k in keys]

    try:
        cursor.execute(f"INSERT INTO transport_orders ({cols}) VALUES ({placeholders})", values)
        conn.commit()
    except sqlite3.IntegrityError as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Fehler beim Erstellen des Auftrags: {e}")

    conn.close()
    return payload

@router.put("/orders/{order_id}", status_code=status.HTTP_200_OK)
def update_transport_order(
    order_id: str,
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Re-calculate DB1
    if "agreed_revenue" in payload or "actual_cost" in payload or "toll_cost" in payload:
        cursor.execute("SELECT agreed_revenue, actual_cost, toll_cost FROM transport_orders WHERE id = ?", (order_id,))
        existing = cursor.fetchone()
        rev = float(payload.get("agreed_revenue", existing["agreed_revenue"] if existing else 0) or 0)
        cost = float(payload.get("actual_cost", existing["actual_cost"] if existing else 0) or 0)
        toll = float(payload.get("toll_cost", existing["toll_cost"] if existing else 0) or 0)
        payload["gross_margin_db1"] = round(rev - cost - toll, 2)

    set_clauses = []
    values = []
    for k, v in payload.items():
        if k != "id":
            set_clauses.append(f"{k} = ?")
            values.append(v)

    values.append(order_id)
    cursor.execute(f"UPDATE transport_orders SET {', '.join(set_clauses)} WHERE id = ?", values)
    conn.commit()
    conn.close()
    return {"status": "success", "id": order_id}

@router.get("/projects", status_code=status.HTTP_200_OK)
def get_projects(current_user: User = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM projects ORDER BY project_number ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/carriers", status_code=status.HTTP_200_OK)
def get_carriers(current_user: User = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM carriers ORDER BY code ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/kpis", status_code=status.HTTP_200_OK)
def get_transport_kpis(current_user: User = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(gross_weight_kg), 0) as total_weight_kg,
        COALESCE(SUM(element_count), 0) as total_elements,
        COALESCE(SUM(agreed_revenue), 0) as total_revenue,
        COALESCE(SUM(actual_cost), 0) as total_cost,
        COALESCE(SUM(gross_margin_db1), 0) as total_db1
    FROM transport_orders;
    """)
    totals = dict(cursor.fetchone())

    # Carrier breakdown
    cursor.execute("""
    SELECT carrier_code, COUNT(*) as count, COALESCE(SUM(gross_margin_db1), 0) as db1
    FROM transport_orders
    GROUP BY carrier_code;
    """)
    by_carrier = [dict(r) for r in cursor.fetchall()]

    conn.close()
    
    totals["total_weight_t"] = round(totals["total_weight_kg"] / 1000.0, 2)
    totals["by_carrier"] = by_carrier
    return totals
