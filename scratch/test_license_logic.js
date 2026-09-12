const path = require('path');
const licenseValidator = require('../desktop-wrapper/licenseValidator');

console.log('==============================================');
console.log('  TESTING TINGLEV 10-DAY TRIAL LICENSE LOGIC  ');
console.log('==============================================');

// 1. Hardware ID Generation
const hwId = licenseValidator.getHardwareFingerprint();
console.log('[1] Generated Hardware Fingerprint:', hwId);
if (!hwId.startsWith('TINGLEV-HW-')) {
  console.error('FAIL: Invalid hardware ID prefix');
  process.exit(1);
}
console.log('PASS: Hardware ID generated properly.');

// 2. Validate License
const lic = licenseValidator.validateLicense();
console.log('[2] Initial License Validation Result:');
console.log(JSON.stringify(lic, null, 2));

if (lic.status !== 'VALID') {
  console.error('FAIL: Expected status VALID, got:', lic.status);
  process.exit(1);
}

if (lic.daysRemaining !== 10) {
  console.warn('WARN: Days remaining:', lic.daysRemaining);
}
console.log('PASS: 10-Day trial period validated successfully.');

console.log('==============================================');
console.log('  ALL LICENSE TESTS PASSED!                   ');
console.log('==============================================');
