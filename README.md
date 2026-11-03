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
npm run data       # regenerate src/data/elements.json from periodic-table-data-complete (MIT)
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
src/data       element dataset + lessons + curriculum
src/engine     pure logic (atoms, config, trends, bonding, reactions, quizzes, progress)
src/components reusable UI      src/screens  routes (hash routing)
src/storage    IndexedDB       src/state    progress context, provider and hook
```

## Automated verification

The latest GitHub Actions run for this branch executes dependency auditing, TypeScript type-checking, a production build, Vitest and Oxlint. The current suite has **108 unit tests** across 10 test files. Oxlint is scoped to `src/` and currently reports zero warnings and zero errors.

The full dependency audit currently identifies 10 low/moderate findings in the development/build dependency tree. The audit also reports production dependencies separately; see the current workflow run for the exact counts. No high or critical findings were reported in the full audit.

## Not yet verified

- A maintained Playwright/browser end-to-end suite is not present in this branch, so there is no current automated claim for screen rendering, keyboard flows or visual regressions.
- Real devices: low-end Android, iOS Safari, install prompt, persistent-storage grant.
- Offline/PWA install and update behavior on real browsers.
- Lighthouse performance/accessibility audit.
- Screen-reader testing with real assistive technology.
- Usability pilot with students; deployment/hosting; analytics.
- The published atomic-structure lesson remains draft content awaiting chemistry teacher review.
