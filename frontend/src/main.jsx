import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { MOBILE } from './lib/mobile.js'
import { useStore } from './store/useStore.js'
import { startMediaSync } from './lib/media-sync.js'
import { startNativeKeyboard } from './lib/native-keyboard.js'
import '@fontsource-variable/archivo/wdth.css'
import './index.css'

// App.jsx restores per-route scroll itself; the browser's own attempt races it.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

createRoot(document.getElementById('root')).render(
  <StrictMode><App /></StrictMode>
)

// The photos and videos of custom exercises, in every build (the phone and the demo included):
// uploads of what the server lacks, the local clean-up, and the plan's files kept offline.
startMediaSync(useStore)

// Android 15 does not resize the page for the soft keyboard; the app says how much it covers and
// this keeps the focused field above it. Idle everywhere else.
startNativeKeyboard()

// Not in the mobile build: the native shell already serves everything from disk.
if (!MOBILE && 'serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {})
  // The plan's exercise media, kept by the worker for a workout opened without a network (#281).
  // It only fetches ahead while the page runs as the installed app; a tab keeps what it has shown.
  import('./lib/media-prefetch.js').then(m => m.startMediaPrefetch(useStore)).catch(() => {})
}

// Health Connect (Android app): what is new since the last read, once the profile is loaded and
// whenever the app comes back to the front — at most every 15 minutes. Off until switched on.
if (MOBILE) {
  const HEALTH_EVERY_MS = 15 * 60000
  let lastTry = 0
  const healthTick = () => {
    const st = useStore.getState()
    if (!st.ready || !st.S?.health?.on || Date.now() - lastTry < HEALTH_EVERY_MS) return
    lastTry = Date.now()
    import('./lib/health.js').then(m => m.syncHealth(useStore)).catch(() => {})
  }
  useStore.subscribe(s => { if (s.ready) healthTick() })
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') healthTick() })
}
