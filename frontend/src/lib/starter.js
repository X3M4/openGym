// The starter-plan catalog. Training data only: the chooser's plan names and descriptions are
// written as string literals inside t() calls in sheets.jsx, because check-source-strings.mjs
// only finds them there — copy parked in here would silently ship English in every language.
//
// A routine is [key, name, emoji, [[exerciseId, sets, reps], …]]. The key is what a plan's
// schedule points at, so a weekday never depends on the position of a routine in the array.
// Names stay canonical English — they become ordinary user routines, which are not translated.
import { uid } from './format.js'

const PPL = [
  ['push', 'Push Day', 'barbell', [['0025', 4, 8], ['0047', 3, 10], ['0426', 3, 10], ['0334', 3, 12], ['0241', 3, 12], ['0251', 3, 10]]],
  ['pull', 'Pull Day', 'pullup', [['2330', 4, 10], ['0027', 4, 8], ['1323', 3, 10], ['0031', 3, 10], ['0313', 3, 12]]],
  ['legs', 'Leg Day', 'legs', [['0043', 4, 8], ['0085', 3, 10], ['0739', 3, 12], ['0585', 3, 12], ['0586', 3, 12], ['0605', 4, 15]]]
]

const UPPER_LOWER = [
  ['upper-a', 'Upper A', 'barbell', [['0025', 3, 8], ['2330', 3, 10], ['0047', 2, 10], ['1323', 2, 10], ['0334', 2, 12], ['0241', 2, 12], ['0031', 2, 12]]],
  ['lower-a', 'Lower A', 'legs', [['0043', 3, 8], ['0085', 3, 8], ['0739', 2, 10], ['0586', 2, 12], ['0605', 3, 15]]],
  ['upper-b', 'Upper B', 'barbell', [['0047', 3, 8], ['0027', 3, 8], ['0426', 2, 10], ['2330', 2, 10], ['0334', 2, 12], ['0241', 2, 12], ['0313', 2, 12]]],
  ['lower-b', 'Lower B', 'legs', [['0739', 3, 10], ['0085', 2, 10], ['0585', 2, 12], ['0586', 3, 12], ['0605', 3, 15]]]
]

const FULL_BODY = [
  ['fb-a', 'Full Body A', 'figureStrength', [['0043', 3, 8], ['0025', 3, 8], ['2330', 3, 10], ['0586', 3, 12], ['0334', 2, 12], ['0031', 2, 12]]],
  ['fb-b', 'Full Body B', 'figureStrength', [['0085', 3, 8], ['0047', 3, 10], ['1323', 3, 10], ['0585', 3, 12], ['0334', 2, 12], ['0241', 2, 12]]],
  ['fb-c', 'Full Body C', 'figureStrength', [['0739', 3, 10], ['0025', 2, 10], ['0027', 3, 10], ['0426', 2, 10], ['0586', 3, 12], ['0605', 3, 15]]]
]

const FIVE_BY_FIVE = [
  ['5x5-a', '5×5 A', 'barbell', [['0043', 5, 5], ['0025', 5, 5], ['0027', 5, 5]]],
  ['5x5-b', '5×5 B', 'barbell', [['0085', 5, 5], ['0426', 5, 5], ['2330', 5, 5]]],
  ['5x5-c', '5×5 C', 'barbell', [['0739', 5, 5], ['0047', 5, 5], ['1323', 5, 5]]]
]

// A three-day split built around one gym's kit (racks, Smith, plate-loaded presses and rows,
// 45° sled, cables, dumbbells, bikes, treadmills, an elliptical). A routine may carry a fifth
// element, its own settings ({ prog }), and an exercise a fourth, its slot options:
// { min: bottom of the rep range, rest: seconds, sg: superset id, alt: [alternative ids] }.
// Cardio slots are [id, 'cardio', minutes, { speed, alt }]. Ranges go with double progression.
const BIKE = '2138', ELLIPTICAL = '2141', INCLINE_WALK = '3666'
const warmup = [BIKE, 'cardio', 8, { speed: 20, alt: [ELLIPTICAL, INCLINE_WALK] }]
const DOUBLE = { prog: 'double' }

