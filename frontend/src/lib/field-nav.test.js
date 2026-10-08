// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { fieldNav } from './field-nav.js'

const band = () => {
  const b = document.createElement('button'); b.className = 'dband'
  const sq = document.createElement('span'); sq.className = 'dband-sq'; b.append(sq)
  return { b, sq }
}

describe('fieldNav (the Home band → screen transition)', () => {
  afterEach(() => { delete document.startViewTransition })
  it('names the band square and asks the router for a view transition', () => {
    document.startViewTransition = () => {}
    const { b, sq } = band(), nav = vi.fn()
    fieldNav(nav, { currentTarget: b }, '/nutrition')
    expect(sq.style.viewTransitionName).toBe('field')
    expect(nav).toHaveBeenCalledWith('/nutrition', { viewTransition: true })
  })
  it('is a plain navigation without View Transitions', () => {
    const { b, sq } = band(), nav = vi.fn()
    fieldNav(nav, { currentTarget: b }, '/body')
    expect(sq.style.viewTransitionName || '').toBe('')
    expect(nav).toHaveBeenCalledWith('/body')
  })
})
