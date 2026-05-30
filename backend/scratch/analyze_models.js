const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// We don't want to actually connect, just inspect schemas
const domainsDir = path.join(__dirname, '../src/domains');

function findModels(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findModels(filePath, fileList);
    } else if (filePath.endsWith('.model.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const modelFiles = findModels(domainsDir);
const report = {
  models: [],
  missingIndexes: [],
  totalCollections: 0
};

modelFiles.forEach(file => {
  try {
    const Model = require(file);
    if (Model && Model.schema) {
      report.totalCollections++;
      const schema = Model.schema;
      const indexes = schema.indexes();
      const paths = schema.paths;
      
      const indexedFields = indexes.map(idx => Object.keys(idx[0])).flat();
      
      const modelInfo = {
        name: Model.modelName,
        collection: Model.collection.name,
        indexes: indexes,
        fields: Object.keys(paths),
        potentiallyMissingIndexes: []
      };

      // Check for fields that might need indexing (like foreign keys / references)
      for (const [pathName, pathType] of Object.entries(paths)) {
        if (pathType.instance === 'ObjectID' && pathName !== '_id' && !indexedFields.includes(pathName)) {
            modelInfo.potentiallyMissingIndexes.push(pathName);
        }
      }

      report.models.push(modelInfo);
    }
  } catch (e) {
    console.error(`Error loading model ${file}:`, e);
  }
});

fs.writeFileSync(path.join(__dirname, 'model_report.json'), JSON.stringify(report, null, 2));
console.log('Model analysis complete. Results in model_report.json');
