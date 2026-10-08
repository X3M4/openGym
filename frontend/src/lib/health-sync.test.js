import { describe, it, expect } from 'vitest'
import { applyHealthRead, stepsOn, exerciseOn, cardioMinutesByDay, readWindow, workoutForHealth, dayOf } from './health-sync.js'

const at = (d, h = 9) => new Date(`${d}T${String(h).padStart(2, '0')}:00:00`).getTime()

describe('applyHealthRead', () => {
  it('adds steps per day and updates a day whose count grew, without duplicates', () => {
    const s = { unit: 'kg' }
    expect(applyHealthRead(s, { steps: [{ d: '2026-10-06', count: 8000 }] }, 1).steps).toBe(1)
    expect(applyHealthRead(s, { steps: [{ d: '2026-10-06', count: 8000 }] }, 2).steps).toBe(0)
    expect(applyHealthRead(s, { steps: [{ d: '2026-10-06', count: 9500 }] }, 3).steps).toBe(1)
    expect(s.activity).toHaveLength(1)
    expect(stepsOn(s, '2026-10-06')).toBe(9500)
  })
  it('adds each exercise session once, on its local day', () => {
    const s = {}
    const run = { id: 'abc', start: at('2026-10-05', 7), end: at('2026-10-05', 8), type: 56, title: 'Run', source: 'com.sec.android.app.shealth' }
    applyHealthRead(s, { exercise: [run] })
    applyHealthRead(s, { exercise: [run] })
    expect(exerciseOn(s, '2026-10-05')).toHaveLength(1)
    expect(exerciseOn(s, '2026-10-05')[0]).toMatchObject({ id: 'hc:abc', type: 56, src: 'hc' })
  })
  it('weight: the day\'s latest reading, only on days without a weigh-in, in the profile unit', () => {
    const s = { unit: 'kg', bodyweight: [{ d: '2026-10-05', w: 80.1, t: 1 }] }
    const r = applyHealthRead(s, { weight: [
      { id: 'w1', t: at('2026-10-05'), kg: 79.0 },                    // a manual weigh-in already that day
      { id: 'w2', t: at('2026-10-06', 7), kg: 79.6 }, { id: 'w3', t: at('2026-10-06', 21), kg: 80.3 },
    ] })
    expect(r.weight).toBe(1)
    expect(s.bodyweight.find(b => b.d === '2026-10-05').w).toBe(80.1)
    expect(s.bodyweight.find(b => b.d === '2026-10-06')).toMatchObject({ w: 80.3, src: 'hc' })
    const lb = { unit: 'lb', bodyweight: [] }
    applyHealthRead(lb, { weight: [{ id: 'x', t: at('2026-10-07'), kg: 80 }] })
    expect(lb.bodyweight[0].w).toBe(176.4)
  })
  it('body fat: each reading once, as a scale reading', () => {
    const s = { bodyfat: [] }
    applyHealthRead(s, { bodyfat: [{ id: 'f', t: at('2026-10-06'), pct: 19.84 }] })
    applyHealthRead(s, { bodyfat: [{ id: 'f', t: at('2026-10-06'), pct: 19.84 }] })
    expect(s.bodyfat).toEqual([{ id: 'hc:f', d: '2026-10-06', t: at('2026-10-06'), pct: 19.8, method: 'scale', src: 'hc' }])
  })
})

describe('cardio minutes and windows', () => {
  it('counts cardio minutes per day, strength sessions left out', () => {
    const s = { activity: [
      { id: 'a', kind: 'exercise', d: '2026-10-05', start: 0, end: 30 * 60000, type: 56 },
      { id: 'b', kind: 'exercise', d: '2026-10-05', start: 0, end: 60 * 60000, type: 70 },
      { id: 'c', kind: 'exercise', d: '2026-10-05', start: 0, end: 15 * 60000, type: 79 },
    ] }
    expect(cardioMinutesByDay(s, '2026-10-01', '2026-10-07').get('2026-10-05')).toBe(45)
  })
  it('reads 30 days the first time, then from the day before the last read', () => {
    expect(readWindow(null, '2026-10-07')).toEqual({ from: '2026-09-08', to: '2026-10-07' })
    expect(readWindow('2026-10-03', '2026-10-07')).toEqual({ from: '2026-10-02', to: '2026-10-07' })
    expect(readWindow('2026-10-07', '2026-10-07')).toEqual({ from: '2026-10-06', to: '2026-10-07' })
  })
})

describe('workoutForHealth', () => {
  it('needs a real start and end, and versions by the last edit', () => {
    expect(workoutForHealth({ id: 'w', start: 100, end: 50 })).toBe(null)
    expect(workoutForHealth({ id: 'w', start: 1000, end: 5000, name: 'Pull Day', note: 'ok', _ts: 7000 }))
      .toEqual({ id: 'w', start: 1000, end: 5000, title: 'Pull Day', notes: 'ok', version: 7000 })
  })
  it('dayOf is the local day', () => { expect(dayOf(at('2026-10-05', 23))).toBe('2026-10-05') })
})
