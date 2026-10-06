// @vitest-environment happy-dom

/* SuperOpenGym: a phone used only locally (plans, week, workouts, weigh-ins made on it) that is
   connected to the owner's server afterwards. What the phone holds has to reach the server whole
   and keep syncing both ways from then on.

   Real modules: store/useStore.js, lib/api.js, lib/remote.js, lib/mobile.js. Mocked: the
   Capacitor plugins (an in-memory Directory.Data) and fetch, which plays the server at BASE. */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => {
  vi.stubEnv('VITE_MOBILE', '1')
  return { files: new Map(), server: null, calls: [] }
})
vi.mock('@capacitor/filesystem', () => ({
  Directory: { Data: 'DATA', Documents: 'DOCUMENTS', Cache: 'CACHE' },
  Encoding: { UTF8: 'utf8' },
  Filesystem: {
    readFile: async ({ path, directory }) => {
      const k = directory + '/' + path
      if (!h.files.has(k)) throw new Error('File does not exist')
      return { data: h.files.get(k) }
    },
    writeFile: async ({ path, directory, data }) => { h.files.set(directory + '/' + path, data); return { uri: 'file://' + path } },
  },
}))
vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: { cancel: async () => {}, checkPermissions: async () => ({ display: 'granted' }), requestPermissions: async () => ({ display: 'granted' }), schedule: async () => {} },
}))
vi.mock('@capacitor/app', () => ({ App: { addListener: () => ({ remove() {} }) } }))
vi.mock('@capacitor/core', () => ({ Capacitor: { getPlatform: () => 'android', isNativePlatform: () => true }, registerPlugin: () => ({}) }))
vi.mock('./useUI.js', () => ({ useUI: { getState: () => ({ toast: () => {} }) } }))

const BASE = 'https://gym.example.com'
const USER = { id: 'u1', name: 'chema', admin: false }
const clone = v => JSON.parse(JSON.stringify(v))
const ids = xs => (xs || []).map(x => x.id).sort()
const res = (status, body) => ({
  ok: status >= 200 && status < 300, status,
  headers: { get: k => (k.toLowerCase() === 'content-type' ? 'application/json' : null) },
  json: async () => JSON.parse(body), text: async () => body,
})
const json = (status, body) => res(status, JSON.stringify(body))
const sleep = ms => new Promise(r => setTimeout(r, ms))

// The server as api/server.js answers it; `doc` null is an account that has never synced.
function serverWith(doc) {
  const srv = { doc: doc ? clone(doc) : null, puts: [] }
  h.server = (path, method, init) => {
    if (path === '/api/me') return json(200, { user: USER })
    if (path === '/api/config') return json(200, { invite_only: false, allow_guest: true })
    if (path === '/api/pair/redeem') return json(200, { token: 'TOKEN', user: USER })
    if (path === '/api/data/rev') return json(200, { rev: srv.doc?._rev || 0 })
    if (path === '/api/data' && method === 'GET') return json(200, { state: clone(srv.doc), rev: srv.doc?._rev || 0 })
    if (path === '/api/data' && method === 'PUT') {
      const body = JSON.parse(init.body)
      srv.puts.push(body)
      const rev = srv.doc?._rev || 0
      if (body.baseRev != null && body.baseRev !== rev) return json(409, { error: 'conflict', rev, state: clone(srv.doc) })
      srv.doc = { ...body.state, _rev: rev + 1 }
      delete srv.doc.active
      return json(200, { ok: true, rev: rev + 1 })
    }
    return json(404, { error: 'not found' })
  }
  globalThis.fetch = window.fetch = vi.fn(async (url, init = {}) => {
    h.calls.push({ url: String(url), method: (init.method || 'GET').toUpperCase() })
    if (String(url).startsWith(BASE)) return h.server(String(url).slice(BASE.length), (init.method || 'GET').toUpperCase(), init)
    return res(404, '{}')
  })
  return srv
}

