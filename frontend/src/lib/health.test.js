import { describe, it, expect, vi } from 'vitest'

// The Capacitor plugin proxy answers every property, `then` included: handed back bare from an
// async function it was taken for a promise and failed with "then() is not implemented".
vi.stubEnv('VITE_MOBILE', '1')
const calls = []
const proxy = new Proxy({}, { get: (_, prop) => {
  if (prop === 'then') return () => { throw new Error('"HealthConnect.then()" is not implemented on android') }
  return async () => { calls.push(prop); return prop === 'status' ? { status: 'available' } : { granted: ['steps'] } }
} })
vi.mock('@capacitor/core', () => ({ Capacitor: { getPlatform: () => 'android' }, registerPlugin: () => proxy }))

describe('lib/health with the real plugin shape', () => {
  it('reads the status and the granted kinds without treating the plugin as a promise', async () => {
    const { healthStatus, healthGranted } = await import('./health.js')
    expect(await healthStatus()).toBe('available')
    expect(await healthGranted()).toEqual(['steps'])
    expect(calls).toEqual(['status', 'granted'])
  })
})
