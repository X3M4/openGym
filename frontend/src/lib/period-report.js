// The period report (Progress → "PDF report"): everything the printed document says about a date
// range, worked out from the profile alone. Pure — the HTML is lib/period-report-html.js.
//
// What "planned" means for a past day: the app keeps no history of the weekly plan, only date
// overrides (S.dayPlan). A past day's plan is therefore today's weekly plan plus that day's
// override; `planIsCurrent` tells the document to say so.
import { effectiveRoutines } from './history.js'
import { EXIDX, isCardio } from './exercises.js'
import { hasCompletedWork, isWarmupRow, completedVolumeOf } from './workout-model.js'
import { bestSetOf } from './onerm.js'
import { isoOf, weekKey } from './format.js'
import { weeklyRelations } from './correlation.js'
import { trendSeries, weeklyRate, bodyFatSeries, liveMeasures, measureChanges } from './body-comp.js'
import { cardioMinutesByDay } from './health-sync.js'
import { deficitAlerts } from './deficit-alerts.js'

// A week's food enters the relations only with at least this many days logged (SuperOpenGym's rule).
export const FOOD_MIN_DAYS = 4

const DAY = 86400000
const dateOf = iso => new Date(iso + 'T12:00:00')
const addDays = (iso, n) => isoOf(new Date(dateOf(iso).getTime() + n * DAY))
export function daysBetween(from, to) {
  const out = []
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d)
  return out
}

// How a logged set was done: cardio (minutes at a speed), time (a hold) or reps.
function setMode(entryId, s) {
  if (Number(s?.min) > 0 || Number(s?.speed) > 0 || isCardio(entryId)) return 'cardio'
  if (Number(s?.sec) > 0 && !(Number(s?.r) > 0)) return 'time'
  return 'reps'
}
const doneSets = entry => (Array.isArray(entry?.sets) ? entry.sets : []).filter(s => s && hasCompletedWork(s))

/** One workout reduced to what the report shows and counts. */
export function workoutFacts(w) {
  let sets = 0, warmups = 0, volume = 0, cardioMin = 0, strengthSets = 0
  const exercises = []
  for (const entry of w.entries || []) {
    const rows = doneSets(entry)
    if (!rows.length) continue
    const ex = EXIDX[entry.id]
    let entryCardio = false
    for (const s of rows) {
      if (isWarmupRow(s)) { warmups++; continue }
      sets++
      const mode = setMode(entry.id, s)
      if (mode === 'cardio') { entryCardio = true; cardioMin += Number(s.min) || 0 }
      else { strengthSets++; if (mode === 'reps') volume += completedVolumeOf(s) }
    }
    exercises.push({ id: entry.id, bp: ex?.bp || null, cardio: entryCardio, sets: rows, note: entry.note || '', sg: entry.sg || null })
  }
  const kind = cardioMin > 0 && strengthSets > 0 ? 'mixed' : cardioMin > 0 ? 'cardio' : strengthSets > 0 ? 'strength' : 'empty'
  const durMs = w.start && w.end && w.end > w.start ? w.end - w.start : null
  const routineIds = [].concat(w.routineIds || (w.routineId ? [w.routineId] : []))
  return { id: w.id, d: w.d, name: w.name || '', routineIds, sets, warmups, volume, cardioMin, kind, durMs,
    prs: Array.isArray(w.prs) ? w.prs.length : 0, bw: w.bw ?? null, note: w.note || '', exercises }
}

/**
 * Each day of the range with what was planned and what was done:
 *   done     — a session was logged that day (whether or not one was planned)
 *   missed   — a session was planned, the day is past and nothing was logged
 *   planned  — a session is planned and the day has not come yet (or is today)
 *   rest     — nothing planned, nothing logged
 * `moved` marks a day whose plan is a date override (S.dayPlan), not the weekly plan.
 */
export function calendarDays(S, from, to, today) {
  const byDay = new Map()
  for (const w of S.workouts || []) {
    if (w.d < from || w.d > to) continue
    if (!byDay.has(w.d)) byDay.set(w.d, [])
    byDay.get(w.d).push(w)
  }
  return daysBetween(from, to).map(d => {
    const planned = effectiveRoutines(S, d).map(r => ({ id: r.id, name: r.name }))
    const done = (byDay.get(d) || []).map(w => ({ id: w.id, name: w.name || '' }))
    const moved = S.dayPlan?.[d] !== undefined
    const status = done.length ? 'done' : planned.length ? (d < today ? 'missed' : 'planned') : 'rest'
    return { d, planned, done, moved, status }
  })
}

