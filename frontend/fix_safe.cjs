const fs = require('fs');
const file = 'c:/Users/prade/Desktop/gms/frontend/src/components/layout/Sidebar.jsx';
let content = fs.readFileSync(file, 'utf8');
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("path: '/settings'")) {
    if (lines[i].includes("roles: ['ALL']")) {
      lines[i] = lines[i].replace("roles: ['ALL']", "roles: ['ADMIN', 'MD_CEO']");
    } else if (i === 236 || i === 237 || lines[i].includes("adminMenuConfig") || i === 235 || i === 238) {
      // Leave line 237 alone (index 236)
      // wait, in the grep output, it was line 237, index 236
      continue;
    } else {
      // comment out the line entirely
      lines[i] = '// ' + lines[i];
    }
  }
}

fs.writeFileSync(file, lines.join('\n'));
console.log('Sidebar.jsx updated safely.');
