// Body composition (SuperOpenGym Phase 5): the weight trend, the weekly rate of loss and its band,
// the US Navy body-fat estimate and lean mass. Pure; every number shown in the app comes from here.
//
// Sources, as the app cites them:
//   Trend   — an exponentially smoothed moving average with a smoothing constant of 0.9: each
//             day's weight moves the trend by 10% of the gap (J. Walker, "The Hacker's Diet",
//             chapter "Signal and Noise", fourmilab.ch/hackdiet).
//   Rate    — 0.5–1% of body weight per week to maximise muscle retention (E. R. Helms,
//             A. A. Aragon, P. J. Fitschen, J Int Soc Sports Nutr 2014;11:20).
//   Navy    — circumference equations of J. A. Hodgdon and M. B. Beckett (Naval Health Research
//             Center, 1984), metric form, measurements in cm.

export const TREND_ALPHA = 0.1
export const RATE_BAND = { low: 0.5, high: 1 }        // % of body weight lost per week
// How much data a rate needs before the app states one (SuperOpenGym's own rule, not a source):
// a trend at least RATE_DAYS long, at least RATE_MIN_WEIGHINS weigh-ins inside that window, and
// the latest one no older than RATE_STALE_DAYS.
export const RATE_DAYS = 14
export const RATE_MIN_WEIGHINS = 4
export const RATE_STALE_DAYS = 7

const DAY = 86400000
const dateOf = iso => new Date(iso + 'T12:00:00')
const isoOf = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const addDays = (iso, n) => isoOf(new Date(dateOf(iso).getTime() + n * DAY))
const daysApart = (a, b) => Math.round((dateOf(b) - dateOf(a)) / DAY)

/** One weight per day — the mean of that day's weigh-ins — oldest first. */
export function dailyWeights(bodyweight) {
  const byDay = new Map()
  for (const e of bodyweight || []) {
    const w = Number(e?.w)
    if (!e?.d || !(w > 0)) continue
    if (!byDay.has(e.d)) byDay.set(e.d, [])
    byDay.get(e.d).push(w)
  }
  return [...byDay].map(([d, ws]) => ({ d, w: ws.reduce((a, b) => a + b, 0) / ws.length })).sort((a, b) => (a.d < b.d ? -1 : 1))
}

/**
 * The trend for every day from the first weigh-in to the last: { d, w (null on a day without a
 * weigh-in), trend }. A day without a weigh-in carries the trend unchanged.
 */
export function trendSeries(bodyweight, alpha = TREND_ALPHA) {
  const days = dailyWeights(bodyweight)
  if (!days.length) return []
  const byDay = new Map(days.map(x => [x.d, x.w]))
  const out = []
  let trend = days[0].w
  for (let d = days[0].d; d <= days.at(-1).d; d = addDays(d, 1)) {
    const w = byDay.has(d) ? byDay.get(d) : null
    if (w != null) trend += alpha * (w - trend)
    out.push({ d, w, trend })
  }
  return out
}

/**
 * The weekly rate of change of the trend over the last RATE_DAYS, as % of body weight per week
 * (negative = losing). Null, with a reason, when there is not enough to say:
 *   'no-data' | 'short' (trend shorter than RATE_DAYS) | 'few' (too few weigh-ins in the window)
 *   | 'stale' (no weigh-in in the last RATE_STALE_DAYS before `today`).
 */
export function weeklyRate(bodyweight, today) {
  const series = trendSeries(bodyweight)
  if (!series.length) return { rate: null, reason: 'no-data' }
  const last = series.at(-1)
  if (today && daysApart(last.d, today) > RATE_STALE_DAYS) return { rate: null, reason: 'stale' }
  if (series.length <= RATE_DAYS) return { rate: null, reason: 'short' }
  const then = series[series.length - 1 - RATE_DAYS]
  const inWindow = series.slice(-RATE_DAYS).filter(x => x.w != null).length
  if (inWindow < RATE_MIN_WEIGHINS) return { rate: null, reason: 'few' }
  const pctPerWeek = ((last.trend - then.trend) / then.trend) * 100 * (7 / RATE_DAYS)
  const kgPerWeek = (last.trend - then.trend) * (7 / RATE_DAYS)
  return { rate: pctPerWeek, kgPerWeek, trend: last.trend, since: then.d, reason: null }
}

