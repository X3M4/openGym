# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

One React web app served two ways: in the browser from the owner's VPS, and wrapped in a Capacitor
WebView as the Android app (appId `com.chemafernandez.superopengym`). Phone and desktop carry equal
weight; on Android it must respect the system back gesture, status and navigation bars, and the
on-screen keyboard.

## Users

Today one person: the owner, training in a gym while losing body fat. Four situations, all primary:

- **In the gym, between sets** — phone in one hand, little attention, short pauses: log a set, see
  what comes next, run the rest timer.
- **At home, planning** — build routines, place them on a calendar, set targets.
- **Through the day, logging** — body weight, food (own saved foods and Open Food Facts lookups),
  steps and cardio, in a few seconds each.
- **Reviewing progress** — trends, strength retention, exports (CSV for Excel, PDF with calendar
  and statistics), on the phone or on a large screen.

Later: a coach reviewing clients' data. The data model must allow it; no coach screens are decided
yet.

## Product Purpose

A gym and body-composition tracker for losing fat without losing muscle. Training, body weight,
measurements, nutrition and daily activity live in one record the owner controls, so the question
"am I losing fat while keeping my strength?" can be answered from it, inside the app or outside.

Success: the owner logs every session and weigh-in without friction, sees the trend and the
strength signals that matter during a deficit, and can export everything for analysis.

## Positioning

- **Recomposition first.** Strength retention (estimated 1RM on key lifts), trend weight, rate of
  loss, protein, measurements and body fat are read together, not in separate apps.
- **The data is the owner's.** Self-hosted on their own VPS, no subscription, no ads, no
  telemetry; full export (CSV, PDF, JSON backup).
- **Ready for a coach** without being built around one yet.

## Operating Context

- Android phone (Samsung Galaxy A15 is the test device) and a desktop browser.
- Server: Docker containers on the owner's VPS behind its Nginx with HTTPS; the phone pairs with it
  through a one-time code. Local development on http://localhost:8095.
- Exports are analysed in Excel (Spanish locale: `;` separator, `,` decimals).
- Optional Health Connect (steps, cardio, weight, body fat in; workouts out).

## Capabilities and Constraints

Inherited from openGym (fork of github.com/DuarteSantos8/openGym, AGPL-3.0): weekly plan and
routines over a 1,324-exercise library with animated demos, guided workouts with rest timer and
plate math, progression rules, PR and 1RM tracking, muscle map, body-weight chart, history editing,
imports (FitNotes, Strong, Hevy, Apple Health), offline use with server sync, passkey and password
sign-in, rest notifications on Android.

Planned in this fork: CSV export, calendar PDF with planned vs done plus charts, trend weight and
rate-of-loss alerts, body measurements and body fat, protein and calorie targets (computed from
height/age/sex and editable) with food logging, strength-drop and minimum-volume alerts, Health
Connect.

Constraints:
- Languages: Spanish and English for everything new; the other inherited locales may fall back to
  English for new strings.
- Themes: light by default, dark optional, and "follow the system".
- Frontend stack stays React + Vite; new dependencies are allowed when justified.
- Every number shown as guidance (loss rate, protein per kg, energy formulas) must cite its source;
  nothing is invented.

## Brand Commitments

- Name: **SuperOpenGym**. Credit openGym as the origin (AGPL); the source link points to the fork.
- No existing logo, palette or typography: the visual identity is open.

## Evidence on Hand

- Exercise images and animations: hasaneyldrm/exercises-dataset; images © Gym visual, used under
  that dataset's terms (NOTICE.md). Not to be redistributed as brand assets.
- No testimonials, users, metrics or press exist. Nothing of the kind may be fabricated.

## Product Principles

1. **One-handed in the gym.** The between-sets path is the fastest path in the app.
2. **Truth over motivation.** Show the trend and the real signal (weight trend, strength kept),
   never invented praise or numbers without a source.
3. **The owner's data, whole.** Anything recorded can be seen, corrected and exported.
4. **Calm, not gamified.** Losing fat is slow; the app reports steadily rather than celebrating
   noise.

## Accessibility & Inclusion

Readable in a bright gym and outdoors (light theme by default, strong contrast), large touch
targets for use mid-workout; no further requirement established.
