import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUTPUT_DIR = path.join(__dirname, 'docs', 'images', 'user_guide');
const USER_DATA_DIR = path.join(__dirname, 'scratch', 'chrome_profile_clean');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(USER_DATA_DIR)) {
  fs.mkdirSync(USER_DATA_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) {
          reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        } else {
          resolve(msg.result);
        }
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result ? res.result.value : null;
  }

  async navigateAndWait(url, waitTimeMs = 3500) {
    await this.send('Page.navigate', { url });
    for (let i = 0; i < 30; i++) {
      await sleep(250);
      try {
        const state = await this.evaluate('document.readyState');
        if (state === 'complete') break;
      } catch (e) {}
    }
    await sleep(waitTimeMs);
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', {
      format: 'png',
      quality: 100
    });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`[Captured] ${filename} (${(buffer.length / 1024).toFixed(1)} KB) -> ${outPath}`);
    return outPath;
  }

  async setViewport(width, height, isMobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: isMobile,
      screenWidth: width,
      screenHeight: height
    });
    await this.send('Emulation.setVisibleSize', { width, height });
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function run() {
  console.log("Fetching API auth token for SuperAdmin...");
  let authToken = null;
  let authUser = null;
  try {
    const loginRes = await fetch('http://127.0.0.1:8000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'h.senf@tinglev.de', password: 'Passwort123!' })
    });
    const loginData = await loginRes.json();
    authToken = loginData.access_token;
    authUser = loginData.user;
    console.log("Successfully retrieved auth token for:", authUser.full_name);
  } catch (err) {
    console.error("Failed to fetch auth token:", err);
  }

  console.log("\nStarting Chrome Headless...");
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${USER_DATA_DIR}`,
    '--window-size=1440,900',
    '--hide-scrollbars',
    '--disable-gpu',
    '--no-sandbox'
  ]);

  let cdp = null;

  try {
    // Wait for Chrome remote debugging endpoint
    let wsUrl = null;
    for (let i = 0; i < 20; i++) {
      await sleep(500);
      try {
        const res = await fetch('http://127.0.0.1:9222/json/list');
        if (res.ok) {
          const list = await res.json();
          const page = list.find(t => t.type === 'page') || list[0];
          if (page && page.webSocketDebuggerUrl) {
            wsUrl = page.webSocketDebuggerUrl;
            break;
          }
        }
      } catch (e) {
        // retry
      }
    }

    if (!wsUrl) {
      const res = await fetch('http://127.0.0.1:9222/json/new');
      const page = await res.json();
      wsUrl = page.webSocketDebuggerUrl;
    }

    console.log("Connected to Chrome CDP:", wsUrl);
    cdp = new CDPClient(wsUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    // 1. Screenshot 01: Login Dashboard
    console.log("\n[1/9] Capturing 01_login_dashboard.png...");
    await cdp.setViewport(1440, 900, false);
    await cdp.navigateAndWait('http://localhost:5173/login', 3000);
    // Fill in demo inputs for clean visual
    await cdp.evaluate(`
      const emailInput = document.querySelector('input[type="email"]');
      const passInput = document.querySelector('input[type="password"]');
      if (emailInput) {
        emailInput.value = 'h.senf@tinglev.de';
      }
      if (passInput) {
        passInput.value = 'Passwort123!';
      }
    `);
    await sleep(1000);
    await cdp.captureScreenshot('01_login_dashboard.png');

    // Now inject auth token into localStorage and navigate to /gps
    console.log("Injecting auth token & navigating to /gps...");
    await cdp.evaluate(`
      localStorage.setItem('intranet_token', ${JSON.stringify(authToken)});
      localStorage.setItem('intranet_user', ${JSON.stringify(JSON.stringify(authUser))});
    `);
    await cdp.navigateAndWait('http://localhost:5173/gps?tab=MAP', 5000);

    // 2. Screenshot 02: Flottenkarte Übersicht
    console.log("\n[2/9] Capturing 02_flottenkarte_uebersicht.png...");
    await cdp.captureScreenshot('02_flottenkarte_uebersicht.png');

    // 3. Screenshot 03: Fahrzeug Suche & Filter
    console.log("\n[3/9] Capturing 03_fahrzeug_suche_filter.png...");
    await cdp.evaluate(`
      // Find search input
      const searchInputs = document.querySelectorAll('input[type="text"], input[placeholder*="Suche"], input[placeholder*="Kennzeichen"]');
      if (searchInputs.length > 0) {
        const input = searchInputs[0];
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeSetter.call(input, 'MOL-TE 101');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      // Also click 'In Fahrt' filter chip
      const chips = Array.from(document.querySelectorAll('button, span')).filter(el => 
        el.innerText && el.innerText.trim().startsWith('In Fahrt')
      );
      if (chips.length > 0) chips[0].click();
    `);
    await sleep(2500);
    await cdp.captureScreenshot('03_fahrzeug_suche_filter.png');

    // 4. Screenshot 04: Fahrzeug Detail Drawer
    console.log("\n[4/9] Capturing 04_fahrzeug_detail_drawer.png...");
    // Clear search filter so we see the vehicle list and click on vehicle card
    await cdp.evaluate(`
      const searchInputs = document.querySelectorAll('input[type="text"], input[placeholder*="Suche"], input[placeholder*="Kennzeichen"]');
      if (searchInputs.length > 0) {
        const input = searchInputs[0];
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeSetter.call(input, '');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      // Click 'Alle' filter
      const allChips = Array.from(document.querySelectorAll('button, span')).filter(el => 
        el.innerText && el.innerText.trim().startsWith('Alle')
      );
      if (allChips.length > 0) allChips[0].click();
    `);
    await sleep(1500);
    await cdp.evaluate(`
      // Click on vehicle card MOL-TE 101 in the list
      const cards = Array.from(document.querySelectorAll('div, button, li')).filter(el => 
        el.innerText && el.innerText.includes('MOL-TE 101') && (el.className.includes('cursor-pointer') || el.className.includes('rounded'))
      );
      if (cards.length > 0) {
        cards[0].click();
      } else {
        const anyCard = document.querySelector('[class*="cursor-pointer"]');
        if (anyCard) anyCard.click();
      }
    `);
    await sleep(3500); // Allow drawer slide-in animation
    await cdp.captureScreenshot('04_fahrzeug_detail_drawer.png');

    // 5. Screenshot 05: Mobile Bottom Sheet (Viewport 390x844)
    console.log("\n[5/9] Capturing 05_mobile_bottom_sheet.png...");
    await cdp.setViewport(390, 844, true);
    await cdp.navigateAndWait('http://localhost:5173/gps?tab=MAP', 5000);
    // Click on vehicle card or marker to trigger mobile bottom sheet
    await cdp.evaluate(`
      const cards = Array.from(document.querySelectorAll('div, button, li')).filter(el => 
        el.innerText && el.innerText.includes('MOL-TE 101') && (el.className.includes('cursor-pointer') || el.className.includes('rounded'))
      );
      if (cards.length > 0) {
        cards[0].click();
      } else {
        const truckMarkers = document.querySelectorAll('.custom-truck-marker');
        if (truckMarkers.length > 0) truckMarkers[0].click();
      }
    `);
    await sleep(3000);
    await cdp.captureScreenshot('05_mobile_bottom_sheet.png');

    // Restore desktop viewport
    await cdp.setViewport(1440, 900, false);

    // 6. Screenshot 06: Tracking Link Erstellen Dialog
    console.log("\n[6/9] Capturing 06_tracking_link_erstellen.png...");
    await cdp.navigateAndWait('http://localhost:5173/gps?tab=MAP', 4000);
    await cdp.evaluate(`
      // Look for button "Tracking-Link erstellen" or Share button
      const buttons = Array.from(document.querySelectorAll('button'));
      const shareBtn = buttons.find(b => 
        b.innerText.includes('Tracking-Link') || 
        b.innerText.includes('Live-Link') || 
        b.innerText.includes('Freigabe') || 
        b.innerText.includes('Teilen') ||
        b.title?.includes('Tracking')
      );
      if (shareBtn) {
        shareBtn.click();
      }
    `);
    await sleep(2500);
    await cdp.captureScreenshot('06_tracking_link_erstellen.png');

    // 7. Screenshot 07: Tracking Link Baustelle (Öffentliche Kunden-/Montageleiteransicht)
    console.log("\n[7/9] Capturing 07_tracking_link_baustelle.png...");
    await cdp.navigateAndWait('http://localhost:5173/track/test-live-montage-2026', 4500);
    await cdp.captureScreenshot('07_tracking_link_baustelle.png');

    // 8. Screenshot 08: Geofence Standzeiten
    console.log("\n[8/9] Capturing 08_geofence_standzeiten.png...");
    await cdp.navigateAndWait('http://localhost:5173/gps?tab=GEOFENCES', 4000);
    await cdp.captureScreenshot('08_geofence_standzeiten.png');

    // 9. Screenshot 09: Fuhrpark Wartung Kacheln
    console.log("\n[9/9] Capturing 09_wartung_kacheln.png...");
    await cdp.navigateAndWait('http://localhost:5173/gps?tab=MAINTENANCE', 4000);
    await cdp.captureScreenshot('09_wartung_kacheln.png');

    console.log("\nAll 9 user guide screenshots captured successfully!");

  } catch (err) {
    console.error("Error during screenshot capture:", err);
  } finally {
    if (cdp) {
      cdp.close();
    }
    chromeProcess.kill();
    console.log("Chrome process terminated.");
  }
}

run();
