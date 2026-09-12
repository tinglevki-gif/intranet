const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SECRET_PEPPER = 'Tinglev-Intranet-Trial-Protection-Pepper-2026-SecurityKey';
const REG_KEY_PATH = 'HKCU\\Software\\TinglevIntranet\\License';
const REG_VAL_NAME = 'TrialData';
const TRIAL_DURATION_MS = 10 * 24 * 60 * 60 * 1000; // 10 Days in MS

/**
 * Computes a unique, deterministic Windows hardware fingerprint (SHA-256).
 * Extracts CPU Processor ID and Motherboard / System UUID.
 */
function getHardwareFingerprint() {
  try {
    let cpuId = '';
    let sysUuid = '';

    try {
      cpuId = execSync('powershell -Command "(Get-CimInstance Win32_Processor).ProcessorId"', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    } catch (e) {
      try {
        cpuId = execSync('wmic cpu get processorid', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).replace(/ProcessorId|\s/g, '');
      } catch (err) {}
    }

    try {
      sysUuid = execSync('powershell -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    } catch (e) {
      try {
        sysUuid = execSync('wmic csproduct get uuid', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).replace(/UUID|\s/g, '');
      } catch (err) {}
    }

    const raw = `CPU:${cpuId || 'CPU_GENERIC'}|UUID:${sysUuid || 'UUID_GENERIC'}|HOST:${os.hostname()}|SALT:${SECRET_PEPPER}`;
    const hash = crypto.createHash('sha256').update(raw).digest('hex').toUpperCase();
    return `TINGLEV-HW-${hash.substring(0, 4)}-${hash.substring(4, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}`;
  } catch (err) {
    const hash = crypto.createHash('sha256').update(`HOST:${os.hostname()}|USER:${os.userInfo().username}`).digest('hex').toUpperCase();
    return `TINGLEV-HW-${hash.substring(0, 4)}-${hash.substring(4, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}`;
  }
}

/**
 * AES-256 CBC Encrypts payload
 */
function encryptPayload(data, key) {
  const cipherKey = crypto.scryptSync(key, SECRET_PEPPER, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', cipherKey, iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * AES-256 CBC Decrypts payload
 */
function decryptPayload(encryptedText, key) {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) return null;
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const cipherKey = crypto.scryptSync(key, SECRET_PEPPER, 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', cipherKey, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (err) {
    return null;
  }
}

/**
 * Persistence Location 1: Windows Registry (HKCU\Software\TinglevIntranet\License -> TrialData)
 */
function readRegistryToken(hwId) {
  try {
    const cmd = `reg query "${REG_KEY_PATH}" /v ${REG_VAL_NAME}`;
    const output = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const match = output.match(/TrialData\s+REG_SZ\s+(.+)/);
    if (match && match[1]) {
      return decryptPayload(match[1].trim(), hwId);
    }
  } catch (err) {}
  return null;
}

function writeRegistryToken(data, hwId) {
  try {
    const encrypted = encryptPayload(data, hwId);
    const cmd = `reg add "${REG_KEY_PATH}" /v ${REG_VAL_NAME} /t REG_SZ /d "${encrypted}" /f`;
    execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Persistence Location 2: System File (%COMMONPROGRAMFILES%\TinglevData\.trial_token with %PROGRAMDATA% fallback)
 */
function getSystemFilePath() {
  const commonFiles = process.env.COMMONPROGRAMFILES || process.env['ProgramFiles(x86)'] || process.env.ProgramFiles || 'C:\\Program Files\\Common Files';
  const systemDir = path.join(commonFiles, 'TinglevData');
  if (!fs.existsSync(systemDir)) {
    try {
      fs.mkdirSync(systemDir, { recursive: true });
    } catch (e) {
      const programData = process.env.PROGRAMDATA || 'C:\\ProgramData';
      const fallbackDir = path.join(programData, 'TinglevData');
      if (!fs.existsSync(fallbackDir)) {
        try { fs.mkdirSync(fallbackDir, { recursive: true }); } catch (e2) {}
      }
      return path.join(fallbackDir, '.trial_token');
    }
  }
  return path.join(systemDir, '.trial_token');
}

function readFileToken(hwId) {
  try {
    const filePath = getSystemFilePath();
    if (fs.existsSync(filePath)) {
      const encrypted = fs.readFileSync(filePath, 'utf8').trim();
      return decryptPayload(encrypted, hwId);
    }
  } catch (err) {}
  return null;
}

function writeFileToken(data, hwId) {
  try {
    const filePath = getSystemFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const encrypted = encryptPayload(data, hwId);
    fs.writeFileSync(filePath, encrypted, 'utf8');
    try {
      execSync(`attrib +h "${filePath}"`, { stdio: 'ignore' });
    } catch (e) {}
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Core License Validation Algorithm:
 * - Anti-Reinstall: Retains EARLIEST install_timestamp across Registry & Persistent System Token.
 * - Anti-Clock-Rollback: Detects if current time < install_timestamp or < last_run_timestamp.
 * - Expiry Check: Detects if current time > expiry_timestamp (10 days from initial install).
 */
function validateLicense() {
  const hwId = getHardwareFingerprint();
  const regData = readRegistryToken(hwId);
  const fileData = readFileToken(hwId);

  let activeData = null;

  const normalizeData = (d) => {
    if (!d) return null;
    return {
      machineId: d.machineId || hwId,
      install_timestamp: d.install_timestamp || d.installTimestamp || Date.now(),
      expiry_timestamp: d.expiry_timestamp || d.expiryTimestamp || (Date.now() + TRIAL_DURATION_MS),
      last_run_timestamp: d.last_run_timestamp || d.lastKnownTimestamp || Date.now()
    };
  };

  const normReg = normalizeData(regData);
  const normFile = normalizeData(fileData);

  if (normReg && normFile) {
    const installTime = Math.min(normReg.install_timestamp, normFile.install_timestamp);
    const expiryTime = Math.min(normReg.expiry_timestamp, normFile.expiry_timestamp);
    const lastRunTime = Math.max(normReg.last_run_timestamp || 0, normFile.last_run_timestamp || 0);

    activeData = {
      machineId: hwId,
      install_timestamp: installTime,
      expiry_timestamp: expiryTime,
      last_run_timestamp: lastRunTime
    };
  } else if (normReg) {
    activeData = normReg;
  } else if (normFile) {
    activeData = normFile;
  } else {
    // Brand new initial installation on host
    const now = Date.now();
    activeData = {
      machineId: hwId,
      install_timestamp: now,
      expiry_timestamp: now + TRIAL_DURATION_MS,
      last_run_timestamp: now
    };
  }

  activeData.machineId = hwId;

  // Persist to both locations to ensure sync & auto-repair if one was deleted
  writeRegistryToken(activeData, hwId);
  writeFileToken(activeData, hwId);

  const now = Date.now();

  // 1. Anti-Clock-Rollback Protection (Clock Tampered)
  if (now < activeData.install_timestamp || (activeData.last_run_timestamp && now < (activeData.last_run_timestamp - 60000))) {
    return {
      status: 'CLOCK_TAMPERED',
      reason: 'Systemuhr-Manipulation erkannt. Die Systemzeit wurde zurückgedreht. Der Zugriff wurde gesperrt.',
      hardwareId: hwId,
      installDate: new Date(activeData.install_timestamp).toLocaleString('de-DE'),
      expiryDate: new Date(activeData.expiry_timestamp).toLocaleString('de-DE'),
      lastActiveDate: new Date(activeData.last_run_timestamp || now).toLocaleString('de-DE')
    };
  }

  // 2. Trial Expiration Check (10 Days)
  if (now > activeData.expiry_timestamp) {
    return {
      status: 'TRIAL_EXPIRED',
      reason: 'Der 10-tägige Testzeitraum für dieses System ist abgelaufen. Wenden Sie sich zur Freischaltung oder Verlängerung an die IT-Leitung: admin@tinglev.de.',
      hardwareId: hwId,
      installDate: new Date(activeData.install_timestamp).toLocaleString('de-DE'),
      expiryDate: new Date(activeData.expiry_timestamp).toLocaleString('de-DE'),
      lastActiveDate: new Date(activeData.last_run_timestamp || now).toLocaleString('de-DE')
    };
  }

  // Update last run timestamp
  activeData.last_run_timestamp = Math.max(now, activeData.last_run_timestamp || 0);
  writeRegistryToken(activeData, hwId);
  writeFileToken(activeData, hwId);

  const remainingMs = Math.max(0, activeData.expiry_timestamp - now);
  const remainingDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
  const remainingHours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const daysRemaining = Math.max(1, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

  return {
    status: 'VALID',
    daysRemaining,
    remainingDays,
    remainingHours,
    hardwareId: hwId,
    installDate: new Date(activeData.install_timestamp).toLocaleString('de-DE'),
    expiryDate: new Date(activeData.expiry_timestamp).toLocaleString('de-DE'),
    lastActiveDate: new Date(activeData.last_run_timestamp).toLocaleString('de-DE'),
    install_timestamp: activeData.install_timestamp,
    expiry_timestamp: activeData.expiry_timestamp,
    last_run_timestamp: activeData.last_run_timestamp
  };
}

function getTrialStatus() {
  const lic = validateLicense();
  const now = Date.now();
  const expiry = lic.expiry_timestamp || (lic.install_timestamp ? lic.install_timestamp + TRIAL_DURATION_MS : now + TRIAL_DURATION_MS);
  const remainingMs = Math.max(0, expiry - now);
  const remainingDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
  const remainingHours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return {
    is_trial: true,
    isValid: lic.status === 'VALID',
    status: lic.status,
    remainingDays,
    remainingHours,
    daysRemaining: lic.daysRemaining || remainingDays,
    expiryDate: lic.expiryDate,
    installDate: lic.installDate,
    lastActiveDate: lic.lastActiveDate,
    hardwareId: lic.hardwareId,
    reason: lic.reason || null
  };
}

function updateLastKnownTimestamp() {
  const hwId = getHardwareFingerprint();
  const regData = readRegistryToken(hwId);
  const fileData = readFileToken(hwId);
  const rawData = regData || fileData;
  if (rawData) {
    const data = {
      machineId: hwId,
      install_timestamp: rawData.install_timestamp || rawData.installTimestamp || Date.now(),
      expiry_timestamp: rawData.expiry_timestamp || rawData.expiryTimestamp || (Date.now() + TRIAL_DURATION_MS),
      last_run_timestamp: rawData.last_run_timestamp || rawData.lastKnownTimestamp || Date.now()
    };
    const now = Date.now();
    if (now >= (data.last_run_timestamp || 0)) {
      data.last_run_timestamp = now;
      writeRegistryToken(data, hwId);
      writeFileToken(data, hwId);
    }
  }
}

module.exports = {
  getHardwareFingerprint,
  validateLicense,
  getTrialStatus,
  updateLastKnownTimestamp
};