const mean = xs => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

/**
 * The weeks touching the range, each with its training and its average weigh-in, and the change
 * in average weight from that week to the next (null where either has no weigh-in). The week
 * after the range is read for the last week's change when it has weigh-ins.
 */
/** The method with the most body-fat readings in [from, to] — readings of one method compare. */
export function mainFatMethod(S, from, to) {
  const count = new Map()
  for (const x of bodyFatSeries(S)) if (x.d >= from && x.d <= to) count.set(x.method, (count.get(x.method) || 0) + 1)
  return [...count].sort((a, b) => b[1] - a[1])[0]?.[0] || null
}

export function weeklySeries(S, facts, from, to, ws) {
  const weeks = []
  let k = weekKey(from, ws)
  const last = weekKey(to, ws)
  while (k <= last) { weeks.push(k); k = addDays(k, 7) }
  const bwByWeek = new Map()
  for (const b of S.bodyweight || []) {
    if (!b || !b.d || !(Number(b.w) > 0)) continue
    const key = weekKey(b.d, ws)
    if (!bwByWeek.has(key)) bwByWeek.set(key, [])
    bwByWeek.get(key).push(Number(b.w))
  }
  const routineIds = [...new Set(facts.flatMap(f => f.routineIds))]
  const method = mainFatMethod(S, from, addDays(to, 7))
  const fatByWeek = new Map()
  for (const x of bodyFatSeries(S)) {
    if (x.method !== method) continue
    const key = weekKey(x.d, ws)
    if (!fatByWeek.has(key)) fatByWeek.set(key, [])
    fatByWeek.get(key).push(x.pct)
  }
  // food per day, then per week: mean kcal and protein over the logged days of the week
  const foodDays = new Map()
  for (const e of S.foodLog || []) {
    if (!e || e.deleted || !e.d) continue
    const x = foodDays.get(e.d) || { kcal: 0, p: 0 }
    x.kcal += Number(e.kcal) || 0; x.p += Number(e.p) || 0
    foodDays.set(e.d, x)
  }
  return weeks.map(key => {
    const inWeek = facts.filter(f => weekKey(f.d, ws) === key)
    const logged = [...foodDays].filter(([d]) => weekKey(d, ws) === key).map(([, x]) => x)
    const vars = {
      sessions: inWeek.length,
      sets: inWeek.reduce((n, f) => n + f.sets, 0),
      volume: inWeek.reduce((n, f) => n + f.volume, 0),
      cardioMin: inWeek.reduce((n, f) => n + f.cardioMin, 0),
      strengthSessions: inWeek.filter(f => f.kind === 'strength').length,
      cardioSessions: inWeek.filter(f => f.kind === 'cardio').length,
      mixedSessions: inWeek.filter(f => f.kind === 'mixed').length,
    }
    for (const id of routineIds) vars['routine:' + id] = inWeek.filter(f => f.routineIds.includes(id)).length
    // Health Connect: mean daily steps of the week's days with a count, and other apps' cardio
    const stepDays = (S.activity || []).filter(x => x && !x.deleted && x.kind === 'steps' && weekKey(x.d, ws) === key)
    vars.steps = stepDays.length >= FOOD_MIN_DAYS ? mean(stepDays.map(x => x.steps)) : null
    vars.extCardio = (S.activity || []).some(x => x && x.kind === 'exercise')
      ? [...cardioMinutesByDay(S, key, addDays(key, 6)).values()].reduce((a, b) => a + b, 0) : null
    vars.kcal = logged.length >= FOOD_MIN_DAYS ? mean(logged.map(x => x.kcal)) : null
    vars.protein = logged.length >= FOOD_MIN_DAYS ? mean(logged.map(x => x.p)) : null
    const avg = mean(bwByWeek.get(key) || [])
    const nextAvg = mean(bwByWeek.get(addDays(key, 7)) || [])
    const fat = mean(fatByWeek.get(key) || []), nextFat = mean(fatByWeek.get(addDays(key, 7)) || [])
    return { week: key, vars, avgWeight: avg, change: avg != null && nextAvg != null ? nextAvg - avg : null,
      fatChange: fat != null && nextFat != null ? nextFat - fat : null }
  })
}

