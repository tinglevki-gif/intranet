const licenseValidator = require('../desktop-wrapper/licenseValidator');

console.log('Testing getTrialStatus()...');
const status = licenseValidator.getTrialStatus();
console.log('Trial Status Result:');
console.log(JSON.stringify(status, null, 2));

if (status.is_trial !== true) {
  console.error('FAIL: Expected is_trial = true');
  process.exit(1);
}

if (typeof status.remainingDays !== 'number' || typeof status.remainingHours !== 'number') {
  console.error('FAIL: remainingDays or remainingHours is not a number');
  process.exit(1);
}

console.log(`PASS: Remaining: ${status.remainingDays} days and ${status.remainingHours} hours.`);
console.log('PASS: getTrialStatus() test succeeded!');
