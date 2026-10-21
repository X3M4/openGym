import { describe, expect, it } from 'vitest'
import { EXIDX } from './exercises.js'
import { buildStarterPlan, starterPlanDays, starterPlanOptions, starterRoutines } from './starter.js'

// The approved prescription, written out again rather than imported: a test that reads the
// same table as the code would pass no matter what that table said. [weekday, name, sets].
const APPROVED = {
  ppl: [
    [1, 'Push Day', [['0025', 4, 8], ['0047', 3, 10], ['0426', 3, 10], ['0334', 3, 12], ['0241', 3, 12], ['0251', 3, 10]]],
    [3, 'Pull Day', [['2330', 4, 10], ['0027', 4, 8], ['1323', 3, 10], ['0031', 3, 10], ['0313', 3, 12]]],
    [5, 'Leg Day', [['0043', 4, 8], ['0085', 3, 10], ['0739', 3, 12], ['0585', 3, 12], ['0586', 3, 12], ['0605', 4, 15]]],
  ],
  'upper-lower': [
    [1, 'Upper A', [['0025', 3, 8], ['2330', 3, 10], ['0047', 2, 10], ['1323', 2, 10], ['0334', 2, 12], ['0241', 2, 12], ['0031', 2, 12]]],
    [2, 'Lower A', [['0043', 3, 8], ['0085', 3, 8], ['0739', 2, 10], ['0586', 2, 12], ['0605', 3, 15]]],
    [4, 'Upper B', [['0047', 3, 8], ['0027', 3, 8], ['0426', 2, 10], ['2330', 2, 10], ['0334', 2, 12], ['0241', 2, 12], ['0313', 2, 12]]],
    [5, 'Lower B', [['0739', 3, 10], ['0085', 2, 10], ['0585', 2, 12], ['0586', 3, 12], ['0605', 3, 15]]],
  ],
  'full-body': [
    [1, 'Full Body A', [['0043', 3, 8], ['0025', 3, 8], ['2330', 3, 10], ['0586', 3, 12], ['0334', 2, 12], ['0031', 2, 12]]],
    [3, 'Full Body B', [['0085', 3, 8], ['0047', 3, 10], ['1323', 3, 10], ['0585', 3, 12], ['0334', 2, 12], ['0241', 2, 12]]],
    [5, 'Full Body C', [['0739', 3, 10], ['0025', 2, 10], ['0027', 3, 10], ['0426', 2, 10], ['0586', 3, 12], ['0605', 3, 15]]],
  ],
  '5x5': [
    [1, '5×5 A', [['0043', 5, 5], ['0025', 5, 5], ['0027', 5, 5]]],
    [3, '5×5 B', [['0085', 5, 5], ['0426', 5, 5], ['2330', 5, 5]]],
    [5, '5×5 C', [['0739', 5, 5], ['0047', 5, 5], ['1323', 5, 5]]],
  ],
}

const shape = r => r.ex.map(e => [e.id, e.sets, e.reps])

describe('starter plan catalog', () => {
  it('offers exactly the five plans, with the day count read off the schedule', () => {
    expect(starterPlanOptions()).toEqual([
      { id: 'ppl', days: 3 }, { id: 'upper-lower', days: 4 },
      { id: 'full-body', days: 3 }, { id: '5x5', days: 3 },
      { id: 'paired-split', days: 3 },
    ])
    for (const { id, days } of starterPlanOptions()) expect(starterPlanDays(id)).toHaveLength(days)
  })

  it('changes nothing for an unknown plan id', () => {
    expect(buildStarterPlan('nope')).toBeNull()
    expect(buildStarterPlan(undefined)).toBeNull()
    // A click handler wired straight to a loader would hand the event in as the plan.
    expect(buildStarterPlan({ type: 'click' })).toBeNull()
    expect(starterPlanDays('nope')).toBeNull()
  })
})