/** Done work sets per body part over the facts (cardio left out). */
export function setsByBodyPart(facts) {
  const out = {}
  for (const f of facts) for (const e of f.exercises) {
    if (e.cardio || !e.bp || e.bp === 'cardio') continue
    const n = e.sets.filter(s => !isWarmupRow(s)).length
    if (n) out[e.bp] = (out[e.bp] || 0) + n
  }
  return Object.entries(out).sort((a, b) => b[1] - a[1]).map(([bp, sets]) => ({ bp, sets }))
}

/** The `n` exercises with the most done work sets that produce an estimated 1RM, with its series. */
export function topLiftSeries(S, facts, n = 4) {
  const count = new Map()
  for (const f of facts) for (const e of f.exercises) {
    if (e.cardio) continue
    const k = e.sets.filter(s => !isWarmupRow(s) && setMode(e.id, s) === 'reps').length
    if (k) count.set(e.id, (count.get(e.id) || 0) + k)
  }
  const ids = new Set(facts.map(f => f.id))
  const out = []
  for (const [id, sets] of [...count].sort((a, b) => b[1] - a[1])) {
    if (out.length >= n) break
    const points = []
    for (const w of S.workouts || []) {
      if (!ids.has(w.id)) continue
      let best = null
      for (const entry of w.entries || []) {
        if (entry.id !== id) continue
        const b = bestSetOf(entry)
        if (b && (!best || b.est > best.est)) best = b
      }
      if (best) points.push({ d: w.d, t: w.start || dateOf(w.d).getTime(), y: best.est })
    }
    if (points.length) out.push({ id, sets, points })
  }
  return out
}

/** The relation keys the report tests, in reading order. */
export function relationKeys(weeks) {
  const base = ['sessions', 'sets', 'volume', 'cardioMin', 'strengthSessions', 'cardioSessions', 'mixedSessions', 'kcal', 'protein', 'steps', 'extCardio']
  const routines = Object.keys(weeks[0]?.vars || {}).filter(k => k.startsWith('routine:'))
  return [...base, ...routines]
}

/**
 * The whole report for [from, to] (ISO dates, inclusive). `today` decides which planned days are
 * missed rather than still to come.
 */
export function buildPeriodReport(S, { from, to, today = isoOf(new Date()), weekStart = 1 }) {
  const workouts = (S.workouts || []).filter(w => w && w.d >= from && w.d <= to)
    .sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : (a.start || 0) - (b.start || 0)))
  const facts = workouts.map(workoutFacts)
  const days = calendarDays(S, from, to, today)
  const pastPlanned = days.filter(d => d.planned.length && d.d < today)
  const pastPlannedDone = pastPlanned.filter(d => d.status === 'done')
  const weeks = weeklySeries(S, facts, from, to, weekStart)
  const bodyweight = (S.bodyweight || []).filter(b => b && b.d >= from && b.d <= to && Number(b.w) > 0)
    .map(b => ({ d: b.d, t: b.t || dateOf(b.d).getTime(), y: Number(b.w) }))
    .sort((a, b) => a.t - b.t)
  return {
    from, to, unit: S.unit || 'kg',
    planIsCurrent: true,
    summary: {
      sessions: facts.length,
      plannedDays: pastPlanned.length,
      plannedDone: pastPlannedDone.length,
      adherence: pastPlanned.length ? pastPlannedDone.length / pastPlanned.length : null,
      sets: facts.reduce((n, f) => n + f.sets, 0),
      volume: facts.reduce((n, f) => n + f.volume, 0),
      cardioMin: facts.reduce((n, f) => n + f.cardioMin, 0),
      timeMs: facts.reduce((n, f) => n + (f.durMs || 0), 0),
      prs: facts.reduce((n, f) => n + f.prs, 0),
      weightFirst: bodyweight[0] || null,
      weightLast: bodyweight.at(-1) || null,
    },
    days, workouts: facts, weeks,
    bodyParts: setsByBodyPart(facts),
    lifts: topLiftSeries(S, facts),
    bodyweight,
    relations: weeklyRelations(weeks, relationKeys(weeks)),
    fatRelations: { ...weeklyRelations(weeks.map(w => ({ vars: w.vars, change: w.fatChange })), relationKeys(weeks)), method: mainFatMethod(S, from, addDays(to, 7)) },
    body: bodySection(S, from, to),
    food: foodSection(S, from, to),
    activity: activitySection(S, from, to),
    // the deficit alerts as they stood at the end of the period (lib/deficit-alerts.js)
    alerts: deficitAlerts(S, to, weekStart).all,
  }
}

