import { spawnSync } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = spawnSync(npmCommand, ['audit', '--json'], {
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024,
});

if (result.error) {
  console.error('Unable to run npm audit:', result.error.message);
  process.exit(1);
}

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  console.error(result.stderr || result.stdout || 'npm audit returned no JSON report.');
  process.exit(result.status ?? 1);
}

const counts = report.metadata?.vulnerabilities ?? {};
const advisories = Object.entries(report.vulnerabilities ?? {}).map(([name, item]) => ({
  package: name,
  severity: item.severity,
  direct: item.isDirect,
  vulnerableRange: item.range,
  fixAvailable: item.fixAvailable,
  via: item.via.map((entry) => typeof entry === 'string'
    ? { dependency: entry }
    : { title: entry.title, url: entry.url, range: entry.range }),
}));

console.log(JSON.stringify({ counts, advisories }, null, 2));

if ((counts.critical ?? 0) > 0 || (counts.high ?? 0) > 0) {
  console.error('High or critical dependency vulnerabilities must be resolved before release.');
  process.exit(1);
}
