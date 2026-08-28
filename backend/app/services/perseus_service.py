import time
import logging
from typing import Dict, Any, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger("intranet.perseus")

# In-memory cache with 5 minutes TTL
_CACHE: Dict[str, Any] = {
    "infrastructure": None,
    "infrastructure_timestamp": 0,
    "awareness": None,
    "awareness_timestamp": 0,
    "overview": None,
    "overview_timestamp": 0,
}

CACHE_TTL_SECONDS = 300  # 5 minutes


def _get_headers() -> Dict[str, str]:
    token = (settings.PERSEUS_BEARER_TOKEN or "").strip()
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json, text/plain, */*",
        "Origin": "https://my.perseus.de",
        "Referer": "https://my.perseus.de/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    }


def _get_fallback_infrastructure() -> Dict[str, Any]:
    """Fallback corporate infrastructure security metrics for Tinglev Elementfabrik."""
    return {
        "security_score": 94,
        "status": "SECURE",
        "rating": "Sehr gut",
        "domain": "tinglev-elementfabrik.de",
        "scanned_at": "Heute, 04:00 Uhr (Automatisch)",
        "summary": {
            "critical_issues": 0,
            "warnings": 1,
            "passed_checks": 28,
            "total_checks": 29
        },
        "checks": [
            {
                "category": "SSL / TLS Verschlüsselung",
                "status": "PASSED",
                "details": "TLS 1.3 aktiv • Gültiges Zertifikat bis Dez 2026 • HSTS konfiguriert",
                "score": 100
            },
            {
                "category": "E-Mail-Sicherheit (SPF, DKIM, DMARC)",
                "status": "PASSED",
                "details": "DMARC-Policy: reject • DKIM 2048-bit Schlüssel signiert • SPF validiert",
                "score": 100
            },
            {
                "category": "DNSSEC & Domain-Integrität",
                "status": "PASSED",
                "details": "DNSSEC signiert • Keine unbefugten DNS-Änderungen festgestellt",
                "score": 100
            },
            {
                "category": "Offene Server-Ports & Perimeter-Scan",
                "status": "WARNING",
                "details": "Port 80/443 offen (Standard Web) • Port 22 (SSH) nur via VPN erreichbar",
                "score": 85
            },
            {
                "category": "Schwachstellen- & CVE-Analyse",
                "status": "PASSED",
                "details": "0 bekannte CVE-Schwachstellen im externen Perimeter gefunden",
                "score": 100
            }
        ]
    }


def _get_fallback_awareness() -> Dict[str, Any]:
    """Fallback employee security awareness metrics for Tinglev Elementfabrik."""
    return {
        "awareness_index": 88,
        "status": "HIGH_AWARENESS",
        "rating": "Überdurchschnittlich",
        "company_name": "Tinglev Elementfabrik GmbH",
        "total_employees": 37,
        "active_learners": 35,
        "training_completion_rate": 92.5,
        "phishing_simulation": {
            "last_campaign": "Spear-Phishing Q1 2026 (HR-Gehaltsabrechnung Köder)",
            "emails_sent": 37,
            "click_rate": 2.7,
            "report_rate": 86.5,
            "compromised_credentials": 0,
            "status": "EXCELLENT",
            "trend": "-4.2% Klicks im Vergleich zu Vorjahr"
        },
        "completed_courses": [
            {
                "title": "Erkennen von Phishing- & CEO-Fraud-Mails",
                "completion": 97,
                "participants": 36
            },
            {
                "title": "Passwortsicherheit & 2-Faktor-Authentifizierung (2FA)",
                "completion": 94,
                "participants": 35
            },
            {
                "title": "Sicherer Umgang mit Firmen-Laptops & Homeoffice",
                "completion": 89,
                "participants": 33
            },
            {
                "title": "DSGVO & Datenschutz in der Baustellenlogistik",
                "completion": 90,
                "participants": 34
            }
        ]
    }


async def fetch_infrastructure_dashboard(force_refresh: bool = False) -> Dict[str, Any]:
    """
    Fetches Infrastructure & Domain Scan Dashboard from Perseus API:
    GET https://perseus-api.prd.production.my.perseus.de/ptp/security/dashboard
    """
    now = time.time()
    if not force_refresh and _CACHE["infrastructure"] and (now - _CACHE["infrastructure_timestamp"] < CACHE_TTL_SECONDS):
        return _CACHE["infrastructure"]

    base_url = settings.PERSEUS_API_BASE_URL.rstrip("/")
    token = (settings.PERSEUS_BEARER_TOKEN or "").strip()

    if not token or token == "<PEGA_AQUÍ_EL_TOKEN_DE_AUTORIZACIÓN_COMPLETO>":
        logger.info("Perseus: Kein Bearer-Token hinterlegt. Verwende Fallback-Infrastrukturdaten.")
        res = {
            "is_live": False,
            "source": "fallback",
            "message": "Demo-Modus (Live-Token in .env konfigurieren: PERSEUS_BEARER_TOKEN)",
            "data": _get_fallback_infrastructure()
        }
        _CACHE["infrastructure"] = res
        _CACHE["infrastructure_timestamp"] = now
        return res

    endpoint = f"{base_url}/ptp/security/dashboard"
    headers = _get_headers()

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(endpoint, headers=headers)
            
            if response.status_code == 200:
                raw_data = response.json()
                res = {
                    "is_live": True,
                    "source": "perseus_api",
                    "status_code": 200,
                    "message": "Live-Daten von Perseus API synchronisiert",
                    "data": raw_data
                }
                _CACHE["infrastructure"] = res
                _CACHE["infrastructure_timestamp"] = now
                logger.info("Perseus: Infrastruktur-Dashboard erfolgreich live abgerufen.")
                return res
            else:
                logger.warning(f"Perseus API Fehler {response.status_code}: {response.text[:200]}")
                return {
                    "is_live": False,
                    "source": "fallback",
                    "status_code": response.status_code,
                    "message": f"Perseus API antwortete mit Status {response.status_code}. Verwende Fallback.",
                    "data": _get_fallback_infrastructure()
                }
    except Exception as e:
        logger.error(f"Perseus Verbindungsfehler bei {endpoint}: {e}")
        return {
            "is_live": False,
            "source": "fallback",
            "message": f"Verbindungsfehler zur Perseus API: {str(e)}",
            "data": _get_fallback_infrastructure()
        }


async def fetch_awareness_dashboard(force_refresh: bool = False) -> Dict[str, Any]:
    """
    Fetches Employee Awareness & Training Dashboard from Perseus API:
    GET https://perseus-api.prd.production.my.perseus.de/ptp/admin/dashboard
    """
    now = time.time()
    if not force_refresh and _CACHE["awareness"] and (now - _CACHE["awareness_timestamp"] < CACHE_TTL_SECONDS):
        return _CACHE["awareness"]

    base_url = settings.PERSEUS_API_BASE_URL.rstrip("/")
    token = (settings.PERSEUS_BEARER_TOKEN or "").strip()

    if not token or token == "<PEGA_AQUÍ_EL_TOKEN_DE_AUTORIZACIÓN_COMPLETO>":
        logger.info("Perseus: Kein Bearer-Token hinterlegt. Verwende Fallback-Awarenessdaten.")
        res = {
            "is_live": False,
            "source": "fallback",
            "message": "Demo-Modus (Live-Token in .env konfigurieren: PERSEUS_BEARER_TOKEN)",
            "data": _get_fallback_awareness()
        }
        _CACHE["awareness"] = res
        _CACHE["awareness_timestamp"] = now
        return res

    endpoint = f"{base_url}/ptp/admin/dashboard"
    headers = _get_headers()

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(endpoint, headers=headers)
            
            if response.status_code == 200:
                raw_data = response.json()
                res = {
                    "is_live": True,
                    "source": "perseus_api",
                    "status_code": 200,
                    "message": "Live-Daten von Perseus API synchronisiert",
                    "data": raw_data
                }
                _CACHE["awareness"] = res
                _CACHE["awareness_timestamp"] = now
                logger.info("Perseus: Awareness-Dashboard erfolgreich live abgerufen.")
                return res
            else:
                logger.warning(f"Perseus Admin API Fehler {response.status_code}: {response.text[:200]}")
                return {
                    "is_live": False,
                    "source": "fallback",
                    "status_code": response.status_code,
                    "message": f"Perseus API antwortete mit Status {response.status_code}. Verwende Fallback.",
                    "data": _get_fallback_awareness()
                }
    except Exception as e:
        logger.error(f"Perseus Verbindungsfehler bei {endpoint}: {e}")
        return {
            "is_live": False,
            "source": "fallback",
            "message": f"Verbindungsfehler zur Perseus API: {str(e)}",
            "data": _get_fallback_awareness()
        }


async def fetch_perseus_overview(force_refresh: bool = False) -> Dict[str, Any]:
    """
    Returns aggregated Perseus Security & Awareness Hub overview payload combining
    both infrastructure scan and employee training awareness metrics.
    """
    infra = await fetch_infrastructure_dashboard(force_refresh=force_refresh)
    aware = await fetch_awareness_dashboard(force_refresh=force_refresh)

    is_live = infra.get("is_live", False) or aware.get("is_live", False)
    token_configured = bool(settings.PERSEUS_BEARER_TOKEN and settings.PERSEUS_BEARER_TOKEN != "<PEGA_AQUÍ_EL_TOKEN_DE_AUTORIZACIÓN_COMPLETO>")

    return {
        "status": "success",
        "is_live": is_live,
        "token_configured": token_configured,
        "portal_url": "https://my.perseus.de",
        "api_base_url": settings.PERSEUS_API_BASE_URL,
        "last_sync": time.strftime("%d.%m.%Y %H:%M:%S"),
        "infrastructure": infra,
        "awareness": aware
    }


def clear_perseus_cache():
    """Clears in-memory cache to force next API calls to fetch fresh data."""
    _CACHE["infrastructure"] = None
    _CACHE["infrastructure_timestamp"] = 0
    _CACHE["awareness"] = None
    _CACHE["awareness_timestamp"] = 0
    _CACHE["overview"] = None
    _CACHE["overview_timestamp"] = 0
