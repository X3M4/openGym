import { describe, it, expect, beforeEach, vi } from 'vitest'
import { takeSlot, resetSlots, OffLimitError, searchFoods, productByCode, LIMITS } from './off.js'

beforeEach(() => { resetSlots(); vi.restoreAllMocks() })

describe('per-minute limits (OFF: 15 product reads, 10 searches)', () => {
  it('lets the limit through, refuses the next with the seconds left, and frees a slot after a minute', () => {
    const t0 = 1_000_000
    for (let i = 0; i < LIMITS.search; i++) takeSlot('search', t0 + i)
    let err = null
    try { takeSlot('search', t0 + 20_000) } catch (e) { err = e }
    expect(err).toBeInstanceOf(OffLimitError)
    expect(err.waitSec).toBe(40)
    expect(() => takeSlot('search', t0 + 60_000)).not.toThrow()
  })
  it('product reads and searches are counted apart', () => {
    for (let i = 0; i < LIMITS.search; i++) takeSlot('search', 5)
    expect(() => takeSlot('product', 5)).not.toThrow()
  })
})

describe('requests', () => {
  it('search asks the legacy full-text endpoint and keeps only foods with energy', async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ products: [
      { code: '1', product_name: 'Yogur griego', brands: 'Mercadona', nutriments: { 'energy-kcal_100g': 97, proteins_100g: 9 } },
      { code: '2', product_name: 'Sin datos', nutriments: {} },
    ] }) }))
    const foods = await searchFoods('yogur griego')
    expect(globalThis.fetch.mock.calls[0][0]).toContain('/cgi/search.pl?search_terms=yogur%20griego')
    expect(foods.map(f => f.name)).toEqual(['Yogur griego'])
  })
  it('a too-short query sends nothing', async () => {
    globalThis.fetch = vi.fn()
    expect(await searchFoods('y')).toEqual([])
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })
  it('a barcode OFF does not have is null', async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: false, status: 404, json: async () => ({ status: 0 }) }))
    expect(await productByCode('8410376010010')).toBe(null)
  })
})
