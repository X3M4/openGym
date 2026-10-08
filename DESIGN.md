---
name: SuperOpenGym
description: A gym and body-composition tracker drawn as a Munich '72 sports identity programme, with flat domain colour fields, navy ink and one systematic grotesque.
colors:
  training-sky: "#3a9fe4"
  sky-deep: "#2a87c9"
  body-green: "#34b06a"
  nutrition-orange: "#f39a33"
  activity-yellow: "#f5c932"
  strength-violet: "#8f80dc"
  rest-silver: "#c4ccd5"
  navy-ink: "#13233f"
  label-secondary: "rgba(19,35,63,.70)"
  label-tertiary: "rgba(19,35,63,.66)"
  rule: "rgba(19,35,63,.16)"
  scrim: "rgba(13,22,38,.5)"
  white-ground: "#ffffff"
  silver-field: "#eef2f6"
  silver-pressed: "#e2e8ef"
  silver-control: "#d3dbe4"
  sky-text: "#1468ad"
  green-text: "#17834a"
  orange-text: "#a85400"
  signal-red: "#c03a17"
  dark-ground: "#0d1626"
  dark-raised: "#111c30"
  dark-surface: "#17233a"
  dark-ink: "#eef2f7"
typography:
  display:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "clamp(30px, 10cqi, 76px)"
    fontWeight: 750
    lineHeight: 0.98
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 112"
  numeral-xl:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "64px"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "-0.02em"
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 78"
  numeral-fact:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "clamp(40px, 12cqi, 96px)"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 78"
  numeral-tile:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "36px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 78"
  numeral-l:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.015em"
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 78"
  headline:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 112"
  title:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.25
    fontVariation: "'wdth' 112"
  exercise-name:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.012em"
    fontVariation: "'wdth' 112"
  body:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.32
    letterSpacing: "0"
    fontFeature: "'tnum'"
  button:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.32
  footnote:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.38
  label-day:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.06em"
  label-section:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    letterSpacing: "0.06em"
    fontVariation: "'wdth' 112"
rounded:
  mark: "3px"
  corner: "4px"
spacing:
  xs: "4px"
  sm: "8px"
  block: "10px"
  gutter: "14px"
  page: "16px"
  field: "18px"
  section: "22px"
