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

  // Verify that first-run offline readiness cannot push the mobile Home screen down.
  const layoutContext = await browser.newContext({ viewport: { width: 412, height: 915 } });
  const layoutPage = await layoutContext.newPage();
  await layoutPage.addInitScript(() => {
    window.__elementaCLS = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__elementaCLS += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await layoutPage.goto(`${origin}/#/`, { waitUntil: 'networkidle' });
  await layoutPage.getByRole('heading', { name: 'Make chemistry click.' }).waitFor();
  await layoutPage.locator('.offline-ready-toast').waitFor({ state: 'visible', timeout: 10_000 });
  assert.equal(
    await layoutPage.locator('.offline-ready-toast').evaluate((element) => getComputedStyle(element).position),
    'fixed',
    'Offline-ready confirmation must not participate in document flow',
  );
  const firstRunLayout = await layoutPage.evaluate(() => ({
    cls: window.__elementaCLS,
    statusStackHeight: document.querySelector('.status-stack')?.getBoundingClientRect().height ?? 0,
  }));
  assert.ok(firstRunLayout.statusStackHeight < 1,
    `Offline-ready toast should leave the status stack out of flow; height was ${firstRunLayout.statusStackHeight}px`);
  assert.ok(firstRunLayout.cls < 0.01,
    `First-run mobile Home should remain visually stable; observed CLS was ${firstRunLayout.cls.toFixed(4)}`);
  await layoutContext.close();

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', (error) => failures.push(error.message));

  // Home and the primary navigation must render.
  await page.goto(`${origin}/#/`, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('main h1').count(), 1, 'Home should render one primary heading');

  // Daily goal opens a modal, can be dismissed, and completes only after a correct answer.
  const dailyTask = page.locator('.home-quests button.quest');
  assert.equal(await dailyTask.count(), 1, 'The daily challenge should be an actionable goal');
  await dailyTask.click();
  const dailyDialog = page.getByRole('dialog', { name: 'Daily chemistry challenge' });
  await dailyDialog.waitFor();
  assert.equal(await dailyDialog.locator('.challenge-choices button').count(), 4,
    'The daily challenge dialog should show four answer choices');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.daily-challenge-dialog')?.open,
    null, { timeout: 5_000 });
  await dailyTask.click();
  await dailyDialog.waitFor();

  const dailyChoices = dailyDialog.locator('.challenge-choices button');
  let dailyChallengeSolved = false;
  let sawIncorrectDailyAnswer = false;
  for (let i = 0; i < 4; i += 1) {
    const choice = dailyChoices.nth(i);
    await choice.click();
    const state = await choice.getAttribute('data-state');
    if (state === 'wrong') {
      sawIncorrectDailyAnswer = true;
      assert.equal(await dailyDialog.evaluate((dialog) => dialog.open), true,
        'An incorrect answer must leave the daily challenge open');
      await dailyDialog.getByText('Not quite.', { exact: false }).waitFor();
    }
    if (state === 'right') {
      dailyChallengeSolved = true;
      await page.waitForFunction(() => !document.querySelector('.daily-challenge-dialog'),
        null, { timeout: 5_000 });
      break;
    }
  }
  assert.equal(dailyChallengeSolved, true, 'The daily challenge should close after a correct answer');
  const dailyDone = page.locator('.home-quests button.quest[data-done="true"]');
  await dailyDone.waitFor();
  assert.equal(await dailyDone.isDisabled(), true, 'A completed daily goal should no longer reopen');
  await page.waitForFunction(async () => {
    const dbRequest = indexedDB.open('elementa', 1);
    const db = await new Promise((resolve, reject) => {
      dbRequest.onsuccess = () => resolve(dbRequest.result);
      dbRequest.onerror = () => reject(dbRequest.error);
    });
    const request = db.transaction('kv', 'readonly').objectStore('kv').get('progress');
    const progress = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return progress?.daily?.[key]?.correct === true;
  }, null, { timeout: 10_000 });
  const dailyRecord = await page.evaluate(async () => {
    const dbRequest = indexedDB.open('elementa', 1);
    const db = await new Promise((resolve, reject) => {
      dbRequest.onsuccess = () => resolve(dbRequest.result);
      dbRequest.onerror = () => reject(dbRequest.error);
    });
    const request = db.transaction('kv', 'readonly').objectStore('kv').get('progress');
    const progress = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return progress?.daily?.[key] ?? null;
  });
  assert.deepEqual(dailyRecord, { correct: true }, 'Only a correct daily answer should be saved as completed');
  console.log(`Daily task smoke: incorrect answer kept popup open${sawIncorrectDailyAnswer ? '' : ' (first choice was correct)'}, correct answer closed it.`);

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

  // Covalent molecule selector updates the displayed molecule and electron table.
  await page.goto(`${origin}/#/lab/covalent`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Covalent bonding: sharing electrons' }).waitFor();
  const moleculePicker = page.getByRole('group', { name: 'Choose a molecule' });
  assert.equal(await moleculePicker.getByRole('button').count(), 9, 'Covalent explorer should offer nine molecules');
  await moleculePicker.getByRole('button').last().click();
  await page.locator('.lab-grid h3').getByText('Carbon dioxide').waitFor();

  // Reactions balancing interface should reveal its equation and atom-count feedback.
  await page.goto(`${origin}/#/lab/reactions`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Reactions: what happens to the atoms' }).waitFor();
  await page.getByRole('button', { name: 'Show the answer' }).click();
  await page.getByText('Balanced equation:', { exact: false }).waitFor();

  // The bonding quiz accepts an answer and shows explanatory feedback.
  await page.goto(`${origin}/#/lab/practise`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Practise: bonding' }).waitFor();
  await page.getByRole('radio').first().click();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.locator('.feedback').first().waitFor();
  await page.goto(`${origin}/#/lab/practise/trends`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Practise: periodic trends' }).waitFor();

  // Dedicated Practice and Lab destinations should be reachable on mobile.
  await page.locator('.nav a[href="#/practice"]').click();
  await page.getByRole('heading', { name: 'Practice', exact: true }).waitFor();
  assert.equal(await page.locator('.practice-hub-card').count(), 3, 'Practice should show the three published activities');

  await page.locator('.nav a[href="#/lab"]').click();
  await page.getByRole('heading', { name: 'Virtual lab', exact: true }).waitFor();

  assert.deepEqual(failures, [], 'The browser must not raise uncaught page errors');
  console.log('Browser smoke tests passed: first-run mobile CLS, offline status, daily challenge modal/retry/completion, learning flow, saved progress, mobile layout, theme, Explore, Atomic Explorer, ionic/covalent activities, reaction balancing, both quiz routes, Practice and Lab hubs.');
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}
