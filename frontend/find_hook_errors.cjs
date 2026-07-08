const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./eslint-report.json', 'utf8'));

const hookFiles = [];

data.forEach(file => {
    let hasHookError = false;
    let hookErrors = [];
    file.messages.forEach(msg => {
        if (msg.ruleId && msg.ruleId.startsWith('react-hooks/') && msg.severity === 2) {
            hasHookError = true;
            hookErrors.push(`${msg.line}:${msg.column} - ${msg.ruleId} - ${msg.message}`);
        }
    });
    if (hasHookError) {
        hookFiles.push({
            file: file.filePath,
            errors: hookErrors
        });
    }
});

fs.writeFileSync('hook_errors_list.json', JSON.stringify(hookFiles, null, 2));
console.log(`Found ${hookFiles.length} files with critical react-hooks errors.`);
