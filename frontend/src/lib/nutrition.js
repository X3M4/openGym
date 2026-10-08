// Nutrition (SuperOpenGym Phase 6): energy and macro targets, what a portion of a food holds, the
// day's totals, and the adaptive estimate of expenditure. Pure; the UI is views/Nutrition.jsx.
//
// Sources, as the app cites them:
//   Resting energy — Mifflin M. D., St Jeor S. T. et al., Am J Clin Nutr 1990;51:241–247:
//                    men 10·kg + 6.25·cm − 5·age + 5, women 10·kg + 6.25·cm − 5·age − 161.
//   Activity       — physical activity level (PAL) bands of the FAO/WHO/UNU Expert Consultation
//                    on Human Energy Requirements (2001): sedentary/light 1.40–1.69, active/
//                    moderately active 1.70–1.99, vigorous 2.00–2.40. The app uses each band's
//                    midpoint (its own choice).
//   Deficit        — ~7700 kcal per kg of weight lost (the 3500 kcal/lb rule). Hall K. D.,
//                    Int J Obes 2008;32:573–576, shows it overestimates the deficit per kg for
//                    leaner people: an approximation, labelled as one.
//   Protein        — 2.3–3.1 g per kg of lean body mass in a deficit (Helms E. R., Aragon A. A.,
//                    Fitschen P. J., J Int Soc Sports Nutr 2014;11:20).
//   Fat            — 15–30% of calories (same source); carbohydrate is what remains.
import { convertBodyWeight } from './units.js'
import { trendSeries, weeklyRate, bodyFatSeries, leanMass, isCutting } from './body-comp.js'

export const KCAL_PER_KG = 7700
export const PAL = { sedentary: 1.55, active: 1.85, vigorous: 2.2 }
export const PROTEIN_RANGE = { low: 2.3, high: 3.1 }      // g per kg of lean mass
export const FAT_RANGE = { low: 15, high: 30 }            // % of calories
// The adaptive estimate's own rules (SuperOpenGym's, not a source): look back ADAPT_WINDOW days,
// and only with at least ADAPT_MIN_DAYS of them logged.
export const ADAPT_WINDOW = 21
export const ADAPT_MIN_DAYS = 14
export const MEALS = ['breakfast', 'midmorning', 'lunch', 'snack', 'dinner']

const DAY = 86400000
const dateOf = iso => new Date(iso + 'T12:00:00')
const isoOf = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const addDays = (iso, n) => isoOf(new Date(dateOf(iso).getTime() + n * DAY))
const r0 = v => Math.round(v)
const r1 = v => Math.round(v * 10) / 10
const toKg = (w, unit) => (unit === 'lb' ? convertBodyWeight(w, 'lb', 'kg') : w)

export const ageOn = (birthYear, today) => (birthYear > 1900 ? dateOf(today).getFullYear() - birthYear : null)

/** Resting energy expenditure, kcal/day (Mifflin–St Jeor). Null without every input. */
export function mifflin({ sex, kg, cm, age }) {
  if (!(kg > 0) || !(cm > 0) || !(age > 0)) return null
  const base = 10 * kg + 6.25 * cm - 5 * age
  return sex === 'male' ? base + 5 : sex === 'female' ? base - 161 : null
}

/** Energy and macros held by `g` grams of a food described per 100 g. */
export function portion(food, g) {
  const f = (Number(g) || 0) / 100, p = food?.per100 || {}
  return { kcal: r0((p.kcal || 0) * f), p: r1((p.p || 0) * f), c: r1((p.c || 0) * f), f: r1((p.f || 0) * f) }
}

/**
 * A saved-meal item at a new weight: its energy and macros scale from what it was saved with.
 * An item without a weight, or a weight of zero or less, is left as it is.
 */
export function rescaleItem(it, g) {
  const old = Number(it?.g) || 0, n = Number(g) || 0
  if (old <= 0 || n <= 0) return it
  const k = n / old
  return { ...it, g: n, kcal: r0((Number(it.kcal) || 0) * k), p: r1((Number(it.p) || 0) * k), c: r1((Number(it.c) || 0) * k), f: r1((Number(it.f) || 0) * k) }
}

const live = xs => (xs || []).filter(e => e && !e.deleted)

/** A day's log entries and totals. */
export function dayTotals(foodLog, d) {
  const items = live(foodLog).filter(e => e.d === d)
  const sum = k => items.reduce((n, e) => n + (Number(e[k]) || 0), 0)
  return { items, kcal: r0(sum('kcal')), p: r1(sum('p')), c: r1(sum('c')), f: r1(sum('f')) }
}

/**
 * Expenditure from what was eaten and how the weight trend moved over the last ADAPT_WINDOW days
 * up to yesterday: mean intake of the logged days − (trend change × 7700) / days. Null, with a
 * reason, when there is not enough: 'few-days' | 'no-trend'.
 */
