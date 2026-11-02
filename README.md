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
npm test           # 101 unit tests
npm run lint       # oxlint (2 known warnings, see below)
npm run data       # regenerate src/data/elements.json from periodic-table-data-complete (MIT)
```

## What is in it

| Area | What it does |
|---|---|
| Explore | Interactive periodic table, search, element detail, "Colour tiles by" overlays for atomic radius, first ionisation energy and electronegativity (rank-based colours, values printed on tiles), plus trend summaries. |
| Atom | Bohr-style diagram: protons, neutrons per isotope, electrons, ion charge |
| Learn | Lesson on atoms, isotopes and ions with a quiz |
| Virtual lab | Hub of activities with deep links (`#/lab/ionic`, `/covalent`, `/reactions`, `/practise`, `/practise/trends`): Ionic bonding (dot-and-cross), covalent molecules, 7 reactions with a balancing challenge, and practice quizzes on bonding and periodic trends |
| Home | Game layer: level and XP ring, daily streak, today's quests, badges, daily challenge, practice tiles with best scores, recent elements. All derived from stored progress (`src/engine/gamify.ts`) |
| Offline | Installable PWA; all screens, quizzes and progress work without internet |

## How correctness is protected

- Element data comes from one dataset, never typed by hand. Unknown values are `null` and shown as "no value", never guessed.
- Everything shown in the lab is computed by pure engines (`src/engine/*`) and tested against independent hand-written oracles: ionic formulas and charges, molecule electron counts, atom totals for isotopes, and trend logic.
- Trend quizzes only ask questions where the data agrees with the general trend, so an answer never contradicts its explanation. Documented exceptions (B < Be, Al < Mg, O < N, S < P) are shown in the explanations.
- Reaction observations and safety notes are static text and are the least machine-checked part: they are intended as educational notes rather than a substitute for formal lab guidance.

## Loading and structure

- Screens load lazily behind `PageLoader`: a thin top progress bar and a page-shaped skeleton, shown only after 200 ms so fast loads never flash. Reduced-motion users get static placeholders.
- Every screen uses `PageHeader` (one h1, eyebrow, description); sub-pages use `Breadcrumbs`.

## Layout

```
src/data       element dataset + lessons
src/engine     pure logic (atoms, config, trends, bonding, reactions, quizzes, progress)
src/components reusable UI      src/screens  routes (hash routing)
src/storage    IndexedDB       src/state    progress context
```

## Tested

- Unit tests (vitest): 101 passing.
- Browser (Playwright, Chromium only): every screen and Lab tab in dark and light themes at 1440px and 375px with axe-core (WCAG 2 A/AA + best practice): 0 violations; all three trend overlays in both themes and sizes: 0 violations; no horizontal scroll at 375px in the Lab.
- Offline (Chromium): after one online visit, hard loads of every screen, Reactions, trends quiz and progress saving work with the network off; update prompt flow checked.

## Not yet tested or done

- Real devices: low-end Android, iOS Safari, install prompt, persistent-storage grant. Only Chromium was used.
- Lighthouse audit (would not launch in the build environment).
- Screen-reader testing with real assistive tech (axe only catches a subset).
- Usability pilot with students; deployment/hosting; analytics. (Stage 6.)
- Known lint warnings: `Learn.tsx` set-state-in-effect, `ProgressContext.tsx` only-export-components.
