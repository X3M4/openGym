import { describe, it, expect } from 'vitest'
import { dailyWeights, trendSeries, weeklyRate, rateBand, isCutting, navyBodyFat, leanMass, measureChanges, bodyFatSeries, liveMeasures } from './body-comp.js'

const day = n => `2026-09-${String(n).padStart(2, '0')}`

describe('trend (Hacker\'s Diet, 10%)', () => {
  it('averages a day\'s weigh-ins, starts at the first weight and moves 10% of the gap', () => {
    expect(dailyWeights([{ d: day(1), w: 80 }, { d: day(1), w: 81 }])).toEqual([{ d: day(1), w: 80.5 }])
    const s = trendSeries([{ d: day(1), w: 80 }, { d: day(2), w: 82 }])
    expect(s.map(x => x.trend)).toEqual([80, 80.2])
  })
  it('carries the trend over days without a weigh-in', () => {
    const s = trendSeries([{ d: day(1), w: 80 }, { d: day(4), w: 79 }])
    expect(s.map(x => x.d)).toEqual([day(1), day(2), day(3), day(4)])
    expect(s[2]).toEqual({ d: day(3), w: null, trend: 80 })
    expect(s[3].trend).toBeCloseTo(79.9)
  })
})

describe('weeklyRate', () => {
  const daily = (n, from, step) => Array.from({ length: n }, (_, i) => ({ d: day(i + 1), w: from + step * i }))
  it('is the trend\'s change over 14 days, per week, as % of body weight', () => {
    const r = weeklyRate(daily(28, 80, -0.1), day(28))
    expect(r.reason).toBe(null)
    expect(r.rate).toBeLessThan(0)
    expect(r.since).toBe(day(14))
    expect(r.kgPerWeek).toBeCloseTo((r.trend - trendSeries(daily(28, 80, -0.1))[13].trend) / 2, 6)
  })
  it('says why it gives no rate', () => {
    expect(weeklyRate([], day(10)).reason).toBe('no-data')
    expect(weeklyRate(daily(10, 80, 0), day(10)).reason).toBe('short')
    expect(weeklyRate([{ d: day(1), w: 80 }, { d: day(20), w: 79 }], day(20)).reason).toBe('few')
    expect(weeklyRate(daily(20, 80, 0), '2026-10-05').reason).toBe('stale')
  })
})

describe('rateBand (Helms et al. 2014: 0.5–1%/week)', () => {
  it('names the band of a weekly rate', () => {
    expect(rateBand(-1.3)).toBe('fast')
    expect(rateBand(-0.7)).toBe('in-range')
    expect(rateBand(-0.5)).toBe('in-range')
    expect(rateBand(-0.2)).toBe('slow')
    expect(rateBand(0.1)).toBe('not-losing')
    expect(rateBand(null)).toBe(null)
  })
  it('a goal under the trend is a cut', () => {
    expect(isCutting(76, 80)).toBe(true)
    expect(isCutting(82, 80)).toBe(false)
    expect(isCutting(null, 80)).toBe(false)
  })
})

describe('navyBodyFat (Hodgdon & Beckett 1984, metric)', () => {
  it('men: 180 cm, neck 40, waist 90 → 18.4%', () => {
    expect(navyBodyFat({ sex: 'male', heightCm: 180, neck: 40, waist: 90 })).toBe(18.4)
  })
  it('women: 165 cm, neck 33, waist 75, hip 98 → 28.4%', () => {
    // 495 / (1.29579 − 0.35004·log10(140) + 0.22100·log10(165)) − 450
    const expected = Math.round((495 / (1.29579 - 0.35004 * Math.log10(140) + 0.221 * Math.log10(165)) - 450) * 10) / 10
    expect(navyBodyFat({ sex: 'female', heightCm: 165, neck: 33, waist: 75, hip: 98 })).toBe(expected)
  })
  it('is null without the measurements the equation needs, or without a sex', () => {
    expect(navyBodyFat({ sex: 'male', heightCm: 180, neck: 40 })).toBe(null)
    expect(navyBodyFat({ sex: 'female', heightCm: 165, neck: 33, waist: 75 })).toBe(null)
    expect(navyBodyFat({ sex: null, heightCm: 180, neck: 40, waist: 90 })).toBe(null)
    expect(navyBodyFat({ sex: 'male', heightCm: 180, neck: 40, waist: 38 })).toBe(null)
  })
})

describe('lean mass, measurement changes, body-fat series', () => {
  it('lean mass is weight × (1 − fat %)', () => {
    expect(leanMass(80, 20)).toBe(64)
    expect(leanMass(null, 20)).toBe(null)
  })
  it('measurement changes run first to last per field, deletions left out', () => {
    const S = { measures: [{ id: 'a', d: day(1), t: 1, waist: 92 }, { id: 'x', deleted: true, t: 3 }, { id: 'b', d: day(20), t: 2, waist: 89.5, arm: 36 }] }
    const ch = measureChanges(liveMeasures(S))
    expect(ch.waist.change).toBeCloseTo(-2.5)
    expect(ch.arm.change).toBe(0)
  })
  it('the body-fat series carries logged readings and Navy estimates, each with its lean mass', () => {
    const S = {
      profile: { sex: 'male', heightCm: 180 },
      bodyweight: [{ d: day(1), w: 80 }],
      bodyfat: [{ id: 'f', d: day(1), t: 1, pct: 20, method: 'scale' }, { id: 'g', deleted: true, t: 2 }],
      measures: [{ id: 'm', d: day(2), t: 3, neck: 40, waist: 90 }],
    }
    const s = bodyFatSeries(S)
    expect(s.map(x => x.method)).toEqual(['scale', 'navy'])
    expect(s[0].lean).toBe(64)
    expect(s[1].pct).toBe(18.4)
  })
})
