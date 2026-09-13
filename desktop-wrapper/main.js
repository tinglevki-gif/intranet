const { app, BrowserWindow, ipcMain, clipboard } = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const licenseValidator = require('./licenseValidator');

let mainWindow = null;
let backendProcess = null;
let checkInterval = null;
let currentLicenseState = null;

function waitForBackend(url, timeoutMs = 25000) {
  const startTime = Date.now();
  return new Promise((resolve) => {
    function poll() {
      http.get(url, (res) => {
        if (res.statusCode === 200) {
          resolve(true);
        } else if (Date.now() - startTime < timeoutMs) {
          setTimeout(poll, 400);
        } else {
          resolve(false);
        }
      }).on('error', () => {
        if (Date.now() - startTime < timeoutMs) {
          setTimeout(poll, 400);
        } else {
          resolve(false);
        }
      });
    }
    poll();
  });
}

function startBackendServer() {
  const projectRoot = path.join(__dirname, '..');
  const exeDir = path.dirname(app.getPath('exe'));
  
  const possiblePaths = [
    path.join(exeDir, 'backend', 'dist', 'TiglevIntranetServer', 'TiglevIntranetServer.exe'),
    path.join(exeDir, 'backend', 'TiglevIntranetServer.exe'),
    path.join(projectRoot, 'backend', 'dist', 'TiglevIntranetServer', 'TiglevIntranetServer.exe'),
    path.join(app.getAppPath(), '..', '..', 'backend', 'dist', 'TiglevIntranetServer', 'TiglevIntranetServer.exe'),
    'c:\\Users\\Humbert\\Desktop\\intranet-corp\\backend\\dist\\TiglevIntranetServer\\TiglevIntranetServer.exe'
  ];

  let exePath = null;
  for (const p of possiblePaths) {
    if (require('fs').existsSync(p)) {
      exePath = p;
      break;
    }
  }

  if (exePath) {
    console.log('[Electron] Starting compiled backend executable:', exePath);
    backendProcess = spawn(exePath, [], {
      cwd: path.dirname(exePath),
      detached: false,
      stdio: 'ignore'
    });
  } else {
    console.log('[Electron] Compiled backend exe not found. Spawning via Python runner...');
    const pythonExe = 'C:\\Users\\Humbert\\anaconda3\\python.exe';
    const runPy = path.join(projectRoot, 'backend', 'run.py');
    backendProcess = spawn(pythonExe, [runPy], {
      cwd: path.dirname(runPy),
      detached: false,
      stdio: 'ignore'
    });
  }

  if (backendProcess) {
    backendProcess.on('exit', (code) => {
      console.log(`[Electron] Backend process exited with code ${code}`);
    });
  }
}

function stopBackendServer() {
  if (backendProcess) {
    try {
      backendProcess.kill('SIGTERM');
    } catch (e) {}
    backendProcess = null;
  }
}

function createMainWindow(isTrialValid) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: 'Tinglev Elementfabrik Intranet',
    autoHideMenuBar: true,
    backgroundColor: '#001424',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  mainWindow.setMenuBarVisibility(false);

  if (!isTrialValid) {
    console.log('[Electron] Trial expired or clock tampered. Loading lockout view...');
    mainWindow.loadFile(path.join(__dirname, 'trial-expired.html'));
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
    });
    return;
  }

  // Trial is valid -> load app from backend proxy
  console.log('[Electron] Trial active. Waiting for backend startup on port 8000...');
  waitForBackend('http://127.0.0.1:8000/api/v1/health').then((ready) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (ready) {
        console.log('[Electron] Backend ready. Navigating to http://127.0.0.1:8000...');
        mainWindow.loadURL('http://127.0.0.1:8000');
      } else {
        console.error('[Electron] Backend health check timed out!');
        mainWindow.loadURL('http://127.0.0.1:8000');
      }
      mainWindow.once('ready-to-show', () => {
        mainWindow.show();
      });
    }
  });

  // Start periodic 30s license check & anti-clock-rollback update
  checkInterval = setInterval(() => {
    licenseValidator.updateLastKnownTimestamp();
    const lic = licenseValidator.validateLicense();
    currentLicenseState = lic;
    if (lic.status !== 'VALID') {
      console.log('[Electron] License status changed during runtime to:', lic.status);
      stopBackendServer();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadFile(path.join(__dirname, 'trial-expired.html'));
      }
    }
  }, 30000);
}

// Register IPC handlers
ipcMain.handle('get-license-status', () => {
  return currentLicenseState || licenseValidator.validateLicense();
});

ipcMain.handle('get-trial-status', () => {
  return licenseValidator.getTrialStatus();
});

ipcMain.handle('copy-hardware-id', (event, hwId) => {
  clipboard.writeText(hwId);
  return true;
});

app.whenReady().then(() => {
  console.log('[Electron] App starting. Validating 10-day trial license...');
  currentLicenseState = licenseValidator.validateLicense();
  console.log('[Electron] License validation result:', currentLicenseState);

  if (currentLicenseState.status === 'VALID') {
    startBackendServer();
    createMainWindow(true);
  } else {
    createMainWindow(false);
  }
});

app.on('window-all-closed', () => {
  if (checkInterval) clearInterval(checkInterval);
  licenseValidator.updateLastKnownTimestamp();
  stopBackendServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  licenseValidator.updateLastKnownTimestamp();
  stopBackendServer();
});
