// @vitest-environment happy-dom
import React, { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { useStore } from '../store/useStore.js'
import Home from './Home.jsx'

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }))
vi.mock('../sheets.jsx', () => ({
  starterPlanSheet: vi.fn(), bwSheet: vi.fn(), goalSheet: vi.fn(), dayOverrideSheet: vi.fn(),
  calendarSheet: vi.fn(), startFlow: vi.fn(), bwDeltaColor: () => '', weighInsSheet: vi.fn(),
}))

let host, root
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})
afterEach(() => { act(() => root.unmount()); host.remove() })

// A routine due today puts training in Home's top field, so the weight lives in its own card;
// on a rest day the green body field carries it instead.
const pushDay = { id: 'r1', name: 'Push', emoji: 'dumbbell', ex: [{ id: 'x', sets: 3, reps: 8 }] }
const mountWith = (showWeightCard, { restDay = false } = {}) => {
  useStore.setState(s => ({
    S: { ...s.S, routines: restDay ? [] : [pushDay], workouts: [], bodyweight: [], dayPlan: {},
      week: restDay ? {} : { [new Date().getDay()]: ['r1'] }, active: null, showWeightCard },
    user: null,
  }))
  act(() => root.render(<Home />))
}
const weightHeading = () => [...host.querySelectorAll('h2')].find(el => el.textContent === 'Body weight')
const logWeightInField = () => [...host.querySelectorAll('.dfield-body button')].some(b => b.textContent.includes('Log weight'))

describe('Home body-weight card preference', () => {
  it('shows the card for legacy profiles without the preference', () => {
    mountWith(undefined)
    expect(weightHeading()).toBeTruthy()
  })

  it('shows the card when enabled', () => {
    mountWith(true)
    expect(weightHeading()).toBeTruthy()
  })

  it('hides only the Home card when disabled', () => {
    mountWith(false)
    expect(weightHeading()).toBeFalsy()
  })

  it('on a rest day the body field carries the weight instead of a card', () => {
    mountWith(undefined, { restDay: true })
    const headings = [...host.querySelectorAll('h2')].filter(el => el.textContent === 'Body weight')
    expect(headings).toHaveLength(1)
    expect(headings[0].closest('.dfield-body:not(.dfield-band)')).toBeTruthy()
    expect(logWeightInField()).toBe(true)
  })

  it('on a rest day with the preference off, the field leaves the weight out too', () => {
    mountWith(false, { restDay: true })
    expect(logWeightInField()).toBe(false)
  })
})