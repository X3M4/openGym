import { describe, it, expect } from 'vitest'
import { EXDB } from './exercises.js'
import { volumeAlerts, strengthAlerts, deficitAlerts, topLifts, nextMonday9, setsByWeekAndPart } from './deficit-alerts.js'

const chest = EXDB.find(e => e.bp === 'chest').id
const back = EXDB.find(e => e.bp === 'back').id
const set = (w, r, extra = {}) => ({ w, r, done: true, ...extra })
const iso = d => d.toISOString().slice(0, 10)
const monday = '2026-10-05'                                  // a Monday
const weeksBack = n => { const d = new Date(monday + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - 7 * n); return iso(d) }

describe('volumeAlerts (Bickel 2011: a third of the usual)', () => {
  const workouts = sets => sets.map((n, i) => ({ id: 'w' + i, d: weeksBack(i + 1), entries: [{ id: chest, sets: Array.from({ length: n }, () => set(60, 8)) }] }))
  it('flags last week when it falls under a third of the mean of the 8 before', () => {
    // last week (1 back) 2 sets; the 8 before: 9 sets each → usual 9, a third 3
    const S = { workouts: workouts([2, 9, 9, 9, 9, 9, 9, 9, 9]) }
    const a = volumeAlerts(S, '2026-10-07', 1)
    expect(a).toHaveLength(1)
    expect(a[0]).toMatchObject({ kind: 'volume', bp: 'chest', week: weeksBack(1), sets: 2, usual: 9 })
  })
  it('stays quiet at a third or more, and for muscles trained too little to watch', () => {
    expect(volumeAlerts({ workouts: workouts([3, 9, 9, 9, 9, 9, 9, 9, 9]) }, '2026-10-07', 1)).toEqual([])
    expect(volumeAlerts({ workouts: workouts([0, 2, 2, 2, 2, 2, 2, 2, 2]) }, '2026-10-07', 1)).toEqual([])   // usual under 3 sets
    expect(volumeAlerts({ workouts: workouts([0, 30, 30, 0, 0, 0, 0, 0, 0]) }, '2026-10-07', 1)).toEqual([]) // trained in only 2 of 8 weeks
  })
  it('warm-ups do not count as sets', () => {
    const S = { workouts: [{ id: 'w', d: weeksBack(1), entries: [{ id: chest, sets: [set(20, 10, { phase: 'warmup' }), set(60, 8)] }] }] }
    expect(setsByWeekAndPart(S, 1).get(weeksBack(1))).toEqual({ chest: 1 })
  })
})

describe('strengthAlerts (own rule: 5% drop, last 3 weeks vs the 6 before)', () => {
  const w = (d, id, kg, reps) => ({ id: d + id, d, entries: [{ id, sets: [set(kg, reps)] }] })
  it('flags a most-trained lift whose best recent estimate dropped 5% or more', () => {
    const S = { workouts: [w('2026-08-20', chest, 100, 5), w('2026-09-05', chest, 100, 5), w('2026-09-25', chest, 92, 5), w('2026-10-03', chest, 93, 5),
      w('2026-08-20', back, 80, 8), w('2026-10-01', back, 79, 8)] }
    const a = strengthAlerts(S, '2026-10-07')
    expect(a.map(x => x.id)).toEqual([chest])
    expect(a[0].drop).toBe(7)
  })
  it('needs a session in both windows', () => {
    expect(strengthAlerts({ workouts: [w('2026-10-01', chest, 50, 5)] }, '2026-10-07')).toEqual([])
  })
  it('watches the 4 most trained lifts', () => {
    expect(topLifts({ workouts: [w('2026-10-01', chest, 50, 5), w('2026-10-02', chest, 50, 5), w('2026-10-02', back, 50, 5)] }, '2026-10-07')).toEqual([chest, back])
  })
})

describe('deficitAlerts and the weekly notification day', () => {
  it('separates acknowledged alerts from new ones', () => {
    const S = { workouts: [], alertsSeen: ['vol:chest:x'] }
    expect(deficitAlerts(S, '2026-10-07')).toEqual({ all: [], unseen: [] })
  })
  it('the next Monday at 9:00, a week on when it is Monday after 9', () => {
    expect(nextMonday9(new Date(2026, 9, 7, 15))).toEqual(new Date(2026, 9, 12, 9))     // Wednesday → next Monday
    expect(nextMonday9(new Date(2026, 9, 12, 8))).toEqual(new Date(2026, 9, 12, 9))     // Monday before 9 → today
    expect(nextMonday9(new Date(2026, 9, 12, 10))).toEqual(new Date(2026, 9, 19, 9))    // Monday after 9 → next week
  })
})