components:
  button-primary:
    backgroundColor: "{colors.navy-ink}"
    textColor: "{colors.white-ground}"
    typography: "{typography.button}"
    rounded: "{rounded.corner}"
    padding: "14px 18px"
  button-field:
    backgroundColor: "{colors.training-sky}"
    textColor: "{colors.navy-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.corner}"
    padding: "14px 18px"
  button-field-hover:
    backgroundColor: "{colors.sky-deep}"
  button-secondary:
    backgroundColor: "{colors.silver-pressed}"
    textColor: "{colors.navy-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.corner}"
    padding: "14px 18px"
  button-secondary-hover:
    backgroundColor: "{colors.silver-control}"
  button-tinted:
    backgroundColor: "{colors.silver-pressed}"
    textColor: "{colors.sky-text}"
    typography: "{typography.button}"
    rounded: "{rounded.corner}"
    padding: "14px 18px"
  button-ghost:
    textColor: "{colors.sky-text}"
    rounded: "{rounded.corner}"
    padding: "14px 18px"
  button-small:
    rounded: "{rounded.mark}"
    padding: "8px 14px"
  domain-field-training:
    backgroundColor: "{colors.training-sky}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.corner}"
    padding: "18px 18px 0"
  domain-field-body:
    backgroundColor: "{colors.body-green}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.corner}"
    padding: "18px 18px 0"
  domain-field-active:
    backgroundColor: "{colors.training-sky}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.corner}"
    padding: "18px 18px 0"
  field-go-bar:
    backgroundColor: "{colors.navy-ink}"
    textColor: "{colors.white-ground}"
    height: "56px"
  domain-band:
    backgroundColor: "{colors.silver-field}"
    textColor: "{colors.navy-ink}"
    typography: "{typography.title}"
    rounded: "{rounded.corner}"
    height: "64px"
  domain-band-square:
    textColor: "{colors.navy-ink}"
    width: "64px"
  coach-band-square:
    backgroundColor: "{colors.navy-ink}"
    textColor: "{colors.white-ground}"
    width: "64px"
  plan-day-square:
    backgroundColor: "{colors.training-sky}"
    textColor: "{colors.navy-ink}"
    width: "56px"
  plan-day-square-rest:
    backgroundColor: "{colors.rest-silver}"
    textColor: "{colors.navy-ink}"
    width: "56px"
  stat-tile:
    backgroundColor: "{colors.silver-field}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.corner}"
    padding: "16px 14px 14px"
  pr-badge:
    backgroundColor: "{colors.activity-yellow}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.mark}"
    padding: "3px 8px"
  set-number:
    backgroundColor: "{colors.silver-pressed}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.mark}"
    size: "26px"
  set-number-next:
    backgroundColor: "{colors.training-sky}"
    textColor: "{colors.navy-ink}"
  set-number-done:
    backgroundColor: "{colors.body-green}"
    textColor: "{colors.navy-ink}"
  set-check-done:
    backgroundColor: "{colors.body-green}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.mark}"
    size: "30px"
  card:
    backgroundColor: "{colors.silver-field}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.corner}"
    padding: "16px"
  list-row:
    textColor: "{colors.navy-ink}"
    padding: "11px 14px"
    height: "46px"
  input-field:
    backgroundColor: "{colors.silver-field}"
    textColor: "{colors.navy-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.corner}"
    padding: "13px 15px"
  chip:
    backgroundColor: "{colors.silver-field}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.corner}"
    padding: "6px 13px"
  chip-selected:
    backgroundColor: "{colors.navy-ink}"
    textColor: "{colors.white-ground}"
  tag:
    backgroundColor: "{colors.silver-pressed}"
    textColor: "{colors.label-secondary}"
    rounded: "{rounded.mark}"
    padding: "3px 7px"
  switch-on:
    backgroundColor: "{colors.body-green}"
    rounded: "{rounded.corner}"
    width: "50px"
    height: "30px"
  week-day-today:
    backgroundColor: "{colors.navy-ink}"
    textColor: "{colors.white-ground}"
    rounded: "{rounded.corner}"
    size: "32px"
  tab-start:
    backgroundColor: "{colors.training-sky}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.corner}"
    size: "54px"
  tab-start-running:
    backgroundColor: "{colors.training-sky}"
    textColor: "{colors.navy-ink}"
  toast:
    backgroundColor: "{colors.navy-ink}"
    textColor: "{colors.white-ground}"
    rounded: "{rounded.corner}"
    padding: "11px 18px"
  rest-timer:
    backgroundColor: "{colors.silver-field}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.corner}"
    padding: "12px 14px"
---

# Design System: SuperOpenGym

## Overview

**Creative North Star: "The Games Programme"**

SuperOpenGym is drawn as a sports identity system in the Munich '72 tradition of Otl Aicher. Each domain of a cut (training, body, nutrition, activity, strength) owns one flat colour, and that colour arrives as a whole field, never as a sprinkle. You know where you are from the colour before you read a word. The numerals report the state, and every field has one job, done with one tap on the ink bar at its foot.

The ground is white in light mode (the default, chosen for bright gyms and daylight) and deep navy in dark mode. Ink is a deep navy, never black. Silver carries rest, structure and every neutral grouping. One grotesque family, Archivo, does all the typographic work through its width axis: wide capitals for headings and routine names, condensed tabular figures for the big numbers, and normal width for reading. Corners are a small 4px everywhere. Surfaces are flat, layout is built from colour fields, silver tone steps and hairline rules, and nothing floats.

Density is calm rather than sparse. One field leads the first viewport, then stacked full-width bands each carry one key number. Motion is straight and short. Fields travel on straight paths in 200–260ms with an ease-out, and numerals never bounce or count up.