const PAIRED_SPLIT = [
  ['legs-back', 'Legs + Back', 'legs', [
    warmup,
    ['0043', 4, 8, { min: 6, rest: 150, alt: ['0743', '0741', '1436'] }],          // squat · hack / pendulum
    ['2330', 4, 10, { min: 8, rest: 90, alt: ['0198', '0579', '2616'] }],           // lat pulldown
    ['0739', 3, 12, { min: 10, rest: 120, alt: ['0743', '1425'] }],                 // 45° leg press
    ['1350', 3, 10, { min: 8, rest: 90, alt: ['0581', '0861', '0292'] }],           // chest-supported row
    ['1409', 3, 12, { min: 10, rest: 90, alt: ['3562', '2286'] }],                  // hip thrust
    ['0586', 3, 12, { min: 10, rest: 60, sg: 'ss-legs', alt: ['0599'] }],          // leg curl ┐
    ['0585', 3, 15, { min: 12, rest: 90, sg: 'ss-legs' }],                          // leg ext  ┘
    ['0237', 3, 15, { min: 12, rest: 60, alt: ['0238', '0375', '2285'] }],          // cable pullover
    ['0738', 3, 15, { min: 12, rest: 60, alt: ['1391', '2289'] }],                  // calves on the sled
    [INCLINE_WALK, 'cardio', 10, { speed: 5, alt: [ELLIPTICAL, BIKE] }]
  ], DOUBLE],
  ['chest-back', 'Chest + Back', 'barbell', [
    warmup,
    ['0025', 4, 8, { min: 6, rest: 150, alt: ['0748', '0577', '0289'] }],           // bench press
    ['2616', 4, 10, { min: 8, rest: 120, alt: ['0579', '0245', '0198'] }],          // neutral-grip pulldown
    ['1299', 3, 10, { min: 8, rest: 90, alt: ['0314', '0757', '0047'] }],           // incline machine press
    ['0292', 3, 10, { min: 8, rest: 90, alt: ['1350', '0581', '1360'] }],           // one-arm DB row
    ['0227', 3, 15, { min: 12, rest: 15, sg: 'ss-cb1', alt: ['0596', '0308', '0158'] }], // cable fly ┐
    ['1323', 3, 12, { min: 10, rest: 75, sg: 'ss-cb1', alt: ['0861', '0180'] }],    // seated row  ┘
    ['0581', 3, 12, { min: 10, rest: 15, sg: 'ss-cb2', alt: ['1350', '0571'] }],    // high row  ┐
    ['0203', 3, 15, { min: 12, rest: 75, sg: 'ss-cb2', alt: ['0154', '2292'] }],    // face pull ┘
    ['0375', 2, 12, { min: 10, rest: 60, alt: ['0237', '2285'] }],                  // DB pullover
    [BIKE, 'cardio', 8, { speed: 25, alt: [INCLINE_WALK, ELLIPTICAL] }]
  ], DOUBLE],
  ['chest-arms', 'Chest + Arms', 'arm', [
    warmup,
    ['0314', 4, 10, { min: 8, rest: 120, alt: ['1299', '0757', '0047'] }],          // incline DB press
    ['0577', 3, 10, { min: 8, rest: 90, alt: ['0748', '0289', '1301'] }],           // machine chest press
    ['0751', 3, 10, { min: 8, rest: 90, alt: ['0030', '2432'] }],                   // close-grip Smith
    ['0308', 3, 15, { min: 12, rest: 60, alt: ['0596', '0188', '0227'] }],          // DB fly · pec deck
    ['0031', 3, 10, { min: 8, rest: 15, sg: 'ss-arms1', alt: ['0575', '0318'] }],   // barbell curl ┐
    ['0060', 3, 10, { min: 8, rest: 75, sg: 'ss-arms1', alt: ['1749', '0351'] }],   // skull crusher┘
    ['0070', 3, 12, { min: 10, rest: 15, sg: 'ss-arms2', alt: ['0372', '0195'] }],  // preacher curl ┐
    ['0200', 3, 15, { min: 12, rest: 60, sg: 'ss-arms2', alt: ['0241', '0201'] }],  // rope pushdown ┘
    ['0313', 3, 12, { min: 10, rest: 15, sg: 'ss-arms3', alt: ['0165', '0320'] }],  // hammer curl   ┐
    ['0194', 3, 12, { min: 10, rest: 60, sg: 'ss-arms3', alt: ['1722', '0092'] }],  // overhead ext  ┘
    [ELLIPTICAL, 'cardio', 15, { speed: 8, alt: [INCLINE_WALK, BIKE] }]
  ], DOUBLE]
]