/**
 * The date shortcuts of the report sheet, as inclusive ISO ranges ending today (or covering last
 * month): 'last4w' the last 28 days, 'month' this month so far, 'lastMonth' the whole previous
 * month, 'last3m' the last 91 days (13 weeks).
 */
export function presetRange(key, today) {
  const d = dateOf(today)
  if (key === 'month') return { from: isoOf(new Date(d.getFullYear(), d.getMonth(), 1)), to: today }
  if (key === 'lastMonth') {
    return { from: isoOf(new Date(d.getFullYear(), d.getMonth() - 1, 1)), to: isoOf(new Date(d.getFullYear(), d.getMonth(), 0)) }
  }
  if (key === 'last3m') return { from: addDays(today, -90), to: today }
  return { from: addDays(today, -27), to: today }
}

/** Body composition over [from, to]: the trend at both ends, the rate at the end, measurement
 *  changes inside the range and the body-fat readings in it (lib/body-comp.js). */
export function bodySection(S, from, to) {
  const series = trendSeries(S.bodyweight).filter(x => x.d >= from && x.d <= to)
  const inRange = series.filter(x => x.w != null)
  const upTo = (S.bodyweight || []).filter(b => b && b.d <= to)
  const rate = weeklyRate(upTo, to)
  const measures = liveMeasures(S).filter(m => m.d >= from && m.d <= to)
  const fat = bodyFatSeries(S).filter(x => x.d >= from && x.d <= to)
  return {
    trendFirst: inRange.length ? { d: series[0].d, y: series[0].trend } : null,
    trendLast: inRange.length ? { d: series.at(-1).d, y: series.at(-1).trend } : null,
    trend: series.map(x => ({ d: x.d, t: dateOf(x.d).getTime(), y: Math.round(x.trend * 10) / 10 })),
    rate: rate.rate, kgPerWeek: rate.kgPerWeek ?? null,
    measures: measureChanges(measures),
    fat,
  }
}

/** What was eaten over [from, to]: the days logged and the mean per logged day. */
export function foodSection(S, from, to) {
  const days = new Map()
  for (const e of S.foodLog || []) {
    if (!e || e.deleted || !e.d || e.d < from || e.d > to) continue
    const x = days.get(e.d) || { kcal: 0, p: 0, c: 0, f: 0 }
    for (const k of ['kcal', 'p', 'c', 'f']) x[k] += Number(e[k]) || 0
    days.set(e.d, x)
  }
  const xs = [...days.values()]
  const avg = k => (xs.length ? Math.round(xs.reduce((n, x) => n + x[k], 0) / xs.length) : null)
  return { days: xs.length, totalDays: daysBetween(from, to).length, kcal: avg('kcal'), p: avg('p'), c: avg('c'), f: avg('f') }
}

/** Health Connect over [from, to]: mean steps of the days with a count, other apps' cardio. */
export function activitySection(S, from, to) {
  const steps = (S.activity || []).filter(x => x && !x.deleted && x.kind === 'steps' && x.d >= from && x.d <= to)
  const cardio = [...cardioMinutesByDay(S, from, to).values()].reduce((a, b) => a + b, 0)
  const sessions = (S.activity || []).filter(x => x && !x.deleted && x.kind === 'exercise' && x.d >= from && x.d <= to)
  return { stepDays: steps.length, steps: steps.length ? Math.round(steps.reduce((n, x) => n + x.steps, 0) / steps.length) : null,
    cardioMin: Math.round(cardio), sessions: sessions.length }
}
