// Health Connect data into the profile (SuperOpenGym Phase 7). Pure: takes what the native plugin
// read (lib/health.js) and works out what to add, never overwriting what was logged by hand.
//
//   steps     → S.activity, one entry per day ({ id: 'steps:<day>', kind: 'steps', steps })
//   exercise  → S.activity, one entry per session ({ id: 'hc:<id>', kind: 'exercise', … })
//   weight    → S.bodyweight, only on days that have no weigh-in yet (the latest reading of the day)
//   body fat  → S.bodyfat as 'scale' readings ({ id: 'hc:<id>' }), each once
// Every added entry carries src: 'hc', so it can be told apart and the source is honest.
import { convertBodyWeight } from './units.js'

// Health Connect exercise types (ExerciseSessionRecord.EXERCISE_TYPE_*, connect-client 1.1.0) the
// app names; any other reads as "Workout".
export const EXERCISE_TYPES = {
  0: 'Workout', 8: 'Biking', 9: 'Stationary bike', 11: 'Boxing', 13: 'Calisthenics', 16: 'Dancing',
  25: 'Elliptical', 36: 'HIIT', 37: 'Hiking', 44: 'Martial arts', 48: 'Pilates', 54: 'Rowing machine',
  56: 'Running', 57: 'Treadmill', 64: 'Football', 68: 'Stair climbing', 69: 'Stair machine',
  70: 'Strength training', 73: 'Open-water swim', 74: 'Pool swim', 76: 'Tennis', 79: 'Walking',
  81: 'Weightlifting', 83: 'Yoga',
}
// Strength sessions logged elsewhere are not cardio: they are left out of the cardio minutes.
export const STRENGTH_TYPES = new Set([13, 70, 81])
// Apps the source package is shown as, when known.
export const SOURCES = {
  'com.sec.android.app.shealth': 'Samsung Health',
  'com.google.android.apps.fitness': 'Google Fit',
  'com.xiaomi.wearable': 'Mi Fitness',
  'com.mi.health': 'Mi Fitness',
  'com.google.android.apps.healthdata': 'Health Connect',
}

const pad = n => String(n).padStart(2, '0')
/** The local day of a timestamp, as the app's ISO day. */
export const dayOf = ms => { const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
const live = xs => (Array.isArray(xs) ? xs.filter(e => e && !e.deleted) : [])

/**
 * Apply one read to a profile draft (mutates `s`, as store updates do). Returns what changed:
 * { steps, exercise, weight, bodyfat } counts of entries added or updated.
 */
export function applyHealthRead(s, data, now = Date.now()) {
  const out = { steps: 0, exercise: 0, weight: 0, bodyfat: 0 }
  s.activity = Array.isArray(s.activity) ? s.activity : []
  const byId = new Map(s.activity.filter(e => e && e.id != null).map(e => [e.id, e]))

  for (const x of data?.steps || []) {
    if (!x?.d || !(Number(x.count) >= 0)) continue
    const id = 'steps:' + x.d, cur = byId.get(id)
    if (cur && !cur.deleted && cur.steps === Number(x.count)) continue
    const entry = { id, kind: 'steps', d: x.d, steps: Number(x.count), t: now, src: 'hc' }
    if (cur) Object.assign(cur, entry); else { s.activity.push(entry); byId.set(id, entry) }
    out.steps++
  }

  for (const x of data?.exercise || []) {
    if (!x?.id || !(x.end > x.start)) continue
    const id = 'hc:' + x.id
    if (byId.has(id)) continue
    const entry = { id, kind: 'exercise', d: dayOf(x.start), start: x.start, end: x.end, type: Number(x.type) || 0,
      title: x.title || '', source: x.source || '', t: now, src: 'hc' }
    s.activity.push(entry); byId.set(id, entry)
    out.exercise++
  }

  // weight: the latest reading of each day, only where the day has no weigh-in
  s.bodyweight = Array.isArray(s.bodyweight) ? s.bodyweight : []
  const have = new Set(s.bodyweight.filter(b => b && b.d).map(b => b.d))
  const lastOfDay = new Map()
  for (const x of data?.weight || []) {
    if (!(x?.kg > 0) || !x.t) continue
    const d = dayOf(x.t), cur = lastOfDay.get(d)
    if (!cur || x.t > cur.t) lastOfDay.set(d, x)
  }
  for (const [d, x] of lastOfDay) {
    if (have.has(d)) continue
    const w = Math.round((s.unit === 'lb' ? convertBodyWeight(x.kg, 'kg', 'lb') : x.kg) * 10) / 10
    s.bodyweight.push({ d, w, t: x.t, src: 'hc' })
    out.weight++
  }
  if (out.weight) s.bodyweight.sort((a, b) => (a.d < b.d ? -1 : 1))

  // body fat: each reading once, as a scale reading
  s.bodyfat = Array.isArray(s.bodyfat) ? s.bodyfat : []
  const fatIds = new Set(s.bodyfat.map(e => e?.id))
  for (const x of data?.bodyfat || []) {
    if (!x?.id || !(x.pct > 0) || !x.t) continue
    const id = 'hc:' + x.id
    if (fatIds.has(id)) continue
    s.bodyfat.push({ id, d: dayOf(x.t), t: x.t, pct: Math.round(x.pct * 10) / 10, method: 'scale', src: 'hc' })
    fatIds.add(id)
    out.bodyfat++
  }
  return out
}

/** Steps on a day (null when none recorded). */
export function stepsOn(S, d) {
  const e = live(S?.activity).find(x => x.kind === 'steps' && x.d === d)
  return e ? e.steps : null
}

/** Exercise sessions from other apps on a day, oldest first. */
export const exerciseOn = (S, d) => live(S?.activity).filter(x => x.kind === 'exercise' && x.d === d).sort((a, b) => a.start - b.start)

/** Cardio minutes from other apps in [from, to] by day — strength sessions left out. */
export function cardioMinutesByDay(S, from, to) {
  const out = new Map()
  for (const x of live(S?.activity)) {
    if (x.kind !== 'exercise' || x.d < from || x.d > to || STRENGTH_TYPES.has(x.type)) continue
    out.set(x.d, (out.get(x.d) || 0) + (x.end - x.start) / 60000)
  }
  return out
}

/**
 * The window to read on the next sync: from the day before the last read (late arrivals from a
 * watch that synced late), or `firstDays` back on the first one, up to today.
 */
export function readWindow(lastRead, today, firstDays = 30) {
  const back = n => { const d = new Date(today + 'T12:00:00'); d.setDate(d.getDate() - n); return dayOf(d.getTime()) }
  if (!lastRead) return { from: back(firstDays - 1), to: today }
  const from = lastRead < today ? (() => { const d = new Date(lastRead + 'T12:00:00'); d.setDate(d.getDate() - 1); return dayOf(d.getTime()) })() : back(1)
  return { from, to: today }
}

/** What writeWorkout needs from a finished workout; null when it has no real start and end. */
export function workoutForHealth(w) {
  if (!w?.id || !(w.start > 0) || !(w.end > w.start)) return null
  return { id: String(w.id), start: w.start, end: w.end, title: w.name || null, notes: w.note || null,
    version: Math.max(1, Math.round(Number(w._ts) || Number(w.end) || 1)) }
}
