/**
 * Script to replace placehold.co URLs with via.placeholder.com URLs
 * Run: node scripts/fix-placeholder-images.js <path-to-excel-file>
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Get the Excel file path from command line argument
const excelFilePath = process.argv[2];

if (!excelFilePath) {
  console.error('❌ Please provide the Excel file path as an argument');
  console.log('Usage: node scripts/fix-placeholder-images.js <path-to-excel-file>');
  process.exit(1);
}

if (!fs.existsSync(excelFilePath)) {
  console.error(`❌ File not found: ${excelFilePath}`);
  process.exit(1);
}

console.log(`📄 Reading Excel file: ${excelFilePath}`);

// Read the Excel file
const workbook = XLSX.readFile(excelFilePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet);

console.log(`✅ Found ${data.length} rows`);

let updatedCount = 0;

// Update imageUrl field
data.forEach((row, index) => {
  if (row.imageUrl && row.imageUrl.includes('placehold.co')) {
    const productName = row.productName || 'Product';
    // Replace with via.placeholder.com which actually works
    // Format: https://via.placeholder.com/400x400/f5f0e8/b8952e.png?text=Product+Name
    const encodedName = encodeURIComponent(productName);
    row.imageUrl = `https://via.placeholder.com/400x400/f5f0e8/b8952e.png?text=${encodedName}`;
    updatedCount++;
  }
});

console.log(`✏️  Updated ${updatedCount} image URLs`);

// Convert back to worksheet
const newWorksheet = XLSX.utils.json_to_sheet(data);
workbook.Sheets[sheetName] = newWorksheet;

// Create backup of original file
const backupPath = excelFilePath.replace(/\.xlsx$/, '.backup.xlsx');
fs.copyFileSync(excelFilePath, backupPath);
console.log(`💾 Backup saved: ${backupPath}`);

// Write the updated file
XLSX.writeFile(workbook, excelFilePath);

console.log(`✅ Excel file updated successfully!`);
console.log(`📝 Updated ${updatedCount} placeholder image URLs from placehold.co to via.placeholder.com`);
