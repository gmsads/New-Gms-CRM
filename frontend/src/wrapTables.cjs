const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Regex to wrap <table ...> ... </table> in a div. 
  // We avoid wrapping if it's already preceded by the overflow div.
  // Since it's React, it might be indented.
  
  // This is a naive but effective string replacement loop
  let newContent = content;
  
  const targetPrefix = '<div className="overflow-x-auto w-full pb-4">';
  const targetSuffix = '</div>';
  
  let i = 0;
  while ((i = newContent.indexOf('<table', i)) !== -1) {
    // Check if already wrapped
    let before = newContent.substring(Math.max(0, i - 100), i);
    if (!before.includes('overflow-x-auto')) {
      // Find the matching </table>
      let endIndex = newContent.indexOf('</table>', i);
      if (endIndex !== -1) {
        let afterTable = endIndex + 8; // length of </table>
        let inner = newContent.substring(i, afterTable);
        let wrapped = targetPrefix + '\n' + inner + '\n' + targetSuffix;
        newContent = newContent.substring(0, i) + wrapped + newContent.substring(afterTable);
        i += wrapped.length;
      } else {
        i++;
      }
    } else {
      i += 6;
    }
  }

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log('Wrapped tables in', filePath);
  }
}

function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile() && filePath.endsWith('.jsx')) {
            callback(filePath);
        } else if (stat.isDirectory() && name !== 'node_modules') {
            walkSync(filePath, callback);
        }
    });
}

walkSync('c:/Users/prade/Desktop/gms/frontend/src/modules/sales', processFile);
walkSync('c:/Users/prade/Desktop/gms/frontend/src/pages', processFile);
