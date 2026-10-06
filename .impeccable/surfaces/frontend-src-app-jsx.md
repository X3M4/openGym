---
version: 1
slug: "frontend-src-app-jsx"
primary_target: "frontend/src/App.jsx"
related_targets: ["frontend/src/index.css","frontend/src/components/ui.jsx","frontend/src/views/Home.jsx"]
---

## Scope

Whole SuperOpenGym app shell (frontend/src): design system first (tokens, type, base components, tab bar, Home first viewport) in Phase 2; every remaining screen in Phase 9. Mode: Operate. Phone and desktop equal.

## Task and constraints

Between sets one-handed; planning at home; quick daily logs; reviewing trends. Light theme default, dark and "system" offered. ES + EN. Exercise GIFs stay as they are (no 3D data exists). Not clinical, not gym-bro, not childish, not sparse.

## Direction contract

THESIS: The app is a sports identity system in the Munich '72 tradition: every domain of a cut owns a flat colour field and a pictogram on a 45°/90° grid, so you read where you are by colour before you read a word. It refuses the category default of floating white cards with one accent, and the incumbent near-black neon.

OWN-WORLD: White ground, deep navy ink (never pure black), silver for rest and structure. Five fixed domain colours used as whole fields, never sprinkles: training sky blue, body green, nutrition orange, activity yellow, strength violet. One systematic grotesque family (Archivo, widths and weights as a grid: wide for headings, condensed for big numerals). Small 4px corners, no shadows, no gradients, no glass. Rules and colour fields build the layout. Dark theme: navy ground, the same fields slightly lifted.

STORY: The user opens the app and knows at once what today asks: train, or keep the cut on track. Colour tells the domain, the numerals tell the state, one tap starts the job.

FIRST VIEWPORT: Home on a phone. A slim header (date, wordmark, settings). Below it one full-width colour field taking about 45% of the viewport: when a session is due today, a sky-blue training field with the routine name in wide caps, exercises · sets · minutes in condensed numerals, the routine's pictogram, and a full-width "Empezar" bar at the field's foot; when nothing is due, a green body field with trend weight as the largest numeral, weekly rate and goal distance beside it. Under it, the week strip and the domain bands (body, nutrition, activity, strength) as stacked full-width bands, each its own colour edge and one key number. Bottom tab bar with the centre start action.

FORM: Sports identity programme (Munich '72, Otl Aicher), position 1 on the ordered list; seed key 1f25649f; chosen as IMPECCABLE'S PICK. Signature interaction: a domain band expands into its screen with its colour field sweeping to fill the view (View Transitions API, instant fallback). Motion grammar: fields move on straight 90° paths, 200–260ms, ease-out; numerals never bounce.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Coach views: none designed yet.
- Domain bands for nutrition, activity and strength are deferred by product fact: their data does not exist until roadmap Phases 6 (food logging), 7 (Health Connect steps/cardio) and 8 (strength-kept alert). Phase 2 ships the body band (compact green field), the training streak band and the neutral check-in band.
- Signature interaction (band expanding into its screen with View Transitions) is scheduled for Phase 9; only `view-transition-name:dfield` exists.
- Rest-day field: until Phase 5 (trend weight and weekly rate of loss) it shows the latest weigh-in and its change since the previous one, under the heading "Body weight"; trend and weekly rate replace them when that data exists.
- Pictograms are the inherited outline icon set; an authored 45°/90° pictogram set is open for Phase 9.
- Accent picker in Settings conflicts with fixed domain colours; proposed removal to be confirmed with the user.
