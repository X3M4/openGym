// Training in a deficit (SuperOpenGym Phase 8): alerts when a muscle's weekly volume falls well
// below the usual, or when the estimated 1RM of a most-trained lift drops. Pure.
//
// Volume  — a week under one third of the muscle's usual weekly sets. One third is the dose that
//           kept the muscle gained in young adults in Bickel, Cross & Bamman (Med Sci Sports Exerc
//           2011;43:1177–1187: 1 day/week at 1/3 or 1/9 of the volume, 32 weeks) — a study outside
//           a calorie deficit, which the app says.
// Strength— a drop of STRENGTH_DROP or more in the best estimated 1RM of the last 3 weeks against
//           the 6 weeks before. No published threshold says what drop means muscle loss: this one
//           is SuperOpenGym's own rule, and the app says so.
// The windows, the minimums and "the usual" (mean of the 8 weeks before) are the app's own rules.
import { EXIDX } from './exercises.js'
import { hasCompletedWork, isWarmupRow } from './workout-model.js'
import { bestSetOf } from './onerm.js'
import { weekKey, isoOf } from './format.js'

export const VOLUME_FRACTION = 1 / 3
export const BASE_WEEKS = 8
export const MIN_BASE_SETS = 3          // a muscle trained less than this per week is not watched
export const MIN_BASE_WEEKS = 4         // …nor one trained in fewer of the 8 weeks
export const STRENGTH_DROP = 0.05
export const RECENT_DAYS = 21, PRIOR_DAYS = 42
export const TOP_LIFTS = 4

const DAY = 86400000
const dateOf = iso => new Date(iso + 'T12:00:00')
const addDays = (iso, n) => isoOf(new Date(dateOf(iso).getTime() + n * DAY))

/** Done work sets (warm-ups out, cardio out) per body part for each week key. */
export function setsByWeekAndPart(S, ws) {
  const out = new Map()
  for (const w of S?.workouts || []) {
    if (!w?.d) continue
    const k = weekKey(w.d, ws)
    for (const e of w.entries || []) {
      const bp = EXIDX[e.id]?.bp
      if (!bp || bp === 'cardio') continue
      const n = (e.sets || []).filter(s => s && hasCompletedWork(s) && !isWarmupRow(s)).length
      if (!n) continue
      if (!out.has(k)) out.set(k, {})
      out.get(k)[bp] = (out.get(k)[bp] || 0) + n
    }
  }
  return out
}

/**
 * Volume alerts for the last complete week before `today`: per body part with a usual volume
 * (mean of the BASE_WEEKS before it, zeros included), the week's sets under a third of it.
 */
export function volumeAlerts(S, today, ws = 1) {
  const thisWeek = weekKey(today, ws)
  const last = addDays(thisWeek, -7)
  const byWeek = setsByWeekAndPart(S, ws)
  const base = Array.from({ length: BASE_WEEKS }, (_, i) => addDays(last, -7 * (i + 1)))
  const parts = new Set(base.flatMap(k => Object.keys(byWeek.get(k) || {})))
  const out = []
  for (const bp of parts) {
    const counts = base.map(k => byWeek.get(k)?.[bp] || 0)
    const trained = counts.filter(n => n > 0).length
    const usual = counts.reduce((a, b) => a + b, 0) / BASE_WEEKS
    if (usual < MIN_BASE_SETS || trained < MIN_BASE_WEEKS) continue
    const sets = byWeek.get(last)?.[bp] || 0
    if (sets < usual * VOLUME_FRACTION) out.push({ key: `vol:${bp}:${last}`, kind: 'volume', bp, week: last, sets, usual: Math.round(usual * 10) / 10 })
  }
  return out.sort((a, b) => a.sets / a.usual - b.sets / b.usual)
}

/** The TOP_LIFTS exercises with the most done work sets in the last RECENT_DAYS + PRIOR_DAYS. */
export function topLifts(S, today) {
  const from = addDays(today, -(RECENT_DAYS + PRIOR_DAYS))
  const count = new Map()
  for (const w of S?.workouts || []) {
    if (!w?.d || w.d < from || w.d > today) continue
    for (const e of w.entries || []) {
      if (EXIDX[e.id]?.bp === 'cardio') continue
      const n = (e.sets || []).filter(s => s && hasCompletedWork(s) && !isWarmupRow(s) && Number(s.r) > 0).length
      if (n) count.set(e.id, (count.get(e.id) || 0) + n)
    }
  }
  return [...count].sort((a, b) => b[1] - a[1]).slice(0, TOP_LIFTS).map(([id]) => id)
}

const bestIn = (S, id, from, to) => {
  let best = null
  for (const w of S?.workouts || []) {
    if (!w?.d || w.d < from || w.d > to) continue
    for (const e of w.entries || []) {
      if (e.id !== id) continue
      const b = bestSetOf(e)
      if (b && (!best || b.est > best.est)) best = { ...b, d: w.d }
    }
  }
  return best
}

/** Strength alerts: a top lift whose best recent estimate is STRENGTH_DROP or more below the prior. */
export function strengthAlerts(S, today) {
  const recentFrom = addDays(today, -(RECENT_DAYS - 1)), priorTo = addDays(recentFrom, -1), priorFrom = addDays(priorTo, -(PRIOR_DAYS - 1))
  const out = []
  for (const id of topLifts(S, today)) {
    const recent = bestIn(S, id, recentFrom, today), prior = bestIn(S, id, priorFrom, priorTo)
    if (!recent || !prior) continue
    const drop = (prior.est - recent.est) / prior.est
    if (drop >= STRENGTH_DROP) out.push({ key: `str:${id}:${recent.d}`, kind: 'strength', id, recent, prior, drop: Math.round(drop * 1000) / 10 })
  }
  return out.sort((a, b) => b.drop - a.drop)
}

/** Every alert, and the ones not yet acknowledged (S.alertsSeen holds the acknowledged keys). */
export function deficitAlerts(S, today, ws = 1) {
  const all = [...strengthAlerts(S, today), ...volumeAlerts(S, today, ws)]
  const seen = new Set(Array.isArray(S?.alertsSeen) ? S.alertsSeen : [])
  return { all, unseen: all.filter(a => !seen.has(a.key)) }
}

/** The next Monday at 09:00 local time after `now` — when the weekly notification fires. */
export function nextMonday9(now = new Date()) {
  const d = new Date(now)
  d.setHours(9, 0, 0, 0)
  const add = (8 - d.getDay()) % 7 || (now < d ? 0 : 7)
  d.setDate(d.getDate() + add)
  return d
}
