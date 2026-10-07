import { describe, it, expect } from 'vitest'
import { mergeStates, mergeLatestById, localExtras, resetIdsOf, sinceReset } from './sync-merge.js'

const m = (id, t, extra = {}) => ({ id, d: '2026-10-0' + (id.length % 9 + 1), t, waist: 90, ...extra })

describe('mergeLatestById', () => {
  it('keeps the union, and of an id both hold the later-edited version', () => {
    const out = mergeLatestById([m('a', 1, { waist: 90 }), m('b', 5)], [m('a', 3, { waist: 88 }), m('c', 2)])
    expect(out.map(e => e.id).sort()).toEqual(['a', 'b', 'c'])
    expect(out.find(e => e.id === 'a').waist).toBe(88)
  })
  it('a later deletion wins over the other copy\'s older entry', () => {
    const out = mergeLatestById([{ id: 'a', deleted: true, t: 9 }], [m('a', 3)])
    expect(out).toEqual([{ id: 'a', deleted: true, t: 9 }])
  })
})

describe('mergeStates with body composition', () => {
  it('a measurement logged on each device survives the merge, whichever copy is newer', () => {
    const phone = { _ts: 10, unit: 'kg', measures: [m('p1', 10)], bodyfat: [{ id: 'f1', d: '2026-10-01', t: 10, pct: 18 }] }
    const web = { _ts: 20, unit: 'kg', measures: [m('w1', 20)], bodyfat: [] }
    const out = mergeStates(phone, web)
    expect(out.measures.map(e => e.id).sort()).toEqual(['p1', 'w1'])
    expect(out.bodyfat.map(e => e.id)).toEqual(['f1'])
  })
})

describe('first pairing and reset', () => {
  it('counts the device\'s own measurements and body-fat entries the server lacks', () => {
    const ex = localExtras({ unit: 'kg', measures: [m('a', 1), m('b', 1), { id: 'x', deleted: true, t: 2 }], bodyfat: [{ id: 'f', t: 1 }] },
      { unit: 'kg', measures: [m('a', 1)], bodyfat: [] })
    expect(ex.measures).toBe(1)
    expect(ex.bodyfat).toBe(1)
  })
  it('a reset wipes the measurements it saw, and keeps one logged after it on another device', () => {
    const before = { measures: [m('old', 1)], bodyfat: [{ id: 'f-old', t: 1 }] }
    const ids = resetIdsOf(before)
    const other = sinceReset({ measures: [m('old', 1), m('new', 5)], bodyfat: [{ id: 'f-old', t: 1 }], workouts: [] }, 3, ids)
    expect(other.measures.map(e => e.id)).toEqual(['new'])
    expect(other.bodyfat).toEqual([])
  })
})
