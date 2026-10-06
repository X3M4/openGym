import { describe, it, expect } from 'vitest'
import { fieldKind, typicalMinutes } from './home-field.js'

const r = (id, n) => ({ id, ex: Array.from({ length: n }, () => ({ sets: 3 })) })
const min = m => m * 60000

describe('fieldKind', () => {
  it('shows the running session above anything planned', () => {
    expect(fieldKind({ active: { name: 'Push' } }, [r('a', 4)], null)).toBe('active')
  })
  it('shows training when a routine with exercises is due and not done', () => {
    expect(fieldKind({ active: null }, [r('a', 4)], null)).toBe('train')
  })
  it('shows the body once today is done, on a rest day, or for an empty routine', () => {
    expect(fieldKind({ active: null }, [r('a', 4)], { d: '2026-10-06' })).toBe('body')
    expect(fieldKind({ active: null }, [], null)).toBe('body')
    expect(fieldKind({ active: null }, [r('a', 0)], null)).toBe('body')
  })
})

describe('typicalMinutes', () => {
  const w = (ids, m) => ({ routineIds: ids, start: 1e12, end: 1e12 + min(m) })
  it('is the median length of the finished sessions of these routines', () => {
    expect(typicalMinutes([w(['a'], 50), w(['a'], 70), w(['a'], 60)], ['a'])).toBe(60)
    expect(typicalMinutes([w(['a'], 50), w(['a'], 60)], ['a'])).toBe(55)
  })
  it('reads the legacy single routineId too, and ignores other routines', () => {
    expect(typicalMinutes([{ routineId: 'a', start: 1e12, end: 1e12 + min(40) }, w(['b'], 90)], ['a'])).toBe(40)
  })
  it('says nothing rather than guess: no timed sessions, or implausible lengths', () => {
    expect(typicalMinutes([], ['a'])).toBe(null)
    expect(typicalMinutes([{ routineIds: ['a'] }], ['a'])).toBe(null)
    expect(typicalMinutes([w(['a'], 2), w(['a'], 400)], ['a'])).toBe(null)
  })
})
