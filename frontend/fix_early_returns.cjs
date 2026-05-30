const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src');
let filesModified = 0;

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  let lines = code.split('\n');
  let modified = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('if (!user) return null;')) {
      lines[i] = lines[i].replace('if (!user) return null;', '');
      // Look forward for the next 'return (' that is likely top-level (starts with 2 spaces)
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].match(/^  return \(/) || lines[j].match(/^    return \(/)) {
          let indent = lines[j].match(/^\s*/)[0];
          lines[j] = indent + 'if (!user) return null;\n' + lines[j];
          modified = true;
          break;
        }
      }
    }
  }

  if (modified) {
    fs.writeFileSync(file, lines.join('\n'));
    console.log('Fixed early returns in', file);
    filesModified++;
  }
});

console.log('Total files modified: ' + filesModified);