// [weekday, routineKey] — weekday is a DAYN index, so 1 is Monday. Fixed weeks only: every
// plan repeats the same seven days, which is all the weekly plan model can represent.
const PLANS = {
  ppl: { routines: PPL, schedule: [[1, 'push'], [3, 'pull'], [5, 'legs']] },
  'upper-lower': { routines: UPPER_LOWER, schedule: [[1, 'upper-a'], [2, 'lower-a'], [4, 'upper-b'], [5, 'lower-b']] },
  'full-body': { routines: FULL_BODY, schedule: [[1, 'fb-a'], [3, 'fb-b'], [5, 'fb-c']] },
  '5x5': { routines: FIVE_BY_FIVE, schedule: [[1, '5x5-a'], [3, '5x5-b'], [5, '5x5-c']] },
  'paired-split': { routines: PAIRED_SPLIT, schedule: [[1, 'chest-back'], [3, 'legs-back'], [5, 'chest-arms']] }
}

function slot([id, sets, reps, o = {}]) {
  const extra = {
    ...(o.rest ? { restSec: o.rest } : {}),
    ...(o.sg ? { sg: o.sg } : {}),
    ...(o.alt?.length ? { alt: [...o.alt] } : {})
  }
  if (sets === 'cardio') return { id, sets: 1, min: reps, speed: o.speed ?? 8, ...extra }
  return { id, sets, reps, ...(o.min ? { repsMin: o.min } : {}), weight: 0, ...extra }
}

// `names` (routine key → name) lets the caller hand in translated names; the canonical English
// one is used for any key it leaves out.
const build = (routines, names = {}) =>
  routines.map(([key, name, emoji, list, opts]) => ({ id: uid(), name: names[key] || name, emoji, ...(opts || {}), ex: list.map(slot) }))

// Fresh routine objects (new ids) — [push, pull, legs]. The demo build seeds a history on
// top of exactly these three, so this entry point keeps its shape.
export const starterRoutines = () => build(PPL)

// [{ id, days }] for the chooser. The day count is read off the schedule rather than stored
// beside it, so the two can never disagree.
export const starterPlanOptions = () =>
  Object.entries(PLANS).map(([id, { schedule }]) => ({ id, days: schedule.length }))

// The weekdays a plan would claim, or null for an unknown id.
export const starterPlanDays = id => PLANS[id]?.schedule.map(([day]) => day) ?? null

// Fresh routines plus the weekdays to put them on, or null for an unknown id — a caller that
// treats null as "change nothing" can never half-apply a plan.
export const buildStarterPlan = (id, names) => {
  const plan = PLANS[id]
  if (!plan) return null
  const routines = build(plan.routines, names)
  // key → the id just minted for it, so the schedule below names its routine
  const byKey = Object.fromEntries(plan.routines.map(([key], i) => [key, routines[i].id]))
  return { routines, schedule: plan.schedule.map(([day, key]) => ({ day, routineId: byKey[key] })) }
}