**Key Characteristics:**
- Five fixed domain colours used as whole fields, plus silver for rest.
- Navy ink in both themes. Ink on any coloured field is always navy.
- One family, Archivo Variable, with its width axis as the type grid (wide 112, condensed 78).
- One 4px corner (3px on small marks). No pills, no circles on containers.
- Flat. No cast shadows, gradients or glass, including the scrim and the pinned bars.
- The primary action is a full-width ink bar.

### Coverage and open items

Redesigned in this world (Phase 2): the tokens and both themes; the type scale; base components (buttons, cards, inset list rows, chips, tags, text fields, switch, segmented control, toast, rest timer, sheets and centred dialogs); the tab bar and its desktop rail; and the Home screen (header, domain field, week strip, body band, streak and check-in bands). Phases 5 to 8 added the Body and Nutrition screens with their top fields, and the nutrition, activity and strength bands on Home.

Redesigned in Phase 9: the authored pictogram set (components/Icon.jsx), section labels, the Start chooser and the running workout (Workout), Plan and its Coach entry, RoutineEdit's header, the Stats tiles, the PR badge, the set rows and check marks, the history rows' routine squares, and the signature `field` transition. The accent picker is gone: the accent is fixed to Training Sky.

Token-inherited only: Library, History, Settings, Admin, Login, Check-in, Muscles and the Coach chat. These pick up colour, type and corners through the shared tokens but keep their inherited layouts.

## Colors

A white and silver ground with navy ink. Colour comes only from five domain fields and one silver rest field, each flat and saturated enough to read across a gym.

### Primary
- **Training Sky** (training-sky): the training domain and the system accent. Fills the training field on Home (also while a session runs), the centre Start square in the tab bar in both its idle and running states, the active-tab marker bar, the workout progress bar, the next set's number square, a training day's square on Plan, routine squares in lists, the rest timer's top rule and progress fill, and the `field` button. The accent is fixed to it: there is no accent picker. Its pressed/hover step is **Sky Deep** (sky-deep). In dark theme the field lifts to #4eaaee.

### Secondary (the other domain fields)
- **Body Green** (body-green): body weight and composition. Used for the rest-day field, the compact body band, the Body screen's top field, the "on" state of the switch, a done set's number square and tick, and the Stats tile stripe for body weight. Dark: #47c07e.
- **Nutrition Orange** (nutrition-orange): the nutrition domain only: the Nutrition screen's top field and the nutrition band's square on Home. It no longer marks a session in progress; a running session stays sky. Dark: #f6a64b.
- **Activity Yellow** (activity-yellow): steps and cardio, as the activity band's square on Home. It also fills the PR badge as a solid field. Dark: #f7d04c.
- **Strength Violet** (strength-violet): strength kept, as the deficit-alert squares and washes. Dark: #a397ea.
- **Rest Silver** (rest-silver): rest and neutral domains, such as the check-in band's square. Dark: #8a96a6.

