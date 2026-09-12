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
        ("Unbekannt", "Spedition Unbekannt / Undefiniert", "Dispo Team", "+49 40 0000-00", "dispo@unbekannt.de"),
        ("K", "Kühne + Nagel Logistik", "M. Hansen", "+49 40 3341-100", "dispo.kuehne@kn.com"),
        ("T", "Tinglev Eigener Fuhrpark", "W. Jürgensen", "+45 74 64 3000", "fuhrpark@tinglev.dk"),
        ("k", "Krage Spedition GmbH", "H. Krage", "+49 431 7721-0", "dispo@krage.de"),
        ("t", "Trans-Sped GmbH", "K. Schmidt", "+49 461 8892-0", "dispo@trans-sped.de")
    ]
    cursor.executemany("INSERT OR REPLACE INTO carriers VALUES (?,?,?,?,?);", carriers)

    # Seed Projects
    projects = [
        ("45189", "Wohlfühlhaus Bau GmbH & Co.KG", "Marina City Haus 2", "Hafenstrasse 8", 340.0, 48),
        ("45247", "Norddeutsche Wohnbau GmbH", "4RH Sarstedt", "Giesener Straße 10", 680.0, 120),
        ("45270", "Norddeutsche Wohnbau GmbH", "MFH 14 WE", "Giesener Straße 10", 510.0, 36),
        ("45515", "Wohlfühlhaus Bau GmbH & Co.KG", "Marina City FFO Haus 1", "Hafenstraße 7", 290.0, 24),
        ("45516", "Wohlfühlhaus Bau GmbH & Co.KG", "Marina City Haus 3", "Hafenstrasse 8", 410.0, 52),
        ("45517", "Wohlfühlhaus Bau GmbH & Co.KG", "Marina City FFO Haus 6", "Hafenstraße 14", 310.0, 30),
        ("45518", "Wohlfühlhaus Bau GmbH & Co.KG", "Marina City FFO Haus 7", "Hafenstraße 15", 330.0, 32),
        ("45592", "Schrobsdorff Bau AG", "MFH Rhen Haus 1 Typ1", "Rhenaniastraße 35", 550.0, 60),
        ("45633", "Norddeutsche Wohnbau GmbH", "Frahms Gärten Haus B", "Frahmredder 52,54,56", 420.0, 44),
        ("45696", "Otto Wulff Bauunternehmung GmbH", "MFH Indira Gandhi Strasse 6", "Indira-Gandhi-Strasse 6", 610.0, 75)
    ]
    cursor.executemany("INSERT OR REPLACE INTO projects VALUES (?,?,?,?,?,?);", projects)

    # Seed Orders matching screenshots
    demo_orders = [
        ("A26-00336-03", "A26-00336", 26, "3-Achser", "FL-TR 336", "", "", "", "Ja", 11, 18034.0, "One-Way", "Unbekannt", "Werk Tinglev", "Fabrikvej 12", "6360 Tinglev", "Wohlfühlhaus Bau", "Marina City Haus 2", "Hafenstrasse 8", "Hamburg", "Zone 1", "45189", 0.0, 450.0, 450.0, 0.0, 0.0, 0.0, 0.0, 0.0, 450.0),
        ("A26-00336-02", "A26-00336", 26, "3-Achser", "FL-TR 337", "", "", "", "Ja", 11, 16900.0, "One-Way", "Unbekannt", "Werk Tinglev", "Fabrikvej 12", "6360 Tinglev", "Wohlfühlhaus Bau", "Marina City Haus 2", "Hafenstrasse 8", "Hamburg", "Zone 1", "45189", 0.0, 450.0, 450.0, 0.0, 0.0, 0.0, 0.0, 0.0, 450.0),
        ("A26-00336-01", "A26-00336", 26, "3-Achser", "FL-TR 338", "", "", "", "Ja", 12, 21200.0, "One-Way", "Unbekannt", "Werk Tinglev", "Fabrikvej 12", "6360 Tinglev", "Wohlfühlhaus Bau", "Marina City Haus 2", "Hafenstrasse 8", "Hamburg", "Zone 1", "45189", 0.0, 480.0, 480.0, 0.0, 0.0, 0.0, 0.0, 0.0, 480.0),
        ("A26-00310-02", "A26-00310", 26, "3-Achser", "FL-TR 310", "", "", "", "Ja", 13, 19047.0, "One-Way", "Unbekannt", "Werk Tinglev", "Fabrikvej 12", "6360 Tinglev", "Norddeutsche Wohnbau", "4RH Sarstedt", "Giesener Straße 10", "Sarstedt", "Zone 2", "45247", 0.0, 520.0, 520.0, 0.0, 0.0, 0.0, 0.0, 0.0, 520.0),
        ("A26-00310-01", "A26-00310", 26, "3-Achser", "FL-TR 311", "", "", "", "Ja", 9, 20745.0, "One-Way", "Unbekannt", "Werk Tinglev", "Fabrikvej 12", "6360 Tinglev", "Norddeutsche Wohnbau", "4RH Sarstedt", "Giesener Straße 10", "Sarstedt", "Zone 2", "45247", 0.0, 520.0, 520.0, 0.0, 0.0, 0.0, 0.0, 0.0, 520.0),
        ("A26-00309-02", "A26-00309", 26, "3-Achser", "FL-TR 309", "", "", "", "Ja", 10, 17208.0, "One-Way", "Unbekannt", "Werk Tinglev", "Fabrikvej 12", "6360 Tinglev", "Norddeutsche Wohnbau", "MFH 14 WE", "Giesener Straße 10", "Sarstedt", "Zone 2", "45270", 0.0, 490.0, 490.0, 0.0, 0.0, 0.0, 0.0, 0.0, 490.0),
        ("A26-00309-01", "A26-00309", 26, "3-Achser", "FL-TR 309", "", "", "", "Ja", 10, 17126.0, "One-Way", "Unbekannt", "Werk Tinglev", "Fabrikvej 12", "6360 Tinglev", "Norddeutsche Wohnbau", "MFH 14 WE", "Giesener Straße 10", "Sarstedt", "Zone 2", "45270", 0.0, 490.0, 490.0, 0.0, 0.0, 0.0, 0.0, 0.0, 490.0),
        ("A26-00307-02", "A26-00307", 29, "Innenlader", "FL-IL 702", "16.7.2026", "08:00", "", "Ja", 3, 3815.0, "Rundlauf", "k", "Werk Tinglev", "Fabrikvej 12", "6360 Tinglev", "Wohlfühlhaus Bau", "Marina City FFO Haus 1", "Hafenstraße 7", "Frankfurt (Oder)", "Zone 3", "45515", 0.0, 680.0, 680.0, 0.0, 0.0, 0.0, 0.0, 0.0, 680.0),
        ("A26-00307-01", "A26-00307", 29, "Innenlader", "FL-IL 701", "16.7.2026", "09:30", "", "Ja", 8, 19630.0, "Rundlauf", "k", "Werk Tinglev", "Fabrikvej 12", "6360 Tinglev", "Wohlfühlhaus Bau", "Marina City FFO Haus 1", "Hafenstraße 7", "Frankfurt (Oder)", "Zone 3", "45515", 0.0, 750.0, 750.0, 0.0, 0.0, 0.0, 0.0, 0.0, 750.0),
        ("A26-00306-01", "A26-00306", 28, "Innenlader", "FL-IL 601", "7.7.2026", "08:00", "", "Ja", 12, 18577.0, "One-Way", "k", "Werk Tinglev", "Fabrikvej 12", "6360 Tinglev", "Wohlfühlhaus Bau", "Marina City Haus 3", "Hafenstrasse 8", "Hamburg", "Zone 1", "45516", 0.0, 620.0, 620.0, 0.0, 0.0, 0.0, 0.0, 0.0, 620.0),

        # KW 12 Orders for Wochenplan
        ("A25-00556-04", "A25-00556", 12, "Innenlader", "FL-IL 556", "2026-03-17", "08:00", "", "Ja", 4, 19701.0, "One-Way", "K", "Werk Tinglev", "Fabrikvej 12", "6360 Tinglev", "HKL 2B", "Lohkampstr.", "Lohkampstraße 22", "Hamburg", "Zone 1", "45517", 0.0, 580.0, 580.0, 0.0, 0.0, 0.0, 0.0, 0.0, 580.0),
        ("A25-00556-03", "A25-00556", 12, "Innenlader", "FL-IL 556", "2026-03-17", "09:30", "", "Ja", 3, 17747.0, "One-Way", "K", "Werk Tinglev", "Fabrikvej 12", "6360 Tinglev", "HKL 2B", "Lohkampstr.", "Lohkampstraße 22", "Hamburg", "Zone 1", "45517", 0.0, 580.0, 580.0, 0.0, 0.0, 0.0, 0.0, 0.0, 580.0),
        ("A25-00556-02", "A25-00556", 12, "Innenlader", "FL-IL 556", "2026-03-17", "11:00", "", "Ja", 4, 18545.0, "One-Way", "K", "Werk Tinglev", "Fabrikvej 12", "6360 Tinglev", "HKL 2B", "Lohkampstr.", "Lohkampstraße 22", "Hamburg", "Zone 1", "45517", 0.0, 580.0, 580.0, 0.0, 0.0, 0.0, 0.0, 0.0, 580.0),
        ("A25-00556-01", "A25-00556", 12, "Innenlader", "FL-IL 556", "2026-03-17", "14:00", "", "Ja", 3, 15987.0, "One-Way", "K", "Werk Tinglev", "Fabrikvej 12", "6360 Tinglev", "HKL 2B", "Lohkampstr.", "Lohkampstraße 22", "Hamburg", "Zone 1", "45517", 0.0, 580.0, 580.0, 0.0, 0.0, 0.0, 0.0, 0.0, 580.0),

        ("A25-00556-08", "A25-00556", 12, "Innenlader", "FL-IL 557", "2026-03-18", "08:00", "", "Ja", 4, 16124.0, "One-Way", "K", "Werk Tinglev", "Fabrikvej 12", "6360 Tinglev", "HKL 2B", "Lohkampstr.", "Lohkampstraße 22", "Hamburg", "Zone 1", "45518", 0.0, 580.0, 580.0, 0.0, 0.0, 0.0, 0.0, 0.0, 580.0),
        ("A25-00556-07", "A25-00556", 12, "Innenlader", "FL-IL 557", "2026-03-18", "09:30", "", "Ja", 4, 19969.0, "One-Way", "K", "Werk Tinglev", "Fabrikvej 12", "6360 Tinglev", "HKL 2B", "Lohkampstr.", "Lohkampstraße 22", "Hamburg", "Zone 1", "45518", 0.0, 580.0, 580.0, 0.0, 0.0, 0.0, 0.0, 0.0, 580.0),
        ("A25-00556-06", "A25-00556", 12, "Innenlader", "FL-IL 557", "2026-03-18", "11:00", "", "Ja", 3, 19341.0, "One-Way", "K", "Werk Tinglev", "Fabrikvej 12", "6360 Tinglev", "HKL 2B", "Lohkampstr.", "Lohkampstraße 22", "Hamburg", "Zone 1", "45518", 0.0, 580.0, 580.0, 0.0, 0.0, 0.0, 0.0, 0.0, 580.0),
        ("A25-00556-05", "A25-00556", 12, "Innenlader", "FL-IL 557", "2026-03-18", "14:00", "", "Ja", 3, 19770.0, "One-Way", "K", "Werk Tinglev", "Fabrikvej 12", "6360 Tinglev", "HKL 2B", "Lohkampstr.", "Lohkampstraße 22", "Hamburg", "Zone 1", "45518", 0.0, 580.0, 580.0, 0.0, 0.0, 0.0, 0.0, 0.0, 580.0),

        ("A25-00556-11", "A25-00556", 12, "Innenlader", "FL-IL 558", "2026-03-19", "08:00", "", "Ja", 2, 9541.0, "One-Way", "K", "Werk Tinglev", "Fabrikvej 12", "6360 Tinglev", "HKL 2B", "Lohkampstr.", "Lohkampstraße 22", "Hamburg", "Zone 1", "45592", 0.0, 580.0, 580.0, 0.0, 0.0, 0.0, 0.0, 0.0, 580.0),
        ("A25-00556-10", "A25-00556", 12, "Innenlader", "FL-IL 558", "2026-03-19", "09:30", "", "Ja", 4, 15931.0, "One-Way", "K", "Werk Tinglev", "Fabrikvej 12", "6360 Tinglev", "HKL 2B", "Lohkampstr.", "Lohkampstraße 22", "Hamburg", "Zone 1", "45592", 0.0, 580.0, 580.0, 0.0, 0.0, 0.0, 0.0, 0.0, 580.0),
        ("A25-00556-09", "A25-00556", 12, "Innenlader", "FL-IL 558", "2026-03-19", "11:00", "", "Ja", 3, 16181.0, "One-Way", "K", "Werk Tinglev", "Fabrikvej 12", "6360 Tinglev", "HKL 2B", "Lohkampstr.", "Lohkampstraße 22", "Hamburg", "Zone 1", "45592", 0.0, 580.0, 580.0, 0.0, 0.0, 0.0, 0.0, 0.0, 580.0),
        ("A25-00544-01", "A25-00544", 12, "2-Achser", "FL-TR 544", "2026-03-19", "14:00", "", "Ja", 13, 21611.0, "One-Way", "t", "Werk Tinglev", "Fabrikvej 12", "6360 Tinglev", "EFH Otto/Gläser", "Bauvorhaben Gläser", "Hauptstraße 44", "Flensburg", "Zone 1", "45633", 0.0, 420.0, 420.0, 0.0, 0.0, 0.0, 0.0, 0.0, 420.0),

        ("A25-00544-03", "A25-00544", 12, "2-Achser", "FL-TR 545", "2026-03-20", "08:00", "", "Ja", 14, 23079.0, "One-Way", "t", "Werk Tinglev", "Fabrikvej 12", "6360 Tinglev", "EFH Otto/Gläser", "Bauvorhaben Gläser", "Hauptstraße 44", "Flensburg", "Zone 1", "45696", 0.0, 420.0, 420.0, 0.0, 0.0, 0.0, 0.0, 0.0, 420.0),
        ("A25-00544-02", "A25-00544", 12, "2-Achser", "FL-TR 545", "2026-03-20", "09:30", "", "Ja", 14, 22035.0, "One-Way", "t", "Werk Tinglev", "Fabrikvej 12", "6360 Tinglev", "EFH Otto/Gläser", "Bauvorhaben Gläser", "Hauptstraße 44", "Flensburg", "Zone 1", "45696", 0.0, 420.0, 420.0, 0.0, 0.0, 0.0, 0.0, 0.0, 420.0)
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