// What the phone made while it was local only.
const PHONE = {
  _ts: 5000,
  routines: [{ id: 'fullA', name: 'Full Body A', emoji: 'dumbbell', ex: [{ id: 'squat', sets: 3, reps: 8 }] },
             { id: 'fullB', name: 'Full Body B', emoji: 'dumbbell', ex: [{ id: 'deadlift', sets: 3, reps: 5 }] }],
  week: { 1: ['fullA'], 4: ['fullB'] },
  workouts: [{ id: 'w1', d: '2026-10-01', start: 1, end: 3600001, name: 'Full Body A', entries: [] }],
  bodyweight: [{ d: '2026-10-01', w: 80.2, t: 1 }],
  customEx: [{ id: 'c-hip', n: 'Hip thrust banco' }],
  targetW: 76,
}
let DEF
beforeAll(async () => { DEF = (await import('./useStore.js')).DEF })
function localPhone() {
  h.files.clear(); localStorage.clear()
  const S = { ...clone(DEF), ...clone(PHONE) }
  h.files.set('DATA/opengym-remote.json', JSON.stringify({ mode: 'local' }))
  h.files.set('DATA/opengym-state.json', JSON.stringify(S))
  localStorage.setItem('gym_state_v1', JSON.stringify(S))
  localStorage.setItem('gym_guest', '1')
}
let stores = []
async function freshStore() {
  vi.resetModules()
  const { useStore } = await import('./useStore.js')
  stores.push(useStore)
  return useStore
}
beforeEach(() => { h.calls = [] })
afterEach(async () => {
  window.dispatchEvent(new Event('pagehide'))
  await sleep(20)
  for (const s of stores) s.setState({ user: null, ready: false })
  stores = []
  localStorage.clear()
})

describe('a phone used only locally, connected to the server afterwards', () => {
  it('to a new account: everything the phone made reaches the server', async () => {
    localPhone()
    const useStore = await freshStore()
    await useStore.getState().boot()
    const srv = serverWith(null)

    await useStore.getState().connectToServer('gym.example.com', 'ABCD2345', async () => true)
    await sleep(50)

    expect(srv.doc).not.toBeNull()
    expect(ids(srv.doc.routines)).toEqual(['fullA', 'fullB'])
    expect(srv.doc.week).toEqual(PHONE.week)
    expect(ids(srv.doc.workouts)).toEqual(['w1'])
    expect(srv.doc.bodyweight).toHaveLength(1)
    expect(ids(srv.doc.customEx)).toEqual(['c-hip'])
    expect(srv.doc.targetW).toBe(76)
    expect(useStore.getState().sync).toMatchObject({ status: 'ok', server: BASE })
  })

  it('to an account that already has data: the phone\'s plans, workouts and weigh-ins are kept beside the server\'s', async () => {
    localPhone()
    const useStore = await freshStore()
    await useStore.getState().boot()
    const srv = serverWith({
      _ts: 1000, _rev: 3, unit: 'kg',
      routines: [{ id: 'web-push', name: 'Push (web)', emoji: 'dumbbell', ex: [{ id: 'bench', sets: 3, reps: 10 }] }],
      week: { 2: ['web-push'] },
      workouts: [{ id: 'w-web', d: '2026-09-20', start: 1, entries: [] }],
      bodyweight: [], customEx: [],
    })

    await useStore.getState().connectToServer('gym.example.com', 'ABCD2345', async () => true)
    await sleep(50)

    const S = useStore.getState().S
    expect(ids(S.workouts)).toEqual(['w-web', 'w1'])
    expect(S.bodyweight).toHaveLength(1)
    expect(ids(S.customEx)).toEqual(['c-hip'])
    expect(ids(S.routines)).toEqual(['fullA', 'fullB', 'web-push'])
    expect(ids(srv.doc.routines)).toEqual(['fullA', 'fullB', 'web-push'])
    expect(ids(srv.doc.workouts)).toEqual(['w-web', 'w1'])
  })
})
