import { describe, it, expect } from 'vitest'
import { rescaleItem } from './nutrition.js'

describe('rescaleItem (saved-meal amounts)', () => {
  it('scales energy and macros with the new weight', () => {
    expect(rescaleItem({ name: 'Arroz', g: 65, kcal: 109, p: 2.6, c: 22.4, f: 0.9 }, 130))
      .toEqual({ name: 'Arroz', g: 130, kcal: 218, p: 5.2, c: 44.8, f: 1.8 })
  })
  it('leaves an item without a weight, or a weight of zero, as it is', () => {
    const it0 = { name: 'x', kcal: 50 }
    expect(rescaleItem(it0, 100)).toBe(it0)
    const it1 = { name: 'y', g: 40, kcal: 80 }
    expect(rescaleItem(it1, 0)).toBe(it1)
  })
})
