// Health Connect from the app (SuperOpenGym Phase 7): the native plugin (android
// HealthConnectPlugin.kt) and the syncs around it. Android app only; elsewhere every call answers
// "unavailable" and nothing runs.
import { MOBILE } from './mobile.js'
import { applyHealthRead, readWindow, workoutForHealth, dayOf } from './health-sync.js'

// The plugin is a Capacitor proxy that answers every property, `then` included — returned bare
// from an async function it is taken for a promise and its "then()" call fails ("not implemented
// on android"). It is therefore always handed around inside a box: hc() resolves to { p }.
let box = null
async function hc() {
  if (!MOBILE) return null
  if (box) return box
  try {
    const { Capacitor, registerPlugin } = await import('@capacitor/core')
    if (Capacitor.getPlatform() !== 'android') return null
    box = { p: registerPlugin('HealthConnect') }
    return box
  } catch { return null }
}

/** 'available' | 'not-installed' | 'update-required' | 'unsupported' (not the Android app). */
export async function healthStatus() {
  const b = await hc()
  if (!b) return 'unsupported'
  try { return (await b.p.status()).status } catch { return 'unsupported' }
}

/** Health Connect's own permission dialog; resolves with the kinds granted. */
export async function requestHealthAccess() {
  const b = await hc()
  if (!b) return []
  return (await b.p.requestAccess()).granted || []
}

export async function healthGranted() {
  const b = await hc()
  if (!b) return []
  try { return (await b.p.granted()).granted || [] } catch { return [] }
}

let syncing = null
/**
 * Read what is new since the last sync into the profile. `store` is the zustand store. Resolves
 * with the counts added ({ steps, exercise, weight, bodyfat }) or null when nothing could run.
 */
export function syncHealth(store, { firstDays = 30 } = {}) {
  if (syncing) return syncing
  syncing = (async () => {
    const S = store.getState().S
    if (!S.health?.on) return null
    const b = await hc()
    if (!b) return null
    const today = dayOf(Date.now())
    const { from, to } = readWindow(S.health.lastRead, today, firstDays)
    const data = await b.p.read({ from, to })
    let counts = null
    store.getState().update(s => {
      counts = applyHealthRead(s, data)
      s.health = { ...(s.health || {}), lastRead: today, lastSync: Date.now() }
    })
    return counts
  })().finally(() => { syncing = null })
  return syncing
}

/** Write a finished workout as a strength session, when the profile asks for it. Never throws. */
export async function writeWorkoutToHealth(S, w) {
  if (!S?.health?.on || S.health.write === false) return false
  const b = await hc()
  const rec = workoutForHealth(w)
  if (!b || !rec) return false
  try { await b.p.writeWorkout(rec); return true } catch { return false }
}