describe.each(Object.keys(APPROVED))('%s', planId => {
  const approved = APPROVED[planId]

  it('builds the approved exercises, sets and reps in order', () => {
    const { routines } = buildStarterPlan(planId)
    expect(routines.map(r => r.name)).toEqual(approved.map(([, name]) => name))
    routines.forEach((r, i) => expect(shape(r)).toEqual(approved[i][2]))
  })

  it('puts each routine on its approved weekday, by identity not position', () => {
    const { routines, schedule } = buildStarterPlan(planId)
    const nameOf = Object.fromEntries(routines.map(r => [r.id, r.name]))
    expect(schedule.map(({ day, routineId }) => [day, nameOf[routineId]]))
      .toEqual(approved.map(([day, name]) => [day, name]))
  })

  it('references only real exercises and starts every one at weight 0', () => {
    for (const r of buildStarterPlan(planId).routines) {
      for (const e of r.ex) {
        expect(EXIDX[e.id], e.id).toBeTruthy()
        expect(e.sets).toBeGreaterThan(0)
        expect(e.reps).toBeGreaterThan(0)
        expect(e.weight).toBe(0)
      }
    }
  })

  it('mints fresh ids and independent objects on every build', () => {
    const first = buildStarterPlan(planId)
    const second = buildStarterPlan(planId)
    const ids = first.routines.map(r => r.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(second.routines.some(r => ids.includes(r.id))).toBe(false)
    expect(first.routines[0].ex[0]).not.toBe(second.routines[0].ex[0])
    // and the static definition survives a caller mutating what it got back
    first.routines[0].ex[0].sets = 99
    expect(buildStarterPlan(planId).routines[0].ex[0].sets).toBe(approved[0][2][0][1])
  })
})

describe('starterRoutines (the demo build entry point)', () => {
  it('still returns push, pull and legs unchanged', () => {
    const routines = starterRoutines()
    expect(routines.map(r => r.name)).toEqual(['Push Day', 'Pull Day', 'Leg Day'])
    routines.forEach((r, i) => expect(shape(r)).toEqual(APPROVED.ppl[i][2]))
    expect(routines.map(r => r.emoji)).toEqual(['barbell', 'pullup', 'legs'])
  })

  it('mints fresh ids on every invocation', () => {
    const first = starterRoutines().map(r => r.id)
    const second = starterRoutines().map(r => r.id)
    expect(new Set([...first, ...second]).size).toBe(6)
  })
})

// The paired split carries more than [id, sets, reps]: rep ranges under double progression,
// rests, supersets, cardio warm-ups/finishers and per-slot alternatives.
describe('paired-split', () => {
  // [weekday, name, [[id, sets, repsMin, reps]]] — lifting slots only, cardio checked apart.
  const APPROVED_SPLIT = [
    [1, 'Chest + Back', [['0025', 4, 6, 8], ['2616', 4, 8, 10], ['1299', 3, 8, 10], ['0292', 3, 8, 10], ['0227', 3, 12, 15], ['1323', 3, 10, 12], ['0581', 3, 10, 12], ['0203', 3, 12, 15], ['0375', 2, 10, 12]]],
    [3, 'Legs + Back', [['0043', 4, 6, 8], ['2330', 4, 8, 10], ['0739', 3, 10, 12], ['1350', 3, 8, 10], ['1409', 3, 10, 12], ['0586', 3, 10, 12], ['0585', 3, 12, 15], ['0237', 3, 12, 15], ['0738', 3, 12, 15]]],
    [5, 'Chest + Arms', [['0314', 4, 8, 10], ['0577', 3, 8, 10], ['0751', 3, 8, 10], ['0308', 3, 12, 15], ['0031', 3, 8, 10], ['0060', 3, 8, 10], ['0070', 3, 10, 12], ['0200', 3, 12, 15], ['0313', 3, 10, 12], ['0194', 3, 10, 12]]],
  ]
  const lifts = r => r.ex.filter(e => !EXIDX[e.id] || EXIDX[e.id].bp !== 'cardio')

  it('schedules chest + back, legs + back, chest + arms on Mon/Wed/Fri with the approved lifts', () => {
    const { routines, schedule } = buildStarterPlan('paired-split')
    const byId = Object.fromEntries(routines.map(r => [r.id, r]))
    const got = schedule.map(({ day, routineId }) => {
      const r = byId[routineId]
      return [day, r.name, lifts(r).map(e => [e.id, e.sets, e.repsMin, e.reps])]
    })
    expect(got).toEqual(APPROVED_SPLIT)
  })

  it('runs every routine on double progression', () => {
    for (const r of buildStarterPlan('paired-split').routines) expect(r.prog).toBe('double')
  })

  it('opens with a cardio warm-up and ends with a cardio finisher', () => {
    for (const r of buildStarterPlan('paired-split').routines) {
      for (const e of [r.ex[0], r.ex.at(-1)]) {
        expect(EXIDX[e.id].bp).toBe('cardio')
        expect(e).toMatchObject({ sets: 1 })
        expect(e.min).toBeGreaterThan(0)
        expect(e).not.toHaveProperty('reps')
      }
    }
  })

  it('never plans a pull-up, not even as an alternative', () => {
    for (const r of buildStarterPlan('paired-split').routines) {
      for (const e of r.ex) expect([e.id, ...(e.alt || [])]).not.toContain('0652')
    }
  })

  it('offers real alternatives, never the slot itself, and the dumbbell fly can go to the pec deck', () => {
    const { routines } = buildStarterPlan('paired-split')
    for (const r of routines) for (const e of r.ex) {
      expect(EXIDX[e.id], e.id).toBeTruthy()
      expect(e.weight ?? 0).toBe(0)
      for (const a of e.alt || []) expect(EXIDX[a], a).toBeTruthy()
      expect(e.alt || []).not.toContain(e.id)
    }
    const fly = routines.find(r => r.name === 'Chest + Arms').ex.find(e => e.id === '0308')
    expect(fly.alt).toContain('0596')
  })

  it('pairs supersets as adjacent slots', () => {
    for (const r of buildStarterPlan('paired-split').routines) {
      const groups = {}
      r.ex.forEach((e, i) => { if (e.sg) (groups[e.sg] ||= []).push(i) })
      for (const idx of Object.values(groups)) {
        expect(idx).toHaveLength(2)
        expect(idx[1] - idx[0]).toBe(1)
      }
    }
  })

  it('takes translated routine names by key and keeps English for the rest', () => {
    const { routines } = buildStarterPlan('paired-split', { 'legs-back': 'Pierna + Espalda' })
    expect(routines.map(r => r.name)).toEqual(['Legs + Back', 'Chest + Back', 'Chest + Arms'].map(n => n === 'Legs + Back' ? 'Pierna + Espalda' : n))
  })
})
