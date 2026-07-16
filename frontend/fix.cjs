const fs = require('fs');
const file = 'c:/Users/prade/Desktop/gms/frontend/src/components/layout/Sidebar.jsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

const linesToRemove = [424, 425, 433, 434, 486, 487, 515, 516, 534, 535, 613, 614, 628, 629, 851, 852, 853, 854, 855];

const newLines = lines.filter((_, i) => {
  if (i === 115) return true;
  if (linesToRemove.includes(i)) return false;
  return true;
});

// Update line 116 (index 115) to use ADMIN role
newLines[115] = newLines[115].replace(/roles:\s*\['ALL'\]/, "roles: ['ADMIN', 'MD_CEO']");

fs.writeFileSync(file, newLines.join('\n'));
console.log('Sidebar.jsx updated successfully.');
