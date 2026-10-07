import { describe, it, expect } from 'vitest'
import { pearson, strengthOf, splitAtMedian, weeklyRelations, MIN_WEEKS } from './correlation.js'

describe('pearson', () => {
  it('is 1 and -1 on perfect lines, and null when a side does not vary', () => {
    expect(pearson([1, 2, 3], [2, 4, 6])).toBeCloseTo(1)
    expect(pearson([1, 2, 3], [3, 2, 1])).toBeCloseTo(-1)
    expect(pearson([2, 2, 2], [1, 2, 3])).toBe(null)
    expect(pearson([1], [1])).toBe(null)
  })
  it('matches a hand-worked value', () => {
    // x 1..5, y 2,4,5,4,5 → r = 0.7746
    expect(pearson([1, 2, 3, 4, 5], [2, 4, 5, 4, 5])).toBeCloseTo(0.7746, 4)
  })
})

describe('strengthOf', () => {
  it('names Cohen\'s bands on |r|', () => {
    expect(strengthOf(0.05)).toBe('none')
    expect(strengthOf(-0.2)).toBe('small')
    expect(strengthOf(0.3)).toBe('medium')
    expect(strengthOf(-0.62)).toBe('large')
  })
})

describe('splitAtMedian', () => {
  it('averages the change of the weeks above and at-or-below the median', () => {
    const s = splitAtMedian([2, 4, 4, 2, 5, 3], [0, -1, -0.6, 0.2, -0.8, 0])
    expect(s.threshold).toBe(4)
    expect(s.more.weeks).toBe(3)
    expect(s.more.change).toBeCloseTo(-0.8)
    expect(s.less.weeks).toBe(3)
    expect(s.less.change).toBeCloseTo(0.0667, 3)
  })
  it('splits at the median itself when it is also the top value', () => {
    const s = splitAtMedian([3, 3, 2, 3, 1], [-0.5, -0.4, 0, -0.6, 0.2])
    expect(s.threshold).toBe(3)
    expect(s.more.weeks).toBe(3)
    expect(s.less.weeks).toBe(2)
  })
  it('is null when every week has the same value', () => {
    expect(splitAtMedian([3, 3, 3], [1, 2, 3])).toBe(null)
  })
})

describe('weeklyRelations — lopsided weeks', () => {
  it('a strong r carried by one odd week is listed as unclear, not as a relation', () => {
    const weeks = Array.from({ length: 9 }, (_, i) => ({ vars: { pull: i === 0 ? 0 : 1 }, change: i === 0 ? 0.8 : -0.3 + (i % 3) * 0.05 }))
    const r = weeklyRelations(weeks, ['pull'])
    expect(r.findings).toEqual([])
    expect(r.weak).toEqual(['pull'])
  })
})

describe('weeklyRelations', () => {
  const wk = (sessions, cardio, change) => ({ vars: { sessions, cardio }, change })
  it('concludes nothing below the minimum of paired weeks', () => {
    const weeks = Array.from({ length: MIN_WEEKS - 1 }, (_, i) => wk(i, 0, -i / 10))
    expect(weeklyRelations(weeks, ['sessions'])).toEqual({ enough: false, weeks: MIN_WEEKS - 1, findings: [], weak: [] })
  })
  it('weeks without a weight change do not count towards the minimum', () => {
    const weeks = [...Array.from({ length: MIN_WEEKS - 1 }, (_, i) => wk(i, 0, -i / 10)), wk(3, 0, null)]
    expect(weeklyRelations(weeks, ['sessions']).enough).toBe(false)
  })
  it('reports a strong relation with its direction and the plain split, and lists weak ones apart', () => {
    // more sessions ↔ more loss the week after; cardio unrelated
    const weeks = [wk(2, 30, 0.1), wk(4, 0, -0.6), wk(3, 30, -0.2), wk(5, 0, -0.8), wk(1, 30, 0.3),
      wk(4, 0, -0.5), wk(2, 30, 0), wk(5, 0, -0.7), wk(3, 30, -0.3)]
    const r = weeklyRelations(weeks, ['sessions', 'cardio'])
    expect(r.enough).toBe(true)
    expect(r.weeks).toBe(9)
    expect(r.findings[0].key).toBe('sessions')
    expect(r.findings[0].strength).toBe('large')
    expect(r.findings[0].direction).toBe('more-loss')
    expect(r.findings[0].split.more.change).toBeLessThan(r.findings[0].split.less.change)
  })
})
