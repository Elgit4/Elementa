import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const origin = 'http://127.0.0.1:4173';
const server = spawn(process.execPath, [
  'node_modules/vite/bin/vite.js',
  'preview',
  '--host', '127.0.0.1',
  '--port', '4173',
  '--strictPort',
], { stdio: 'inherit', env: process.env });

let browser;
const failures = [];

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Vite preview exited with code ${server.exitCode}`);
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch {
      // The preview server is still starting.
    }
    await delay(250);
  }
  throw new Error('Vite preview did not become ready within 30 seconds');
}

async function waitForStoredSection(page, expectedSection) {
  await page.waitForFunction(async (section) => {
    const dbRequest = indexedDB.open('elementa', 1);
    const db = await new Promise((resolve, reject) => {
      dbRequest.onsuccess = () => resolve(dbRequest.result);
      dbRequest.onerror = () => reject(dbRequest.error);
    });
    const transaction = db.transaction('kv', 'readonly');
    const request = transaction.objectStore('kv').get('progress');
    const progress = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return progress?.lessonPosition?.atoms === section;
  }, expectedSection, { timeout: 10_000 });
}

try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', (error) => failures.push(error.message));

  // Home and the primary navigation must render.
  await page.goto(`${origin}/#/`, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('main h1').count(), 1, 'Home should render one primary heading');
  await page.locator('.nav a[href="#/learn"]').click();
  await page.getByRole('heading', { name: 'Your chemistry courses' }).waitFor();

  // Reproduce the formerly broken state carry-over between two lesson sections.
  await page.getByRole('link', { name: /Start lesson/ }).click();
  await page.getByRole('heading', { name: 'What an atom is made of' }).waitFor();
  await page.getByLabel('Proton', { exact: true }).check();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.getByText('Not quite. Review this idea.', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Next section' }).click();
  await page.getByRole('heading', { name: 'Atomic number: what makes an element' }).waitFor();

  const knowledgeCheck = page.locator('.knowledge-check');
  assert.equal(await knowledgeCheck.locator('input[type="radio"]:checked').count(), 0,
    'A new section must not retain the previous answer');
  assert.equal(await knowledgeCheck.getByRole('button', { name: 'Check answer' }).isDisabled(), true,
    'A new section must allow a fresh answer');

  // The furthest lesson section must survive a browser reload.
  await waitForStoredSection(page, 1);
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Atomic number: what makes an element' }).waitFor();

  // Check mobile layout for page-level horizontal overflow.
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(150);
  const dimensions = await page.evaluate(() => ({
    width: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
  }));
  assert.ok(dimensions.documentWidth <= dimensions.width,
    `Lesson view overflows horizontally at 375px: ${dimensions.documentWidth}px wide`);

  // Theme control remains interactive after hydration.
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');

  // Explore search and the narrow-screen element detail route.
  await page.locator('.nav a[href="#/explore"]').click();
  await page.getByRole('heading', { name: 'Periodic table' }).waitFor();
  await page.getByLabel('Search elements').fill('iron');
  await page.locator('.tile[aria-label^="Iron, symbol Fe"]').click();
  await page.getByRole('heading', { name: 'Iron', exact: true }).waitFor();
  assert.match(await page.locator('.detail-sub').innerText(), /Atomic number 26/);

  // Atomic Explorer loads isotope state from the route.
  await page.goto(`${origin}/#/atom/6?iso=14`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Atomic explorer' }).waitFor();
  assert.match(await page.locator('.atom-controls').innerText(), /carbon-14/i);

  // The ionic lab updates from the selected elements and progresses through its steps.
  await page.goto(`${origin}/#/lab/ionic`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Ionic bonding: electron transfer' }).waitFor();
  await page.getByLabel('Metal', { exact: true }).selectOption('12');
  await page.getByRole('button', { name: 'Next step' }).click();
  await page.getByRole('heading', { name: 'Electrons are transferred' }).waitFor();
  // Advance according to the activity's actual step count; result appears only on the final step.
  let ionicSteps = 0;
  while (await page.getByRole('button', { name: 'Next step' }).count()) {
    await page.getByRole('button', { name: 'Next step' }).click();
    ionicSteps += 1;
    assert.ok(ionicSteps <= 8, 'Ionic activity should have a finite, short sequence');
  }
  await page.getByRole('button', { name: 'Start again' }).waitFor();
  await page.locator('.lab-result').waitFor();
  assert.match(await page.locator('.lab-result').innerText(), /magnesium chloride/i);

  // Dedicated Practice and Lab destinations should be reachable on mobile.
  await page.locator('.nav a[href="#/practice"]').click();
  await page.getByRole('heading', { name: 'Practice', exact: true }).waitFor();
  assert.equal(await page.locator('.practice-hub-card').count(), 3, 'Practice should show the three published activities');

  await page.locator('.nav a[href="#/lab"]').click();
  await page.getByRole('heading', { name: 'Virtual lab', exact: true }).waitFor();

  assert.deepEqual(failures, [], 'The browser must not raise uncaught page errors');
  console.log('Browser smoke tests passed: navigation, knowledge-check reset, progress reload, mobile overflow, theme, Practice and Lab.');
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}
