import { describe, it, expect } from 'vitest'
import { mifflin, portion, dayTotals, adaptiveTdee, targets, foodFromOff, ageOn, PAL, ADAPT_MIN_DAYS } from './nutrition.js'

const iso = n => { const d = new Date(Date.UTC(2026, 8, 1) + n * 864e5); return d.toISOString().slice(0, 10) }

describe('mifflin (Mifflin–St Jeor 1990)', () => {
  it('men 80 kg, 180 cm, 40 y → 1730; women 60 kg, 165 cm, 30 y → 1320.25', () => {
    expect(mifflin({ sex: 'male', kg: 80, cm: 180, age: 40 })).toBe(1730)
    expect(mifflin({ sex: 'female', kg: 60, cm: 165, age: 30 })).toBeCloseTo(1320.25)
  })
  it('is null without every input', () => {
    expect(mifflin({ sex: 'male', kg: 80, cm: 180 })).toBe(null)
    expect(mifflin({ sex: null, kg: 80, cm: 180, age: 40 })).toBe(null)
  })
})

describe('portions and day totals', () => {
  const yogurt = { per100: { kcal: 97, p: 9, c: 3.6, f: 5 } }
  it('scales per-100 g values to the portion', () => {
    expect(portion(yogurt, 125)).toEqual({ kcal: 121, p: 11.3, c: 4.5, f: 6.3 })
  })
  it('totals a day, deletions left out', () => {
    const log = [{ id: 'a', d: iso(0), kcal: 300, p: 20, c: 30, f: 10 }, { id: 'b', d: iso(0), kcal: 200, p: 10, c: 5, f: 15 },
      { id: 'c', deleted: true, t: 3 }, { id: 'd', d: iso(1), kcal: 999 }]
    expect(dayTotals(log, iso(0))).toMatchObject({ kcal: 500, p: 30, c: 35, f: 25 })
  })
})

describe('adaptiveTdee', () => {
  const S = days => ({
    unit: 'kg',
    bodyweight: Array.from({ length: 30 }, (_, i) => ({ d: iso(i), w: 80 - i * 0.05 })),
    foodLog: Array.from({ length: days }, (_, i) => ({ id: 'f' + i, d: iso(29 - 1 - i), kcal: 2200 })),
  })
  it('needs the minimum of logged days', () => {
    expect(adaptiveTdee(S(ADAPT_MIN_DAYS - 1), iso(29))).toMatchObject({ tdee: null, reason: 'few-days' })
  })
  it('is mean intake minus the trend change times 7700 over the span', () => {
    const r = adaptiveTdee(S(20), iso(29))
    expect(r.reason).toBe(null)
    expect(r.intake).toBe(2200)
    expect(r.changeKg).toBeLessThan(0)
    // losing weight on 2200 kcal → expenditure above 2200
    expect(r.tdee).toBeGreaterThan(2200)
  })
})

describe('targets', () => {
  const base = {
    unit: 'kg', targetW: 75, profile: { sex: 'male', heightCm: 180, birthYear: 1986, activity: 'active' },
    bodyweight: [{ d: iso(0), w: 80 }],
    bodyfat: [{ id: 'f', d: iso(0), t: 1, pct: 20, method: 'scale' }],
    nutrition: { mode: 'formula', protPerKgLean: 2.3, fatPct: 25, ratePct: 0.75 },
  }
  it('formula: Mifflin × PAL minus the deficit for the rate aimed at; protein on lean mass; fat share; carbs the rest', () => {
    const r = targets(base, iso(0))
    const bmr = 10 * 80 + 6.25 * 180 - 5 * 40 + 5                       // age 40 in 2026
    expect(r.bmr).toBe(Math.round(bmr))
    expect(r.formulaTdee).toBe(Math.round(bmr * PAL.active))
    expect(r.deficit).toBe(Math.round(0.0075 * 80 * 7700 / 7))         // 660
    expect(r.kcal).toBe(r.formulaTdee - r.deficit)
    expect(r.leanKg).toBe(64)
    expect(r.protein).toBe(Math.round(2.3 * 64))
    expect(r.fat).toBe(Math.round(r.kcal * 0.25 / 9))
    expect(r.carbs).toBe(Math.round((r.kcal - r.protein * 4 - r.fat * 9) / 4))
    expect(r.missing).toEqual([])
  })
  it('no deficit when the goal is not below the trend', () => {
    expect(targets({ ...base, targetW: 82 }, iso(0)).deficit).toBe(0)
  })
  it('names what is missing instead of guessing', () => {
    const r = targets({ ...base, profile: { sex: 'male' }, bodyfat: [] }, iso(0))
    expect(r.kcal).toBe(null)
    expect(r.protein).toBe(null)
    expect(r.missing).toEqual(['height', 'age', 'activity', 'bodyfat'])
  })
  it('manual mode takes the typed numbers', () => {
    const r = targets({ ...base, nutrition: { ...base.nutrition, mode: 'manual', manualKcal: 2100, manualProtein: 170 } }, iso(0))
    expect(r).toMatchObject({ kcal: 2100, kcalFrom: 'manual', protein: 170, proteinFrom: 'manual' })
  })
})

describe('foodFromOff', () => {
  it('reads name, brand, code and per-100 g values from an API v2 product', () => {
    const f = foodFromOff({ code: '3017620422003', product_name: 'Nutella', brands: 'Nutella, Ferrero',
      nutriments: { 'energy-kcal_100g': 539, proteins_100g: 6.3, carbohydrates_100g: 57.5, fat_100g: 30.9 } })
    expect(f).toEqual({ name: 'Nutella', brand: 'Nutella', code: '3017620422003', per100: { kcal: 539, p: 6.3, c: 57.5, f: 30.9 }, servingG: null, source: 'off' })
  })
  it('prefers the Spanish name, and refuses a product without energy', () => {
    expect(foodFromOff({ product_name: 'Greek yogurt', product_name_es: 'Yogur griego', nutriments: { 'energy-kcal_100g': 97 } }).name).toBe('Yogur griego')
    expect(foodFromOff({ product_name: 'X', nutriments: {} })).toBe(null)
  })
  it('age from the birth year', () => { expect(ageOn(1986, '2026-10-07')).toBe(40) })
})
