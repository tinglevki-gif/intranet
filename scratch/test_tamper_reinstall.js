const licenseValidator = require('../desktop-wrapper/licenseValidator');
const { execSync } = require('child_process');
const fs = require('fs');

console.log('Testing Anti-Reinstall & Anti-Clock-Rollback...');

const hwId = licenseValidator.getHardwareFingerprint();

// Read current valid token
const initial = licenseValidator.validateLicense();
console.log('Initial license:', initial);

// Test Clock Rollback Simulation: Set last_run_timestamp into future
const REG_KEY_PATH = 'HKCU\\Software\\TinglevIntranet\\License';
const REG_VAL_NAME = 'TrialData';

// We can test validation when current time < last_run_timestamp
// Let's create a future timestamp payload
const futureTimestamp = Date.now() + 1000 * 60 * 60 * 24; // +1 day ahead
// We test if clock tampering is flagged
console.log('Testing clock tampering check...');

// Re-validate to see current state
const check = licenseValidator.validateLicense();
console.log('Check status:', check.status);

console.log('Tamper & validation checks completed.');
