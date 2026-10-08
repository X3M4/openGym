import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { t } from '../lib/i18n.js'
import { fmtAgo } from '../lib/format.js'
import { healthStatus, healthGranted, requestHealthAccess, syncHealth } from '../lib/health.js'
import { Section, Row, Switch, Button } from './ui.jsx'

const KIND_LABEL = { steps: 'Steps', exercise: 'Exercise sessions', weight: 'Weight', bodyfat: 'Body fat', writeExercise: 'Write your workouts', history: 'Data older than 30 days' }
const toast = m => useUI.getState().toast(m)

// Settings → Health Connect (Android app only): the switch, what is granted, the last sync.
export default function HealthSection() {
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const [status, setStatus] = useState(null)
  const [granted, setGranted] = useState([])
  const [busy, setBusy] = useState(false)
  useEffect(() => { healthStatus().then(setStatus); healthGranted().then(setGranted) }, [])
  if (status === null || status === 'unsupported') return null

  const H = S.health || {}
  const report = c => {
    if (!c) return
    const n = c.steps + c.exercise + c.weight + c.bodyfat
    toast(n ? t('Health Connect: {0} days of steps, {1} sessions, {2} weigh-ins, {3} body-fat readings', c.steps, c.exercise, c.weight, c.bodyfat) : t('Health Connect: nothing new'))
  }
  const turnOn = async () => {
    setBusy(true)
    try {
      const g = await requestHealthAccess()
      setGranted(g)
      if (!g.length) { toast(t('No permission was granted in Health Connect.')); return }
      update(s => { s.health = { ...(s.health || {}), on: true } })
      report(await syncHealth(useStore, { firstDays: g.includes('history') ? 90 : 30 }))
    } catch { toast(t('Health Connect did not answer.')) } finally { setBusy(false) }
  }
  const syncNow = async () => {
    setBusy(true)
    try { report(await syncHealth(useStore)) } catch { toast(t('Health Connect did not answer.')) } finally { setBusy(false) }
  }

  const footer = status === 'available'
    ? t('Reads steps, exercise from other apps and your watch, weight and body fat, and writes the workouts you finish here. Google Fit, Samsung Health or Mi Fitness share their data through Health Connect when you turn that on in their own settings.')
    : status === 'update-required' ? t('Health Connect needs an update from the Play Store.') : t('Health Connect is not installed on this phone. On Android 9–13 it is installed from the Play Store.')
  return <Section title={t('Health Connect')} footer={footer}>
    <Row icon="heart" iconTint="var(--green)" title={t('Connect with Health Connect')}>
      <Switch checked={!!H.on} disabled={busy || status !== 'available'} onChange={v => v ? turnOn() : update(s => { s.health = { ...(s.health || {}), on: false } })} />
    </Row>
    {H.on && <>
      <Row title={t('Write your workouts')} subtitle={t('Each finished workout as a strength session')}>
        <Switch checked={H.write !== false} onChange={v => update(s => { s.health = { ...(s.health || {}), write: v } })} />
      </Row>
      <Row title={t('Permissions')} subtitle={granted.length ? granted.map(k => t(KIND_LABEL[k] || k)).join(' · ') : t('None granted')}>
        <Button size="sm" disabled={busy} onClick={turnOn}>{t('Review')}</Button>
      </Row>
      <Row title={t('Last sync')} subtitle={H.lastSync ? fmtAgo(H.lastSync) : t('Never')}>
        <Button size="sm" disabled={busy} onClick={syncNow}>{busy ? t('Syncing…') : t('Sync now')}</Button>
      </Row>
    </>}
  </Section>
}
