import { useState } from 'react'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { t } from '../lib/i18n.js'
import { fmtNum, fmtDate, todayISO, weekStartOf, isoOf, exerciseNameText } from '../lib/format.js'
import { EXIDX } from '../lib/exercises.js'
import { deficitAlerts, STRENGTH_DROP } from '../lib/deficit-alerts.js'
import { weeklyRate, rateBand, isCutting, trendSeries } from '../lib/body-comp.js'
import { targets, dayTotals } from '../lib/nutrition.js'
import { MOBILE } from '../lib/mobile.js'
import Icon from './Icon.jsx'
import { Button, Section, Row, Switch } from './ui.jsx'

const exName = id => (EXIDX[id] ? exerciseNameText(EXIDX[id]) : t('Unknown exercise'))
const cap = s => String(s).charAt(0).toUpperCase() + String(s).slice(1)
const pct1 = v => Number(v).toLocaleString(undefined, { maximumFractionDigits: 1 })

/** What the alerts sit in: the loss rate and the protein of the last 7 logged days, when known. */
function context(S, today) {
  const series = trendSeries(S.bodyweight)
  const rate = weeklyRate(S.bodyweight, today)
  const cutting = isCutting(S.targetW, series.at(-1)?.trend)
  const T = targets(S, today)
  const days = []
  for (let i = 1; i <= 7; i++) { const d = new Date(today + 'T12:00:00'); d.setDate(d.getDate() - i); const x = dayTotals(S.foodLog, isoOf(d)); if (x.items.length) days.push(x.p) }
  const protein = days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : null
  return { rate: rate.rate, band: cutting ? rateBand(rate.rate) : null, protein, proteinTarget: T.protein, proteinDays: days.length }
}

function AlertsSheet({ close }) {
  const S = useStore(s => s.S)
  const today = todayISO()
  const { all, unseen } = deficitAlerts(S, today, weekStartOf(S))
  const C = context(S, today)
  const ack = () => { useStore.getState().update(s => { s.alertsSeen = [...new Set([...(s.alertsSeen || []), ...all.map(a => a.key)])] }); close() }
  return <>
    <h3>{t('Training in a deficit')}</h3>
    {!all.length && <p className="small muted">{t('No alerts: your strength and training volume hold.')}</p>}
    <div className="body-list">
      {all.map(a => <div key={a.key} className="alert-row">
        <span className={'dband-sq ' + (a.kind === 'strength' ? 'dband-strength' : 'dband-train')} style={{ width: 40, minHeight: 40, fontSize: 20 }}><Icon name={a.kind === 'strength' ? 'chartLine' : 'dumbbell'} /></span>
        <div style={{ minWidth: 0 }}>
          {a.kind === 'strength'
            ? <><b>{t('{0}: estimated 1RM down {1}%', exName(a.id), pct1(a.drop))}</b>
              <div className="small muted">{t('Best of the last 3 weeks {0} {1} ({2}), against {3} {1} in the 6 weeks before ({4}).', fmtNum(a.recent.est), S.unit, fmtDate(a.recent.d, true), fmtNum(a.prior.est), fmtDate(a.prior.d, true))}</div></>
            : <><b>{t('{0}: {1} work sets last week, usually {2}', cap(t(a.bp)), a.sets, fmtNum(a.usual))}</b>
              <div className="small muted">{t('Under a third of your usual weekly sets for this muscle (mean of the 8 weeks before).')}</div></>}
          {unseen.some(u => u.key === a.key) && <span className="tag nocap" style={{ marginTop: 4 }}>{t('new')}</span>}
        </div>
      </div>)}
    </div>
    {all.length > 0 && <div className="callout-s" style={{ marginTop: 12 }}>
      {C.band && C.rate != null && <div>{t('You are losing {0}% of your weight a week', pct1(-C.rate))}{C.band === 'fast' ? ' — ' + t('faster than the 1% that best keeps muscle.') : '.'}</div>}
      {C.protein != null && C.proteinTarget != null && <div>{t('Protein, last {0} logged days: {1} g a day against a target of {2} g.', C.proteinDays, C.protein, C.proteinTarget)}</div>}
      {C.band == null && C.protein == null && <div>{t('Log your weight and food to see these alerts against your loss rate and protein.')}</div>}
    </div>}
    <p className="small muted" style={{ marginTop: 10 }}>{t('Volume: a third of the usual weekly volume kept the muscle gained in young adults (Bickel, Cross & Bamman, 2011), outside a calorie deficit. Strength: a {0}% drop of the estimated 1RM is SuperOpenGym\'s own threshold — no study sets one.', Math.round(STRENGTH_DROP * 100))}</p>
    <div style={{ height: 12 }} />
    <Button variant="primary" onClick={ack}>{all.length ? t('Got it') : t('Close')}</Button>
  </>
}
export const alertsSheet = () => useUI.getState().openSheet(close => <AlertsSheet close={close} />)

/** Home: a band while there are alerts not yet acknowledged. */
export function AlertBand({ S }) {
  const { unseen } = deficitAlerts(S, todayISO(), weekStartOf(S))
  if (!unseen.length) return null
  const strength = unseen.filter(a => a.kind === 'strength').length, volume = unseen.length - strength
  return <button className="dband dband-alert" onClick={alertsSheet}>
    <span className="dband-sq dband-strength"><Icon name="warning" /></span>
    <span className="dband-m">
      <span className="dband-t">{t(unseen.length === 1 ? '1 alert in your training' : '{0} alerts in your training', unseen.length)}</span>
      <span className="dband-s">{[strength ? t('{0} strength', strength) : null, volume ? t('{0} volume', volume) : null].filter(Boolean).join(' · ')}</span>
    </span>
    <Icon name="chevronRight" className="dband-c" />
  </button>
}

/** Settings: the weekly notification switch (app only). */
export function AlertsSection() {
  const S = useStore(s => s.S)
  const [busy, setBusy] = useState(false)
  if (!MOBILE) return null
  const toggle = async v => {
    setBusy(true)
    useStore.getState().update(s => { s.alertsNotify = v })
    const { syncAlertNotification } = await import('../lib/alert-notify.js')
    const ok = await syncAlertNotification({ ...useStore.getState().S, alertsNotify: v }, { interactive: true })
    if (v && !ok) { useStore.getState().update(s => { s.alertsNotify = false }); useUI.getState().toast(t('Notifications are not allowed for this app.')) }
    setBusy(false)
  }
  return <Section title={t('Training in a deficit')} footer={t('A notification on Monday at 9:00 when there are strength or volume alerts you have not seen yet.')}>
    <Row icon="bell" iconTint="var(--purple)" title={t('Weekly alert notification')}>
      <Switch checked={!!S.alertsNotify} disabled={busy} onChange={toggle} />
    </Row>
    <Row icon="warning" iconTint="var(--purple)" title={t('See the alerts')} accessory="chevron" onClick={alertsSheet} />
  </Section>
}
