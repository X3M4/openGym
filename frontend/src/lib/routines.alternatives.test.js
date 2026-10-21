// Alternatives per routine slot: the exercises you can swap to mid-workout when the machine is
// taken or you fancy the other one today, without searching the whole library.
import { describe, it, expect } from 'vitest'
import { cleanAlternatives, setSlotAlternatives, slotAlternatives, replaceSlotExercise, MAX_ALTERNATIVES } from './routines.js'

const DB_FLY = '0308'      // dumbbell fly
const PEC_DECK = '0596'    // lever seated fly
const CABLE_FLY = '0188'   // cable middle fly
const BENCH = '0025'       // barbell bench press
const BIKE = '2138'        // stationary bike, cardio

describe('cleanAlternatives', () => {
  it('keeps ids once, in order, never the slot itself', () => {
    expect(cleanAlternatives([PEC_DECK, DB_FLY, PEC_DECK, CABLE_FLY], DB_FLY)).toEqual([PEC_DECK, CABLE_FLY])
  })
  it('drops what is not a usable id', () => {
    expect(cleanAlternatives([null, '', 7, PEC_DECK], DB_FLY)).toEqual([PEC_DECK])
    expect(cleanAlternatives('0596', DB_FLY)).toEqual([])
    expect(cleanAlternatives(undefined, DB_FLY)).toEqual([])
  })
  it('drops ids the caller does not know', () => {
    expect(cleanAlternatives([PEC_DECK, 'gone'], DB_FLY, id => id !== 'gone')).toEqual([PEC_DECK])
  })
  it('stops at the cap', () => {
    const many = Array.from({ length: 10 }, (_, i) => 'x' + i)
    expect(cleanAlternatives(many, DB_FLY)).toHaveLength(MAX_ALTERNATIVES)
  })
})

describe('setSlotAlternatives', () => {
  it('writes the field only when there is something in it', () => {
    expect(setSlotAlternatives({ id: DB_FLY }, [PEC_DECK])).toEqual({ id: DB_FLY, alt: [PEC_DECK] })
    expect(setSlotAlternatives({ id: DB_FLY, alt: [PEC_DECK] }, [])).toEqual({ id: DB_FLY })
  })
})

describe('slotAlternatives', () => {
  const routine = { id: 'r1', ex: [{ id: BENCH, sets: 4, reps: 8 }, { id: DB_FLY, sets: 3, reps: 12, alt: [PEC_DECK, CABLE_FLY] }] }

  it('offers the alternatives of the planned exercise', () => {
    expect(slotAlternatives(routine, DB_FLY)).toEqual({ index: 1, ids: [PEC_DECK, CABLE_FLY] })
  })
  it('after a swap, offers the planned exercise back and the other alternatives', () => {
    expect(slotAlternatives(routine, PEC_DECK)).toEqual({ index: 1, ids: [DB_FLY, CABLE_FLY] })
  })
  it('is null for a slot without alternatives or an exercise the routine does not plan', () => {
    expect(slotAlternatives(routine, BENCH)).toBeNull()
    expect(slotAlternatives(routine, '9999')).toBeNull()
    expect(slotAlternatives(null, DB_FLY)).toBeNull()
  })
})

describe('replacing a slot keeps its alternatives', () => {
  it('carries them over, minus the exercise that now fills the slot', () => {
    const slot = { id: DB_FLY, sets: 3, reps: 12, weight: 14, alt: [PEC_DECK, CABLE_FLY] }
    const next = replaceSlotExercise(slot, PEC_DECK, null, 'r1')
    expect(next.id).toBe(PEC_DECK)
    expect(next.alt).toEqual([CABLE_FLY])
  })
  it('drops the field when the only alternative becomes the exercise', () => {
    const next = replaceSlotExercise({ id: DB_FLY, sets: 3, reps: 12, weight: 14, alt: [PEC_DECK] }, PEC_DECK, null, 'r1')
    expect(next).not.toHaveProperty('alt')
  })
  it('keeps them across a lifting ↔ cardio replace too', () => {
    const next = replaceSlotExercise({ id: DB_FLY, sets: 3, reps: 12, weight: 14, alt: [PEC_DECK] }, BIKE, null, 'r1')
    expect(next.alt).toEqual([PEC_DECK])
  })
})