export function adaptiveTdee(S, today) {
  const end = addDays(today, -1), start = addDays(end, -(ADAPT_WINDOW - 1))
  const days = new Map()
  for (const e of live(S?.foodLog)) {
    if (e.d < start || e.d > end) continue
    days.set(e.d, (days.get(e.d) || 0) + (Number(e.kcal) || 0))
  }
  if (days.size < ADAPT_MIN_DAYS) return { tdee: null, reason: 'few-days', days: days.size }
  const series = trendSeries(S?.bodyweight)
  const at = d => { let x = null; for (const p of series) { if (p.d <= d) x = p; else break } return x }
  const a = at(start), b = at(end)
  if (!a || !b || a.d === b.d) return { tdee: null, reason: 'no-trend', days: days.size }
  const intake = [...days.values()].reduce((n, k) => n + k, 0) / days.size
  const changeKg = toKg(b.trend, S.unit) - toKg(a.trend, S.unit)
  const span = Math.round((dateOf(b.d) - dateOf(a.d)) / DAY)
  return { tdee: r0(intake - (changeKg * KCAL_PER_KG) / span), reason: null, days: days.size, intake: r0(intake), changeKg: r1(changeKg) }
}

/**
 * The day's targets and how each was reached. `missing` lists what the profile still needs
 * ('sex' | 'height' | 'age' | 'activity' | 'weight' | 'bodyfat').
 */
export function targets(S, today) {
  const N = { mode: 'adaptive', protPerKgLean: PROTEIN_RANGE.low, fatPct: 25, ratePct: 0.75, ...(S?.nutrition || {}) }
  const P = S?.profile || {}
  const series = trendSeries(S?.bodyweight)
  const trend = series.at(-1)?.trend ?? null
  const kg = trend != null ? toKg(trend, S.unit) : null
  const age = ageOn(P.birthYear, today)
  const missing = []
  if (!P.sex) missing.push('sex')
  if (!(P.heightCm > 0)) missing.push('height')
  if (age == null) missing.push('age')
  if (!PAL[P.activity]) missing.push('activity')
  if (kg == null) missing.push('weight')

  const bmr = mifflin({ sex: P.sex, kg, cm: P.heightCm, age })
  const formulaTdee = bmr != null && PAL[P.activity] ? r0(bmr * PAL[P.activity]) : null
  const adaptive = adaptiveTdee(S, today)
  const cutting = isCutting(S?.targetW, trend)
  const deficit = cutting && kg != null ? r0((N.ratePct / 100) * kg * KCAL_PER_KG / 7) : 0

  let kcal = null, kcalFrom = null, tdee = null
  if (N.mode === 'manual' && N.manualKcal > 0) { kcal = r0(N.manualKcal); kcalFrom = 'manual' }
  else {
    tdee = N.mode === 'adaptive' && adaptive.tdee != null ? adaptive.tdee : formulaTdee
    if (tdee != null) { kcal = tdee - deficit; kcalFrom = N.mode === 'adaptive' && adaptive.tdee != null ? 'adaptive' : 'formula' }
  }

  // protein on lean mass: the latest body-fat reading against the trend
  const fat = bodyFatSeries(S).at(-1) || null
  const leanKg = fat && kg != null ? leanMass(kg, fat.pct) : null
  let protein = null, proteinFrom = null
  if (N.mode === 'manual' && N.manualProtein > 0) { protein = r0(N.manualProtein); proteinFrom = 'manual' }
  else if (leanKg != null) { protein = r0(N.protPerKgLean * leanKg); proteinFrom = 'lean' }
  else missing.push('bodyfat')

  const fatG = kcal != null ? r0((kcal * N.fatPct / 100) / 9) : null
  const carbsG = kcal != null && protein != null && fatG != null ? Math.max(0, r0((kcal - protein * 4 - fatG * 9) / 4)) : null
  return { kcal, kcalFrom, tdee, formulaTdee, bmr: bmr != null ? r0(bmr) : null, adaptive, deficit, cutting, protein, proteinFrom, leanKg,
    fat: fatG, carbs: carbsG, settings: N, missing, trendKg: kg != null ? r1(kg) : null, age, rate: weeklyRate(S?.bodyweight, today) }
}

/** An Open Food Facts product (API v2 JSON, `product` object) as a food; null without energy. */
export function foodFromOff(product, lang = 'es') {
  if (!product) return null
  const n = product.nutriments || {}
  const kcal = Number(n['energy-kcal_100g'])
  if (!(kcal >= 0) || n['energy-kcal_100g'] == null) return null
  const name = product[`product_name_${lang}`] || product.product_name || product.generic_name || ''
  if (!name) return null
  return {
    name: String(name).trim(), brand: String(product.brands || '').split(',')[0].trim(),
    code: product.code ? String(product.code) : null,
    per100: { kcal: r1(kcal), p: r1(Number(n.proteins_100g) || 0), c: r1(Number(n.carbohydrates_100g) || 0), f: r1(Number(n.fat_100g) || 0) },
    servingG: Number(product.serving_quantity) > 0 ? Number(product.serving_quantity) : null,
    source: 'off',
  }
}
