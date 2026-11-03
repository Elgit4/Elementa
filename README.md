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

The latest GitHub Actions run for this branch executes dependency auditing, TypeScript type-checking, a production build, Vitest, Oxlint, Playwright browser smoke tests and a Lighthouse mobile-profile audit. The current unit suite has **110 tests** across 10 test files. Oxlint is scoped to `src/` and currently reports zero warnings and zero errors.

The full dependency audit currently reports **4 low-severity dependency-path findings**, all tracing to the same `deepmerge@4.3.1` advisory in the development/build dependency tree. There are **0 moderate, high or critical findings**, and the production-only audit reports **0 vulnerabilities**. The advisory has no published patched version, so the dependency was retained rather than forcing a breaking downgrade. The affected dependency is part of the build tooling and is not included in the production bundle. See [the GitHub advisory](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) for its scope and status.

## Browser smoke coverage

GitHub Actions runs a Playwright Chromium smoke suite against the production preview. It checks first-run mobile layout stability when offline caching completes (CLS below 0.01), verifies the offline-ready confirmation is removed from document flow, and checks primary navigation; course and lesson rendering; formative-check reset between lesson sections; saved lesson position after reload; a 375px mobile viewport without page-level horizontal overflow; theme switching; periodic-table search and element details; isotope selection in the Atomic Explorer; completion and result display in the ionic activity; molecule selection in the covalent activity; reaction-answer reveal; bonding and periodic-trends quiz routes; and the Practice and Lab hubs.

## Lighthouse mobile audit

GitHub Actions runs Lighthouse **three times** against the built production preview using its simulated mobile form factor and throttling profile. The workflow reports the median scores for Performance, Accessibility, Best Practices and SEO, plus First Contentful Paint (FCP), Largest Contentful Paint (LCP), Total Blocking Time (TBT), Cumulative Layout Shift (CLS) and Speed Index. Each run produces HTML and JSON reports; the median summary is added to the workflow summary, and the reports are retained as a downloadable workflow artifact for 30 days.

Latest three-run median on the simulated mobile profile: Performance **98/100**, Accessibility **100/100**, Best Practices **100/100**, SEO **92/100**; FCP **755 ms**, LCP **2.19 s**, TBT **75 ms**, CLS **0.000** (raw CLS **0.000022** in each run), and Speed Index **755 ms**. The original **0.095 CLS** came from inserting the first-run offline-ready confirmation into normal page flow; it is now a fixed, dismissible toast and no longer moves the Home screen. The only remaining measured shift is a negligible navigation-label adjustment when the Inter web font loads. These are synthetic lab measurements from an emulated browser, not measurements from a physical low-end phone or real-user field data. TBT is a lab metric and is not a substitute for field Interaction to Next Paint (INP).

## Bundle performance

The initial JavaScript chunk is **285.50 kB minified (90.06 kB gzip)**, down from 581.42 kB (120.03 kB gzip). The full element dataset and quiz-generation modules are no longer pulled into the initial Home screen bundle. No generated JavaScript chunk now exceeds Vite's 500 kB warning threshold.

The browser and Lighthouse suites are targeted automated checks, not a full visual-regression or assistive-technology test suite.

## Not yet verified

- Real-device behavior on low-end Android and iOS Safari, including the install prompt and persistent-storage grant.
- Full PWA install, offline-first behavior and update flow on real browsers and devices.
- Real-user field Core Web Vitals, including INP, and screen-reader testing with assistive technology.
- Usability pilot with students; deployment/hosting; analytics.
- The published atomic-structure lesson remains draft content awaiting chemistry teacher review.
