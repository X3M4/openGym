// @vitest-environment happy-dom
// Editing a routine slot's alternatives from the routine editor.
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeEach, describe, expect, it } from 'vitest'
import { slotAlternativesSheet } from './sheets.jsx'
import { EXIDX } from './lib/exercises.js'
import { DEF, useStore } from './store/useStore.js'
import { useUI } from './store/useUI.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
const DB_FLY = '0308', PEC_DECK = '0596', CABLE_FLY = '0188'
const slot = () => useStore.getState().S.routines[0].ex[0]

beforeEach(() => {
  localStorage.clear()
  useUI.setState({ sheets: [] })
  const S = JSON.parse(JSON.stringify(DEF))
  S.routines = [{ id: 'r', name: 'Chest', ex: [{ id: DB_FLY, sets: 3, reps: 12, weight: 0, alt: [PEC_DECK] }] }]
  useStore.setState({ S, user: null })
})

function mount() {
  slotAlternativesSheet('r', 0, DB_FLY)
  const sheet = useUI.getState().sheets.at(-1)
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  act(() => root.render(sheet.render(sheet.close)))
  return { host, root, sheet }
}

describe('slot alternatives sheet', () => {
  it('adds an alternative through the picker and keeps the slot prescription', () => {
    const { host } = mount()
    const add = [...host.querySelectorAll('button')].find(b => b.textContent.includes('Add alternative'))
    act(() => add.click())
    const picker = useUI.getState().sheets.at(-1)
    act(() => picker.render(picker.close).props.onPick(EXIDX[CABLE_FLY]))
    expect(slot()).toEqual({ id: DB_FLY, sets: 3, reps: 12, weight: 0, alt: [PEC_DECK, CABLE_FLY] })
  })

  it('removes one, and drops the field when the last goes', () => {
    const { host } = mount()
    act(() => host.querySelector('button[aria-label^="Remove"]').click())
    expect(slot()).not.toHaveProperty('alt')
  })

  it('leaves a slot alone that became another exercise meanwhile', () => {
    mount()
    useStore.getState().update(s => { s.routines[0].ex[0].id = '0025' })
    slotAlternativesSheet('r', 0, DB_FLY)
    expect(slot().alt).toEqual([PEC_DECK])
  })
})
