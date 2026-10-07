// @vitest-environment happy-dom
import React, { act, useState } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createRoot } from 'react-dom/client'
import { CommitNumberField } from './ui.jsx'

let host, root
beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host) })
afterEach(() => { act(() => root.unmount()); host.remove() })

const type = (input, text) => {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
  act(() => { set.call(input, text); input.dispatchEvent(new Event('input', { bubbles: true })) })
}

function Year({ log }) {
  const [year, setYear] = useState(null)
  return <CommitNumberField value={year} decimal={false} onCommit={v => { log.push(v); setYear(v > 1900 ? v : null) }} />
}

describe('CommitNumberField', () => {
  it('lets a year be typed digit by digit and checks it only when the field is left', () => {
    const log = []
    act(() => root.render(<Year log={log} />))
    const input = host.querySelector('input')
    for (const s of ['1', '19', '198', '1986']) type(input, s)
    expect(input.value).toBe('1986')
    expect(log).toEqual([])                       // nothing judged while typing
    act(() => { input.dispatchEvent(new FocusEvent('focusout', { bubbles: true })); input.blur() })
    expect(log).toEqual([1986])
    expect(input.value).toBe('1986')
  })
  it('shows what was kept when the commit refuses the number', () => {
    const log = []
    act(() => root.render(<Year log={log} />))
    const input = host.querySelector('input')
    type(input, '19')
    act(() => { input.dispatchEvent(new FocusEvent('focusout', { bubbles: true })); input.blur() })
    expect(log).toEqual([19])
    expect(input.value).toBe('')
  })
})
