# Elementa: Chemistry Learning

An offline-first, interactive chemistry app for exploring atomic structure, bonding, trends and reactions. React 19 + TypeScript + Vite. No backend: progress is stored on the device in IndexedDB.

## Deploy

Upload the contents of `dist/` (after `npm run build`) to any static host (Netlify, Cloudflare Pages, GitHub Pages, any web server), at the root or in a sub-folder. It must be served over HTTPS for installability and offline use.

## Run it

```bash
npm install
npm run dev        # development
npm run build      # type-check + production build (also generates the service worker)
npm run preview    # serve the production build (needed to test offline/PWA)
npm test           # Vitest unit tests
npm run lint       # Oxlint, scoped to application source
npm run audit      # full and production-only npm dependency audit
npm run data       # regenerate elements.json and compact element-labels.json from the MIT dataset
```

## What is in it

| Area | What it does |
|---|---|
| Explore | Interactive periodic table, search, element detail, "Colour tiles by" overlays for atomic radius, first ionisation energy and electronegativity (rank-based colours, values printed on tiles), plus trend summaries. |
| Atom | Bohr-style diagram: protons, neutrons per isotope, electrons, ion charge |
| Learn | Course/topic/lesson structure; an atomic-structure lesson with a formative check in every section and a final quiz |
| Practice | Dedicated hub for the lesson assessment, bonding practice and periodic-trends practice |
| Virtual lab | Hub of activities with deep links (`#/lab/ionic`, `/covalent`, `/reactions`, `/practise`, `/practise/trends`): Ionic bonding (dot-and-cross), covalent molecules, 7 reactions with a balancing challenge, and practice quizzes on bonding and periodic trends |
| Home | Game layer: level and XP ring, daily streak, today's quests, badges, daily challenge, practice tiles with best scores, recent elements. All derived from stored progress (`src/engine/gamify.ts`) |
| Offline | Installable PWA; all screens, quizzes and progress work without internet after the app shell has been cached |

## How correctness is protected

- Element data comes from one dataset, never typed by hand. Unknown values are `null` and shown as "no value", never guessed.
- Everything shown in the lab is computed by pure engines (`src/engine/*`) and tested against independent hand-written oracles: ionic formulas and charges, molecule electron counts, atom totals for isotopes, and trend logic.
- Trend quizzes only ask questions where the data agrees with the general trend, so an answer never contradicts its explanation. Documented exceptions (B < Be, Al < Mg, O < N, S < P) are shown in the explanations.
- Lesson question IDs, correct choices and misconception feedback are checked by tests.
- Reaction observations and safety notes are static text and are the least machine-checked part: they are intended as educational notes rather than a substitute for formal lab guidance.

## Loading and structure

- Screens load lazily behind `PageLoader`: a thin top progress bar and a page-shaped skeleton, shown only after 200 ms so fast loads never flash. Reduced-motion users get static placeholders.
- Every screen uses `PageHeader` (one h1, eyebrow, description); sub-pages use `Breadcrumbs`.

## Layout

```
src/data       element dataset + compact labels + lessons + curriculum
src/engine     pure logic (atoms, config, trends, bonding, reactions, quizzes, progress)
src/components reusable UI      src/screens  routes (hash routing)
src/storage    IndexedDB       src/state    progress context, provider and hook
```

## Automated verification

The latest GitHub Actions run for this branch executes dependency auditing, TypeScript type-checking, a production build, Vitest and Oxlint. The current suite has **110 unit tests** across 10 test files. Oxlint is scoped to `src/` and currently reports zero warnings and zero errors.

The full dependency audit currently reports **4 low-severity dependency-path findings**, all tracing to the same `deepmerge@4.3.1` advisory in the development/build dependency tree. There are **0 moderate, high or critical findings**, and the production-only audit reports **0 vulnerabilities**. The advisory has no published patched version, so the dependency was retained rather than forcing a breaking downgrade. The affected dependency is part of the build tooling and is not included in the production bundle. See [the GitHub advisory](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) for its scope and status.

## Browser smoke coverage

GitHub Actions runs a Playwright Chromium smoke suite against the production preview. It checks primary navigation; course and lesson rendering; formative-check reset between lesson sections; saved lesson position after reload; a 375px mobile viewport without page-level horizontal overflow; theme switching; periodic-table search and element details; isotope selection in the Atomic Explorer; completion and result display in the ionic activity; molecule selection in the covalent activity; reaction-answer reveal; bonding and periodic-trends quiz routes; and the Practice and Lab hubs.

The initial JavaScript chunk is now **285.50 kB minified (90.06 kB gzip)**, down from 581.42 kB (120.03 kB gzip). The full element dataset and quiz-generation modules are no longer pulled into the initial Home screen bundle. No generated JavaScript chunk now exceeds Vite's 500 kB warning threshold.

These are targeted interaction smoke tests, not a full accessibility or visual-regression suite.

## Not yet verified

- Real-device behavior on low-end Android and iOS Safari, including the install prompt and persistent-storage grant.
- Full PWA install, offline-first behavior and update flow on real browsers and devices.
- Lighthouse performance and accessibility audit.
- Screen-reader testing with real assistive technology.
- Usability pilot with students; deployment/hosting; analytics.
- The published atomic-structure lesson remains draft content awaiting chemistry teacher review.