### Tertiary (text-safe tones)
Domain colours are too light to set words on the white ground, so each has a darker text-safe tone for words, links, icons and thin strokes on the ground: **Sky Text** (sky-text; links, ghost buttons, focus ring, caret), **Green Text** (green-text), **Orange Text** (orange-text, #a85400 for AA on white; nutrition words and icons) and **Signal Red** (signal-red; destructive rows and buttons). In dark theme these lift to light tints (#6cb8f2, #5fd093, #f8ae5c, #ff7a59). The sheet also keeps a legacy set of text-safe tones (yellow, teal, indigo, pink, purple, mint, brown, grey) for inherited per-category tints in list-row icons.

### Neutral
- **Navy Ink** (navy-ink): all primary text, the primary button, the go bar, the selected chip, today in the week strip, the toast. It is also the ink on every coloured field in light theme.
- **Secondary / Tertiary Label** (label-secondary, label-tertiary): navy at 70% and 66% for supporting text, placeholders and inactive tab labels (66% holds AA on white; dark theme keeps light ink at 54%).
- **Rule** (rule): navy at 16% for hairlines between rows, the tab bar's top edge and the desktop rail's edge.
- **White Ground** (white-ground): page ground, sheets, bars and dialogs in light theme. The connection bar and the pinned workout header sit on it solid.
- **Scrim** (scrim): the modal scrim, a flat 50% wash of the darkest navy with no blur.
- **Silver Field** (silver-field): cards, inset lists, bands, text fields, chips and the rest timer.
- **Silver Pressed** (silver-pressed): the pressed/hover state of any silver surface, the default button and tags.
- **Silver Control** (silver-control): control tracks such as the off switch, plus the default button's hover.
- **Dark theme**: the ground is **Dark Ground** (dark-ground), bars and sheets sit on **Dark Raised** (dark-raised), and groups sit on **Dark Surface** (dark-surface). Text is **Dark Ink** (dark-ink). Ink on fields stays the darkest navy (#0d1626), so fields read the same way in both themes. The ink bar inverts with the theme and becomes a near-white bar with navy words.

### Named Rules
**The Field, Not Sprinkle Rule.** A domain colour appears as a whole field, a full-height band square, or a solid rule (3px marker or timer edge). It never sets body text on the ground. Words on the ground use the matching text-safe tone.

**The Navy Ink Rule.** Ink is navy, never #000. Anything drawn on a domain field, including chart lines, goal lines and axis labels, uses the on-field navy in both themes.

**The Own Domain Rule.** Each domain colour belongs to its domain. Orange is nutrition only; a session in progress is training and stays sky. The one standing borrow is the PR badge, a solid Activity Yellow field with navy ink. Do not take a domain colour for decoration elsewhere.

## Typography

**Display Font:** Archivo Variable (with Archivo, then system-ui)
**Body Font:** Archivo Variable (same family)

**Character:** A single systematic grotesque whose width axis is the grid. Wide caps give the voice of a sports programme, condensed tabular figures give scoreboard numerals, and normal width carries plain reading. The font is self-hosted via `@fontsource-variable/archivo/wdth.css` so both axes are always available.

### Hierarchy
- **Display** (750, clamp(30px, 10cqi, 76px), 0.98, wide, UPPERCASE): the routine name or session name in a domain field. This is the only uppercase heading in the system, and it is content (the routine's own name), not a label.
- **Headline** (700, 32px, dropping to 28px under 420px, 1.04, wide): page titles in the header row.
- **Field lead** (700, clamp(20px, 5.6cqi, 30px), wide): the heading of a non-poster field such as "Body weight".
- **Title** (700, 18px, wide): domain band titles. Card titles use 17px/650 wide.
- **Body** (400, 17px, 1.32): reading text and list-row titles. Tabular figures are on globally.
- **Footnote / sub** (400, 13–15px): secondary lines in rows, bands and field notes (15px/600 on fields).
- **Exercise name** (700, 22px, 1.15, wide): the exercise heading in the running workout; 17px in compact and dense modes.
- **Section label** (700, 12px, 0.06em, wide, uppercase, label-secondary): `h4.sec` over grouped lists, 24px above and 9px below. A signpost for the group under it, not a kicker over a heading. Stats tile labels use the same voice at 0.05em.
- **Label** (600, 11px, 0.06em, uppercase): weekday initials in the week strip. Plan's day squares carry the first two letters of the weekday at 17px/700 wide uppercase. Tab labels are 11px/500 (12px on the desktop rail).
- **Numerals** (700, condensed 78, tabular): 64px for the hero weigh-in, clamp(40px, 12cqi, 96px) for field facts (exercises, sets, minutes), 40px in compact bands, 36px in Stats tiles, 26px for the rest timer clock. Set numbers (13px/700) and set values in the workout are condensed and tabular too. Units sit beside them at 17–20px and normal width.

### Named Rules
**The Axis Grid Rule.** Use one family and three widths: wide (112%) for headings, condensed (78%) for big numerals, and normal for reading. Do not introduce a second family. The one exception is the monospace account ID.

**The Still Numeral Rule.** Numerals are tabular and never animate, count up or bounce. A changed value simply appears.

## Layout

The phone is a single column, max 560px wide, with 16px page padding. Blocks stack with a 10px gap, and grouped lists are separated by 22px. The first block on Home is one full-width domain field with a minimum height of clamp(280px, 38vh, 380px). It is a container query context (`cqi`), so its title, pictogram and numerals scale with the field rather than the viewport. Under it, the week strip card and the full-width domain bands stack.

At 1000px and above, the tab bar docks as a 96px rail on the left edge with a hairline. The app widens to 1080px, and single-column "narrow" pages hold 640px. Home becomes a two-column grid (1.05fr / 1fr, 14px gutter): the field holds the left column at at least 380px tall and grows its pictogram, while the week strip and bands read beside it. Full-width list pages go two-up at this width. Sheets centre at 640px and the rest timer at 520px.

Bottom padding reserves 88px plus the safe-area inset for the tab bar, and 206px while a rest timer is up. Safe areas come from `env()` or the Android-provided `--native-sat`/`--native-sab`, whichever is larger.

**The Full-Width Band Rule.** Domain content is laid out as full-width stacked bands and fields, not a grid of floating cards. On desktop the grid is two columns, never a mosaic.

## Elevation & Depth

The system is flat. Depth comes from tone steps (white ground, then silver field, then silver pressed, then silver control) and from colour fields, separated by hairline rules. Overlays carry no shadow and are solid. The modal scrim is a flat rgba(13,22,38,.5) with no blur; the connection bar and the pinned workout header are solid ground with no glass. The tab bar is solid with a hairline top edge, the rest timer is solid silver with a 3px training-sky rule on top, the toast is a solid ink bar, and centred dialogs are solid with a hairline border. 1px inset strokes (`inset 0 0 0 1px` in the rule colour) outline the segmented control's thumb and the switch knob. A 2px inset stroke in sky-text marks a focused text field, a 2px inset in label-secondary draws an open check box, a 1px inset rule frames exercise media, a 4px inset top stripe in its domain colour marks a Stats tile, and a 3px inset ink bar on top marks the running Start square. These are strokes, not shadows.

### Named Rules
**The Flat Field Rule.** Never use a cast shadow, glow, gradient or backdrop blur on a redesigned surface. To lift something, step its tone or give it a rule.

## Shapes

There is one corner: a small 4px radius on fields, bands, cards, buttons, chips, fields, the tab Start square, the today marker, the toast, the timer and the sheet's top edge. Small marks use 3px: tags, small buttons, list-row icon tiles, the switch knob, the segmented thumb, progress bars and the focus ring. Week-strip dots are 6px squares with a 1px radius. A domain band's colour square is cut flush by the band's own corner (overflow clipped), and the go bar runs edge to edge across a field's foot. Interface icons use square caps and miter joins so they sit on the same orthogonal grid. Sport pictograms (Icon.jsx's `fig()`) are Aicher figures: a solid round head and limb bars of one heavy weight (2.9 on the 24 grid) on the 45° grid, with round caps and round joins. Equipment beside a figure is drawn as solid blocks. Both families draw in currentColor.

**The One Corner Rule.** Use 4px, or 3px on small marks. No container or action is a pill or a circle. The Start action is a square, not a disc. Round forms belong only to the objects themselves: a pictogram's head, a plate, a wheel.

## Components

### Buttons
Solid, square-cornered bars that fill their row by default.
- **Shape:** 4px corner, 3px on small (8px 14px) and extra-small (5px 10px) sizes. Default padding is 14px 18px at full width, 17px/600.
- **Primary:** the ink bar, with navy-ink fill and white-ground words (inverted in dark). Hover/press mixes 14% training-sky into the ink.
- **Field:** the training-sky fill with navy words, and sky-deep on hover/press. Use it where the action belongs to the training domain.
- **Default / Tinted / Danger / Ghost:** silver-pressed (hover silver-control); silver-pressed with sky-text words; a 15% wash of signal-red with red words; text-only sky-text that gains a silver field on hover.
- **States:** press scales to 0.98 in 140ms. Disabled is 32% opacity. Focus-visible is a 2.5px sky-text outline offset 2px.

### Domain Field (signature)
The identity in one block: a full-width field in the colour of what today asks for. Training is sky, a session in progress stays sky, and rest days and body weight are green. The Start chooser opens on the same training field for today's plan, with other routines as training bands under it.
- **Poster form** (training, in progress): the pictogram owns the top at clamp(84px, 30cqi, 220px). The routine name follows in wide uppercase display, then a facts row of label (13px/600 at 82%) over condensed numeral, and finally the go bar.
- **Body form:** a "Body weight" lead with a 56px corner pictogram, a note line, the weigh-in as a 64px condensed numeral with unit and delta, a navy-on-green line chart against the goal line, and an action row.
- **Go bar:** a 56px full-bleed ink bar across the field's foot (18px/700) holding the field's one action. In an action row, secondary actions are ghost segments: a 12% navy wash with a hairline divider, 20% on press.
- **Compact band variant:** the body form at a smaller scale (30px pictogram, 40px numeral, 96px chart). It is used under the training field on days when training leads.

### Domain Band
A 64px-tall silver row led by a 64px square of its domain's colour holding the pictogram (26px, navy). It has a wide 18px/700 title, a 14px secondary line and a trailing chevron or icon. Press and hover step it to silver-pressed.

### Field Transition (signature)
Tapping a Home band or the body field's link opens its screen through one View Transition named `field` (lib/field-nav.js). The tapped band's square, or the field itself, takes the name, and the destination's top field (`.dfield-dest`, on Body and Nutrition) holds it, so the colour grows from the square into the screen's field in 240ms on `var(--ease)`, anchored top left, while the rest of the page cross-fades in 200ms. With reduced motion or no View Transitions support it is a plain navigation.

### Plan
- **Day rows:** each weekday is a silver row at least 56px tall led by a full-height 56px square holding the weekday's first two letters. Training days fill the square in Training Sky and list their routines beside it; rest days fill it in Rest Silver, set the day name in label-secondary and carry a "Rest" tag.
- **Routine rows:** the routine's pictogram sits on a 30px Training Sky square with navy ink (also in history rows at 36px).
- **Coach entry:** a silver band led by a full-height 64px navy-ink square holding the coach glyph in the ground colour, with a wide 17px/700 title, a 13px line and an ink chevron. Press steps it to silver-pressed.
- **RoutineEdit header:** the routine name as a wide 22px/700 input on a 2px ink underline, and the glyph picker as a 46px Training Sky square.

### Workout
- **Progress:** a 6px square-ended bar in Training Sky on silver-pressed.
- **Set rows:** a 26px set-number square (silver-pressed, 13px/700 condensed). The next set to do is a Training Sky square, a done set a Body Green square; done rows keep full opacity. The tick is a 30px square with a 2px label-secondary stroke that fills Body Green with a navy tick when done.
- **Navigation:** Next is a 56px ink bar (18px) that takes the rest of the row; Prev is a quiet silver button sized to its content.
- **Progression line:** a 13px navy line on a silver block with a 3px corner, warnings included.

### Stats Tiles and PR Badge
- **Tile:** silver-field, 4px, 16px 14px 14px, with a 4px domain stripe across the top (Training Sky by default, Body Green for body weight). The label is 12px/700 wide uppercase in label-secondary with a 15px icon; the value is a 36px condensed tabular numeral.
- **PR badge:** a solid Activity Yellow field with navy ink, 3px corner, 3px 8px, 12px/700, with a trophy icon.

### Cards / Containers
- **Corner Style:** 4px.
- **Background:** silver-field on the white ground. Inset lists use the same silver block with hairline-separated rows.
- **Shadow Strategy:** none (see Elevation).
- **Border:** none. Separation comes from tone.
- **Internal Padding:** 16px for cards; list rows 11px 14px at a minimum of 46px. Row hairlines start after the icon rail (55px) so the list reads as one object.

### Chips and Tags
- **Chip:** silver-field, 4px, 6px 13px, 14px/400. Selected is a navy-ink fill with white words at 600. Rows scroll sideways with a 6px invisible hit extension.
- **Tag:** silver-pressed, 3px, 3px 7px, 12px/500 in label-secondary. The accent tag keeps silver-pressed and sets its words in sky-text.

### Inputs / Fields
- **Style:** silver-field fill, no border, 4px, 13px 15px, 17px. Placeholder is label-tertiary.
- **Focus:** a 2px inset sky-text stroke, transitioned in 140ms.
- **Switch:** a 50×30 track with a 4px corner, silver-control off and body-green on. The knob is a white 26px square with a 3px corner that slides in 230ms and widens on press.
- **Segmented control:** a silver track (silver-field in light) with a sliding white 3px-cornered thumb outlined by a 1px inset rule. The selected label is 600 and the others are label-secondary at 400.

### Navigation
- **Phone tab bar:** fixed to the bottom on the raised ground with a hairline top edge. Labels are 11px/500 in label-secondary under 24px outline icons. The active tab turns ink at 650 with a heavier stroke and a 28×3px training-sky bar above it.
- **Start action:** a 54px training-sky square with a 4px corner and a navy glyph, raised 24px above the bar. While a session runs it stays training-sky and gains a 3px ink bar across its top edge (an inset stroke); its label stays ink. Nothing pulses or pings.
- **Desktop rail:** at 1000px and above, a 96px rail on the left edge with a hairline. The active marker becomes a 3×30px bar on the rail's edge.

### Week Strip
Seven equal columns. Each has an 11px uppercase weekday label, a condensed 19px date, and a 6px square status dot: navy at 20% when planned, solid ink when done, and an ink outline when rescheduled. Today is a 32px navy-ink square with white numerals.

### Rest Timer and Toast
- **Rest timer:** a solid silver bar above the tab bar with a 3px training-sky rule on top. It has a 26px tabular clock, a 4px progress bar in the accent, and its controls on a second row on phones. A work timer swaps the rule for a hairline accent outline and sky-text clock.
- **Toast:** a solid ink bar with a 4px corner, 15px/500, up to 88vw wide. It never becomes a pill.

### Sheets and Dialogs
Bottom sheets sit on the raised ground with 4px top corners, a 36×5px grab mark and a 20px/600 title. On desktop they centre at 640px. Centred dialogs are 300px (340px on desktop), solid, with a hairline border. Both sit over a flat rgba(13,22,38,.5) scrim with no blur.

## Do's and Don'ts

### Do:
- **Do** fill whole regions with a domain colour (a field, a band square or a 3px rule) and set navy ink on it in both themes.
- **Do** put a field's one action in a full-bleed ink bar at its foot, 56px tall.
- **Do** set headings and routine names wide, big numbers condensed and tabular, and reading text at normal width, all in Archivo.
- **Do** keep every corner at 4px, or 3px on small marks.
- **Do** separate surfaces with silver tone steps and 1px hairlines in the rule colour.
- **Do** use the text-safe tone (sky-text, green-text, orange-text, signal-red) for words and thin strokes on the ground.
- **Do** keep motion straight and ease-out (cubic-bezier(.22,1,.36,1)): 140ms for press feedback, 230–240ms for fields and controls. Honour reduced motion by removing it. The one travelling move is the `field` transition from a Home band into its screen's top field.

### Don't:
- **Don't** use #000 or any pure black for ink, text or the go bar.
- **Don't** add cast shadows, glows, gradients or backdrop blur to a surface. Lift it by tone or a rule instead.
- **Don't** make containers or actions into pills or circles. Use the square Start action and the square today marker.
- **Don't** set body text in a domain field colour on the white ground.
- **Don't** use Nutrition Orange outside nutrition. A session in progress is sky, marked by the ink bar on the Start square.
- **Don't** borrow a domain colour for decoration. The PR badge's yellow field is the one standing exception.
- **Don't** draw sport pictograms with square caps or interface icons with round ones. Figures are round-capped bars with a solid head; interface icons are square-capped strokes.
- **Don't** add a second typeface or fake widths with letter-spacing. Use the `wdth` axis.
- **Don't** animate numerals (no count-ups, no bounces).
- **Don't** add uppercase labels above headings. Uppercase is limited to a routine's name in a field, section labels over grouped lists, Stats tile labels, Plan's day squares and the weekday initials in the week strip.
