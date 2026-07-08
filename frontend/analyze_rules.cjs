const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./eslint-report.json', 'utf8'));
const ruleStats = {};
let totalErrors = 0;
let totalWarnings = 0;

data.forEach(file => {
    totalErrors += file.errorCount;
    totalWarnings += file.warningCount;
    file.messages.forEach(msg => {
        const ruleId = msg.ruleId || 'syntax-error';
        if (!ruleStats[ruleId]) {
            ruleStats[ruleId] = { errors: 0, warnings: 0 };
        }
        if (msg.severity === 2) {
            ruleStats[ruleId].errors++;
        } else if (msg.severity === 1) {
            ruleStats[ruleId].warnings++;
        }
    });
});

console.log(`Total Errors: ${totalErrors}`);
console.log(`Total Warnings: ${totalWarnings}`);
console.log('\n--- Rule Breakdown ---');
const sortedRules = Object.entries(ruleStats).sort((a, b) => (b[1].errors + b[1].warnings) - (a[1].errors + a[1].warnings));
sortedRules.forEach(([rule, stats]) => {
    console.log(`${rule}: ${stats.errors} errors, ${stats.warnings} warnings`);
});
