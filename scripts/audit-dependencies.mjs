import { spawnSync } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function runAudit(args) {
  const result = spawnSync(npmCommand, args, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.error) {
    throw new Error(`Unable to run ${args.join(' ')}: ${result.error.message}`);
  }

  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error(result.stderr || result.stdout || `${args.join(' ')} returned no JSON report.`);
  }
}

let fullReport;
let productionReport;
try {
  fullReport = runAudit(['audit', '--json']);
  productionReport = runAudit(['audit', '--omit=dev', '--json']);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const counts = fullReport.metadata?.vulnerabilities ?? {};
const productionCounts = productionReport.metadata?.vulnerabilities ?? {};
const advisories = Object.entries(fullReport.vulnerabilities ?? {}).map(([name, item]) => ({
  package: name,
  severity: item.severity,
  direct: item.isDirect,
  vulnerableRange: item.range,
  fixAvailable: item.fixAvailable,
  via: item.via.map((entry) => typeof entry === 'string'
    ? { dependency: entry }
    : { title: entry.title, url: entry.url, range: entry.range }),
}));

console.log(JSON.stringify({ allDependencies: counts, productionDependencies: productionCounts, advisories }, null, 2));

if ((counts.critical ?? 0) > 0 || (counts.high ?? 0) > 0) {
  console.error('High or critical dependency vulnerabilities must be resolved before release.');
  process.exit(1);
}
