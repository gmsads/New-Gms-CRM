const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./eslint-report.json', 'utf8'));
const fileStats = data.map(file => {
    return {
        filePath: file.filePath.replace(process.cwd(), ''),
        errorCount: file.errorCount,
        warningCount: file.warningCount,
        totalIssues: file.errorCount + file.warningCount
    };
});

// Filter out files with no issues
const filesWithIssues = fileStats.filter(f => f.totalIssues > 0);

// Sort by total issues descending
filesWithIssues.sort((a, b) => b.totalIssues - a.totalIssues);

console.log('--- Top 20 Files with Most ESLint Issues ---');
filesWithIssues.slice(0, 20).forEach((f, idx) => {
    console.log(`${idx + 1}. ${f.filePath} - ${f.totalIssues} issues (${f.errorCount} errors, ${f.warningCount} warnings)`);
});