/**
 * Where a weekly rate falls against the band, for someone cutting (losing towards a goal):
 *   'fast' (losing more than 1%/week), 'in-range', 'slow' (losing, under 0.5%), 'not-losing'.
 */
export function rateBand(ratePct) {
  if (ratePct == null) return null
  const loss = -ratePct
  if (loss > RATE_BAND.high) return 'fast'
  if (loss >= RATE_BAND.low) return 'in-range'
  if (loss > 0) return 'slow'
  return 'not-losing'
}

/** Whether the profile is cutting: a goal weight below the current trend. */
export const isCutting = (targetW, trend) => targetW != null && trend != null && Number(targetW) < trend

/**
 * US Navy body fat %, metric (Hodgdon & Beckett 1984). Men: waist, neck, height; women: also hip.
 * Null when a measurement is missing or the girths cannot fit the equation.
 */
export function navyBodyFat({ sex, heightCm, neck, waist, hip }) {
  const h = Number(heightCm), n = Number(neck), w = Number(waist), hp = Number(hip)
  if (!(h > 0) || !(n > 0) || !(w > 0)) return null
  let pct
  if (sex === 'male') {
    if (!(w - n > 0)) return null
    pct = 495 / (1.0324 - 0.19077 * Math.log10(w - n) + 0.15456 * Math.log10(h)) - 450
  } else if (sex === 'female') {
    if (!(hp > 0) || !(w + hp - n > 0)) return null
    pct = 495 / (1.29579 - 0.35004 * Math.log10(w + hp - n) + 0.22100 * Math.log10(h)) - 450
  } else return null
  return isFinite(pct) && pct > 0 && pct < 75 ? Math.round(pct * 10) / 10 : null
}

/** Lean (fat-free) mass from a weight and a body-fat %. */
export const leanMass = (weight, pct) => (Number(weight) > 0 && pct != null ? Math.round(Number(weight) * (1 - pct / 100) * 10) / 10 : null)

/** The trend on (or the last one before) a day — the weight a body-fat entry is read against. */
export function trendOn(series, d) {
  let best = null
  for (const x of series) { if (x.d <= d) best = x; else break }
  return best ? best.trend : null
}

export const MEASURE_FIELDS = ['waist', 'neck', 'hip', 'chest', 'shoulders', 'arm', 'thigh', 'calf']
const live = xs => (xs || []).filter(e => e && !e.deleted)

/** Measurement entries, deletions left out, oldest first. */
export const liveMeasures = S => live(S?.measures).sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : (a.t || 0) - (b.t || 0)))

/** Per field, its first and latest value with their days: { waist: { first, last, change } … }. */
export function measureChanges(measures) {
  const out = {}
  for (const f of MEASURE_FIELDS) {
    const xs = measures.filter(m => Number(m[f]) > 0)
    if (!xs.length) continue
    const first = xs[0], last = xs.at(-1)
    out[f] = { first: { d: first.d, v: Number(first[f]) }, last: { d: last.d, v: Number(last[f]) }, change: Number(last[f]) - Number(first[f]) }
  }
  return out
}

/**
 * Every body-fat reading: the ones logged ({ method }) and, for each measurement that allows it,
 * the Navy estimate — with the lean mass against the weight trend of that day. Oldest first.
 */
export function bodyFatSeries(S) {
  const series = trendSeries(S?.bodyweight)
  const out = live(S?.bodyfat).filter(e => Number(e.pct) > 0)
    .map(e => ({ d: e.d, t: e.t, pct: Number(e.pct), method: e.method || 'other', id: e.id }))
  for (const m of liveMeasures(S)) {
    const pct = navyBodyFat({ sex: S?.profile?.sex, heightCm: S?.profile?.heightCm, neck: m.neck, waist: m.waist, hip: m.hip })
    if (pct != null) out.push({ d: m.d, t: m.t, pct, method: 'navy', id: 'navy:' + m.id })
  }
  return out.map(x => ({ ...x, lean: leanMass(trendOn(series, x.d), x.pct) }))
    .sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : (a.t || 0) - (b.t || 0)))
}
