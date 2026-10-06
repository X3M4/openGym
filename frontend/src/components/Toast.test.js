// A toast that wraps (the Coach's refusal of an http:// address runs to four lines) drew as a
// circle about 170 by 230 CSS px over the list and the button under it: its corners were a pill's
// 99px on a box that tall, and the box only ever got half the screen's width to wrap in (Android
// QA, v1.3.9). One line still has to read as a pill.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8')
const rule = css.match(/\n#toast\{([^}]*)\}/)[1]
const px = v => {
  const token = v.match(/^var\((--[\w-]+)\)$/)
  const value = token ? css.match(new RegExp(`${token[1]}:\\s*([^;]+);`))[1].trim() : v
  return parseFloat(value)
}

describe('the toast', () => {
  // SuperOpenGym draws every box with the system's small corner: a wrapped toast stays a box.
  it('keeps the system\'s small corner, so four lines never read as a circle', () => {
    const radius = px(rule.match(/border-radius:([^;]+);/)[1].trim())
    expect(radius).toBeLessThanOrEqual(8)
  })

  // left:50% leaves a box without a width half the screen to wrap in: the same message stood as
  // a column about 206 CSS px wide and as tall.
  it('wraps a long message across the screen, not in half of it', () => {
    expect(rule).toMatch(/left:50%/)
    expect(rule).toMatch(/width:max-content;max-width:88vw/)
  })
})
