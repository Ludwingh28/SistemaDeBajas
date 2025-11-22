// Test Excel serial number to date conversion

function convertExcelSerialToDate(excelSerial) {
  // Excel serial number: días desde 1900-01-01
  // Excel bug: cuenta 1900 como año bisiesto, por eso restamos 2
  const excelEpoch = new Date(1900, 0, 1);
  const jsDate = new Date(excelEpoch.getTime() + (excelSerial - 2) * 86400000);
  return jsDate.toISOString().split('T')[0];
}

// Test cases
const testCases = [
  { serial: 45779, expected: '2025-05-01' }, // May 1, 2025
  { serial: 45415, expected: '2024-05-02' }, // May 2, 2024
  { serial: 44927, expected: '2023-01-01' }, // Jan 1, 2023
];

console.log('🧪 Testing Excel serial number to date conversion:\n');

testCases.forEach(({ serial, expected }) => {
  const result = convertExcelSerialToDate(serial);
  const match = result === expected ? '✅' : '❌';
  console.log(`${match} Serial ${serial} → ${result} (expected: ${expected})`);
});

// Test with the actual value from diagnostic (45779)
console.log('\n📌 Testing diagnostic value:');
const diagnosticSerial = 45779;
const converted = convertExcelSerialToDate(diagnosticSerial);
console.log(`   Serial: ${diagnosticSerial}`);
console.log(`   Converted: ${converted}`);
console.log(`   \n   This date should match what you see in Excel for serial ${diagnosticSerial}`);
