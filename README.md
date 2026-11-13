# India Map Explorer

An interactive geography game for kids: explore India's 28 states and 8 Union Territories, learn every district, arrange them in drag-and-drop puzzles, play mini games and take quizzes. Tamil Nadu is the pilot state, with all 38 districts checked by hand and given fun facts.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run validate   # data + game-logic checks
npm run build      # production build
```

## What's inside

| Section | Route | What it does |
| --- | --- | --- |
| Home | `/` | Mascot greeting, level, streak, shortcuts |
| Explore India | `/explore` | Zoomable state map, search, capital / neighbours / district count panel, colour by region |
| Learn States | `/states`, `/states/[id]` | Filterable list; state page with map, capital, languages, districts, places, facts |
| Learn Districts | `/districts`, `/districts/[id]` | District map, tap to reveal name + fact, search, guided tour, next-door districts |
| Map Puzzle | `/puzzle`, `/puzzle/[id]` | Drag (or tap) name cards onto the map. Easy / Medium / Hard, hints, timer, score, stars, retry. `india` = arrange the states |
| Mini games | `/games/*` | Identify the State, Find the Capital, District Explorer, Arrange the States, Neighbour Challenge |
| Quiz Challenge | `/quiz` | Beginner → Intermediate → Advanced (unlock with 2★), full results screen |
| My Progress | `/progress` | Level, points, streak, badges, puzzle and quiz history |
| Parent Corner | `/parent` | Behind a grown-up check: completion, districts learned, quiz scores, learning time, topics to practise, data notes, reset |

Every state and UT has a district map, puzzle and quizzes; adding curated facts is the only per-state work.

## Map data

Boundaries come from the Government of India's **Local Government Directory (LGD)** via [ramSeraph/indian_admin_boundaries](https://github.com/ramSeraph/indian_admin_boundaries) (CC0; attribute datameet and the original government source). It is the December 2023 release: 36 states/UTs, 785 district shapes.

`npm run build:maps` turns the raw files in `data-raw/` into:

- `public/data/india.topo.json` — states and UTs
- `public/data/districts/<state-id>.topo.json` — one file per state
- `src/data/generated/geo-index.json` — district counts, neighbours (computed from shared borders), data status

Geometry is only simplified, never edited. To refresh, download `LGD_States.geojsonl.7z` and `LGD_Districts.geojsonl.7z` from the release pages, extract them into `data-raw/`, and run `npm run build:maps && npm run validate`.

### Verified vs. snapshot

Each state carries a `dataStatus`, shown as a badge in the app:

- **verified** — district list checked against the state's current list, curated names, headquarters and facts. Currently: Tamil Nadu.
- **snapshot** — official LGD boundaries as of Dec 2023; names as written in LGD; no facts yet. Districts created or merged after that date are missing.
- **issues** — the build found a problem or a known later change. Currently Rajasthan: one shape overlapped another and was dropped, and 9 districts were abolished in Dec 2024.

Other states have likely changed too (the snapshot has 52 districts for Madhya Pradesh, which created new ones in 2023). Check each state against its official list before marking it verified.

### Adding a state's content

1. Create `src/data/districts/<state-id>.json` in the same shape as `tamil-nadu.json` (keys are LGD district codes, listed in `geo-index.json`).
2. Register it in `CURATED` in `src/lib/content.ts`.
3. Add the state id to `VERIFIED` in `scripts/build-maps.mjs` once the list is checked, then run `npm run build:maps && npm run validate`.

State-level content (capitals, languages, places, facts) lives in `src/data/states.json`.

## Progress and privacy

Progress is stored in the browser (`localStorage`). No names, emails, photos or locations are collected. Optional cloud backup: create a Supabase project, run `supabase/schema.sql` and `supabase/seed.sql` (`npm run seed:sql` regenerates it), and set the variables from `.env.example`. Progress is then upserted under a random device id. Tighten the RLS policies (e.g. anonymous auth) before using it beyond a pilot.

## Stack

Next.js 16 (App Router), React 19, Tailwind CSS 4, d3-geo + d3-zoom (SVG maps), topojson, canvas-confetti, optional Supabase.
