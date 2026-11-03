import { appendFile, readFile, writeFile } from 'node:fs/promises';

const reportPaths = process.argv.slice(2);
if (reportPaths.length === 0) {
  throw new Error('Pass one or more Lighthouse JSON report paths.');
}

const reports = await Promise.all(reportPaths.map(async (path) => ({
  path,
  report: JSON.parse(await readFile(path, 'utf8')),
})));

function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function formatScore(value) {
  return value === null ? 'n/a' : String(Math.round(value * 100)) + '/100';
}

function formatMilliseconds(value) {
  if (value === null) return 'n/a';
  if (value >= 1000) return (value / 1000).toFixed(2) + ' s';
  return Math.round(value) + ' ms';
}

const scoreIds = ['performance', 'accessibility', 'best-practices', 'seo'];
const metricIds = [
  ['first-contentful-paint', 'First Contentful Paint'],
  ['largest-contentful-paint', 'Largest Contentful Paint'],
  ['total-blocking-time', 'Total Blocking Time'],
  ['cumulative-layout-shift', 'Cumulative Layout Shift'],
  ['speed-index', 'Speed Index'],
];

const scores = Object.fromEntries(scoreIds.map((id) => [
  id,
  median(reports.map(({ report }) => report.categories?.[id]?.score)),
]));
const metrics = metricIds.map(([id, label]) => {
  const value = median(reports.map(({ report }) => {
    const numericValue = report.audits?.[id]?.numericValue;
    return Number.isFinite(numericValue) ? numericValue : null;
  }));
  const formatted = id === 'cumulative-layout-shift'
    ? (value === null ? 'n/a' : value.toFixed(3))
    : formatMilliseconds(value);
  return { label, value: formatted };
});

const version = reports[0].report.lighthouseVersion ?? 'unknown';
const rows = [
  ['Runs', String(reports.length)],
  ['Lighthouse', version],
  ['Performance', formatScore(scores.performance)],
  ['Accessibility', formatScore(scores.accessibility)],
  ['Best Practices', formatScore(scores['best-practices'])],
  ['SEO', formatScore(scores.seo)],
  ...metrics.map(({ label, value }) => [label, value]),
];

const markdown = [
  '## Lighthouse mobile-profile baseline',
  '',
  'Median of ' + reports.length + ' Lighthouse run(s) against the local production build. This is a simulated mobile lab profile, not real-device field data.',
  '',
  '| Measurement | Median result |',
  '|---|---:|',
  ...rows.map(([label, value]) => '| ' + label + ' | ' + value + ' |'),
  '',
  'Reports: HTML and JSON files are attached to this workflow run.',
  '',
].join('\n');

console.log(markdown);
await writeFile('artifacts/lighthouse/summary.md', markdown, 'utf8');
if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, markdown, 'utf8');
}
