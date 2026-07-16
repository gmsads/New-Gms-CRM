const fs = require('fs');
const file = 'c:/Users/prade/Desktop/gms/frontend/src/components/layout/Sidebar.jsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const dynamic') && lines[i].includes(' = [')) {
    // Check if the previous non-empty line is '  ];'
    let prev = i - 1;
    while (prev >= 0 && lines[prev].trim() === '') prev--;
    
    if (prev >= 0 && !lines[prev].includes('];')) {
      // Remove trailing comma from lines[prev] if exists
      lines[prev] = lines[prev].replace(/,\s*$/, '');
      lines.splice(i, 0, '  ];', '');
      i += 2; // skip the lines we just added
    }
  }
}

// Special check for dynamicHRMenu which is right before isSalesManager
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const isSalesManager = user.role')) {
    let prev = i - 1;
    while (prev >= 0 && lines[prev].trim() === '') prev--;
    if (prev >= 0 && !lines[prev].includes('];')) {
      lines[prev] = lines[prev].replace(/,\s*$/, '');
      lines.splice(i, 0, '  ];', '');
      i += 2;
    }
  }
}

fs.writeFileSync(file, lines.join('\n'));
console.log('Sidebar.jsx syntax fixed successfully.');
