import { describe, it, expect } from 'vitest'
import { EXDB } from './exercises.js'
import { buildPeriodReport, workoutFacts, calendarDays, weeklySeries, daysBetween, presetRange } from './period-report.js'

const chest = EXDB.find(e => e.bp === 'chest').id
const legs = EXDB.find(e => e.bp === 'upper legs').id
const run = EXDB.find(e => e.bp === 'cardio').id
const set = (w, r, extra = {}) => ({ w, r, done: true, ...extra })
const H = 3600000

const S0 = () => ({
  unit: 'kg', weekStart: 1, dayPlan: {},
  routines: [{ id: 'A', name: 'Full A', ex: [{ id: chest, sets: 3 }] }, { id: 'B', name: 'Full B', ex: [{ id: legs, sets: 3 }] }],
  week: { 1: ['A'], 3: ['B'] },          // Monday A, Wednesday B
  workouts: [], bodyweight: [],
})

describe('workoutFacts', () => {
  it('counts done work sets, warm-ups apart, reps volume, cardio minutes and the kind', () => {
    const f = workoutFacts({ id: 'w', d: '2026-09-07', start: 1e12, end: 1e12 + H, routineIds: ['A'], prs: [{}], entries: [
      { id: chest, sets: [set(20, 10, { phase: 'warmup' }), set(60, 8), set(60, 8), { w: 60, r: 8, done: false }] },
      { id: run, sets: [{ min: 20, speed: 9, done: true }] },
    ] })
    expect(f).toMatchObject({ sets: 3, warmups: 1, volume: 960, cardioMin: 20, kind: 'mixed', durMs: H, prs: 1, routineIds: ['A'] })
    expect(f.exercises.map(e => e.id)).toEqual([chest, run])
  })
  it('a drop-set adds its drops to the volume; a timed hold adds none', () => {
    const f = workoutFacts({ id: 'w', d: '2026-09-07', entries: [
      { id: chest, sets: [set(60, 8, { type: 'dropset', drops: [{ w: 45, r: 6 }] })] },
      { id: legs, sets: [{ sec: 45, w: 0, done: true }] },
    ] })
    expect(f.volume).toBe(60 * 8 + 45 * 6)
    expect(f.sets).toBe(2)
    expect(f.kind).toBe('strength')
  })
})

describe('calendarDays', () => {
  it('marks done, missed (past, planned, nothing logged), planned (still to come), rest and moved days', () => {
    const S = S0()
    S.workouts = [{ id: 'w1', d: '2026-09-07', name: 'Full A', entries: [] }]       // Monday done
    S.dayPlan = { '2026-09-11': 'B' }                                                // Friday moved in
    const days = calendarDays(S, '2026-09-07', '2026-09-13', '2026-09-10')
    const by = Object.fromEntries(days.map(d => [d.d, d]))
    expect(by['2026-09-07'].status).toBe('done')
    expect(by['2026-09-09'].status).toBe('missed')                                  // Wednesday B, past
    expect(by['2026-09-11']).toMatchObject({ status: 'planned', moved: true })
    expect(by['2026-09-08'].status).toBe('rest')
  })
})

describe('weeklySeries', () => {
  it('relates each week to the change of the average weight into the next week', () => {
    const S = S0()
    S.bodyweight = [{ d: '2026-09-07', w: 80 }, { d: '2026-09-09', w: 82 }, { d: '2026-09-15', w: 80.5 }]
    const weeks = weeklySeries(S, [], '2026-09-07', '2026-09-20', 1)
    expect(weeks.map(w => w.week)).toEqual(['2026-09-07', '2026-09-14'])
    expect(weeks[0].avgWeight).toBe(81)
    expect(weeks[0].change).toBeCloseTo(-0.5)
    expect(weeks[1].change).toBe(null)                                              // no weigh-in the week after
  })
})

describe('buildPeriodReport', () => {
  it('summarises the range and counts adherence over past planned days only', () => {
    const S = S0()
    S.workouts = [
      { id: 'w1', d: '2026-09-07', start: 1e12, end: 1e12 + H, routineIds: ['A'], prs: [{}, {}], entries: [{ id: chest, sets: [set(60, 8), set(60, 8)] }] },
      { id: 'w0', d: '2026-08-30', entries: [{ id: chest, sets: [set(100, 1)] }] },  // outside the range
    ]
    S.bodyweight = [{ d: '2026-09-07', w: 81 }, { d: '2026-09-12', w: 80.4 }]
    const r = buildPeriodReport(S, { from: '2026-09-07', to: '2026-09-13', today: '2026-09-14' })
    expect(r.summary).toMatchObject({ sessions: 1, plannedDays: 2, plannedDone: 1, adherence: 0.5, sets: 2, volume: 960, timeMs: H, prs: 2 })
    expect(r.summary.weightFirst.y).toBe(81)
    expect(r.summary.weightLast.y).toBe(80.4)
    expect(r.days).toHaveLength(7)
    expect(r.bodyParts).toEqual([{ bp: 'chest', sets: 2 }])
    expect(r.lifts[0].id).toBe(chest)
    expect(r.relations.enough).toBe(false)
  })
})

describe('daysBetween', () => {
  it('is inclusive and crosses month ends', () => {
    expect(daysBetween('2026-09-29', '2026-10-02')).toEqual(['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02'])
  })
})

describe('presetRange', () => {
  it('gives the four shortcuts as inclusive ranges', () => {
    expect(presetRange('last4w', '2026-10-06')).toEqual({ from: '2026-09-09', to: '2026-10-06' })
    expect(presetRange('month', '2026-10-06')).toEqual({ from: '2026-10-01', to: '2026-10-06' })
    expect(presetRange('lastMonth', '2026-10-06')).toEqual({ from: '2026-09-01', to: '2026-09-30' })
    expect(presetRange('lastMonth', '2026-01-15')).toEqual({ from: '2025-12-01', to: '2025-12-31' })
    expect(presetRange('last3m', '2026-10-06')).toEqual({ from: '2026-07-08', to: '2026-10-06' })
  })
})
