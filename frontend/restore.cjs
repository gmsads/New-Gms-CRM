const git = require('isomorphic-git');
const fs = require('fs');
const path = require('path');

async function restore() {
  const dir = path.resolve('C:/Users/prade/Desktop/gms');
  try {
    await git.checkout({
      fs,
      dir,
      filepaths: ['frontend/src/modules/sales/components/Panels.jsx'],
      force: true
    });
    console.log('Restore successful');
  } catch (err) {
    console.error('Error:', err);
  }
}

restore();
