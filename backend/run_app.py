import os
import sys
import threading
import time
import webbrowser
import uvicorn
from app.main import app

def open_browser():
    time.sleep(1.5)
    try:
        webbrowser.open("http://127.0.0.1:8000")
    except Exception as e:
        print(f"Could not open browser automatically: {e}")

if __name__ == "__main__":
    print("=" * 65)
    print("  Tiglev Elementfabrik Intranet - Standalone Server Edition")
    print("=" * 65)
    print("[*] Server wird gestartet unter: http://127.0.0.1:8000")
    print("[*] API-Dokumentation (Swagger): http://127.0.0.1:8000/api/v1/docs")
    print("[*] Druecken Sie STRG+C im Konsolenfenster, um den Server zu beenden.\n")

    # Start browser opener in background thread
    threading.Thread(target=open_browser, daemon=True).start()

    # Run Uvicorn directly with app instance
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info", access_log=True)
