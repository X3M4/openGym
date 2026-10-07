import { useState } from 'react'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { t } from '../lib/i18n.js'
import { todayISO, weekStartOf } from '../lib/format.js'
import { buildPeriodReport, presetRange } from '../lib/period-report.js'
import { periodReportHTML } from '../lib/period-report-html.js'
import { printDocument } from '../lib/plan-share.js'
import { MOBILE, printHtml } from '../lib/mobile.js'
import { Button, Row } from './ui.jsx'

const PRESETS = ['last4w', 'month', 'lastMonth', 'last3m']
const PRESET_LABEL = { last4w: 'Last 4 weeks', month: 'This month', lastMonth: 'Last month', last3m: 'Last 3 months' }

// Progress → "PDF report": a date range, then the period report through the print flow — the
// browser's dialog on the web, Android's print service in the app — where "Save as PDF" is one of
// the destinations. The document itself is lib/period-report-html.js.
function ReportSheet({ close }) {
  const today = todayISO()
  const [preset, setPreset] = useState('last4w')
  const [range, setRange] = useState(() => presetRange('last4w', today))
  const pick = key => { setPreset(key); setRange(presetRange(key, today)) }
  const setFrom = from => { setPreset(null); setRange(r => ({ ...r, from })) }
  const setTo = to => { setPreset(null); setRange(r => ({ ...r, to })) }
  const invalid = !range.from || !range.to || range.from > range.to

  const generate = () => {
    if (invalid) return
    const { S, user } = useStore.getState()
    const report = buildPeriodReport(S, { from: range.from, to: range.to, today, weekStart: weekStartOf(S) })
    const html = periodReportHTML(report, S, user?.name || '')
    const name = `${t('Training report')} ${range.from} – ${range.to}`
    close()
    if (MOBILE) printHtml(html, name).catch(() => { /* dismissed */ })
    else printDocument(html)
  }

  return <>
    <h3>{t('PDF report')}</h3>
    <div className="muted small" style={{ marginBottom: 14 }}>
      {t('Summary, plan against sessions day by day, charts, how training and weight moved together, and every session in detail. Choose "Save as PDF" in the print window.')}
    </div>
    <div className="chips" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
      {PRESETS.map(k => <button key={k} className={'chip nocap' + (preset === k ? ' on' : '')} onClick={() => pick(k)}>{t(PRESET_LABEL[k])}</button>)}
    </div>
    <Row icon="calendar" title={t('From')}>
      <input type="date" className="timef" value={range.from} max={range.to || today} onChange={e => setFrom(e.target.value)} /></Row>
    <Row icon="calendar" title={t('To')}>
      <input type="date" className="timef" value={range.to} min={range.from} onChange={e => setTo(e.target.value)} /></Row>
    {invalid && <div className="small" style={{ color: 'var(--red)', marginTop: 8 }}>{t('The start date has to be on or before the end date.')}</div>}
    <div style={{ height: 18 }} />
    <Button variant="primary" icon="download" disabled={invalid} onClick={generate}>{t('Create PDF')}</Button>
  </>
}

export const reportSheet = () => useUI.getState().openSheet(close => <ReportSheet close={close} />)
