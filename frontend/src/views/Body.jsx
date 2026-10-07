import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { t, dateLocale } from '../lib/i18n.js'
import { fmtNum, fmtDate, todayISO, uid } from '../lib/format.js'
import { bwSheet, goalSheet, weighInsSheet, confirmSheet } from '../sheets.jsx'
import { trendSeries, weeklyRate, rateBand, isCutting, bodyFatSeries, liveMeasures, measureChanges, navyBodyFat, MEASURE_FIELDS, RATE_BAND } from '../lib/body-comp.js'
import Icon from '../components/Icon.jsx'
import { Button, Row, NumberField, Segmented } from '../components/ui.jsx'

// Body (SuperOpenGym Phase 5): the weight trend and the weekly rate against the 0.5–1% band,
// body measurements, body fat (logged and the Navy estimate) with lean mass, and the profile the
// formulas need. Every number comes from lib/body-comp.js, every guideline names its source.

const MEASURE_LABEL = {
  waist: 'Waist', neck: 'Neck', hip: 'Hip', chest: 'Chest', shoulders: 'Shoulders',
  arm: 'Arm', thigh: 'Thigh', calf: 'Calf',
}
const METHOD_LABEL = {
  scale: 'Smart scale (bioimpedance)', calipers: 'Skinfold calipers', dexa: 'DEXA scan',
  navy: 'US Navy estimate', other: 'Other',
}
const BAND_TEXT = {
  fast: 'Faster than 1% a week: more of the loss may be muscle.',
  'in-range': 'In the 0.5–1% a week range that best keeps muscle.',
  slow: 'Slower than 0.5% a week: steady, but under the recommended range.',
  'not-losing': 'The trend is not going down.',
}
const REASON_TEXT = {
  'no-data': 'Log your weight to see the trend.',
  short: 'The weekly rate appears after two weeks of weigh-ins.',
  few: 'Weigh in at least 4 times in two weeks to get a weekly rate.',
  stale: 'No weigh-in in the last week: the rate would be out of date.',
}
const signed = (v, unit) => (v > 0 ? '+' : v < 0 ? '−' : '±') + fmtNum(Math.abs(v)) + (unit ? ' ' + unit : '')

// The trend line over the day-to-day weigh-ins, with the goal when there is one.
function TrendChart({ series, goal, unit }) {
  if (series.length < 2) return null
  const W = 400, H = 170, P = { l: 38, r: 8, t: 10, b: 20 }
  const ys = series.flatMap(x => [x.trend, x.w].filter(v => v != null)).concat(goal != null ? [goal] : [])
  let lo = Math.min(...ys), hi = Math.max(...ys)
  if (hi - lo < 1) { lo -= 0.5; hi += 0.5 }
  const X = i => P.l + (W - P.l - P.r) * (i / (series.length - 1))
  const Y = v => P.t + (H - P.t - P.b) * (1 - (v - lo) / (hi - lo))
  const line = series.map((x, i) => `${X(i).toFixed(1)},${Y(x.trend).toFixed(1)}`).join(' ')
  const short = d => new Date(d + 'T12:00:00').toLocaleDateString(dateLocale(), { day: 'numeric', month: 'short' })
  return <svg viewBox={`0 0 ${W} ${H}`} className="body-chart" role="img" aria-label={t('Weight trend')}>
    {[lo, (lo + hi) / 2, hi].map((v, i) => <g key={i}>
      <line x1={P.l} x2={W - P.r} y1={Y(v)} y2={Y(v)} stroke="var(--sep)" strokeWidth="1" />
      <text x={P.l - 6} y={Y(v) + 3.5} textAnchor="end" fontSize="11" fill="var(--label-2)">{fmtNum(Math.round(v * 10) / 10)}</text>
    </g>)}
    {goal != null && <line x1={P.l} x2={W - P.r} y1={Y(goal)} y2={Y(goal)} stroke="var(--ink)" strokeWidth="1.4" strokeDasharray="6 4" />}
    {series.map((x, i) => x.w == null ? null : <rect key={i} x={X(i) - 1.75} y={Y(x.w) - 1.75} width="3.5" height="3.5" fill="var(--label-3)" />)}
    <polyline points={line} fill="none" stroke="var(--d-body)" strokeWidth="2.5" />
    <text x={P.l} y={H - 4} fontSize="11" fill="var(--label-2)">{short(series[0].d)}</text>
    <text x={W - P.r} y={H - 4} fontSize="11" textAnchor="end" fill="var(--label-2)">{short(series.at(-1).d)}</text>
  </svg>
}

export default function Body() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const today = todayISO()
  const series = trendSeries(S.bodyweight)
  const last = series.at(-1) || null
  const rate = weeklyRate(S.bodyweight, today)
  const cutting = isCutting(S.targetW, last?.trend)
  const band = cutting ? rateBand(rate.rate) : null
  const fat = bodyFatSeries(S)
  const lastFat = fat.at(-1) || null
  const measures = liveMeasures(S)
  const changes = measureChanges(measures)
  const profileMissing = !S.profile?.sex || !(S.profile?.heightCm > 0)

  return <div className="narrow">
    <div className="hdr">
      <div><h1>{t('Body')}</h1><div className="sub">{t('Weight trend, measurements and body fat')}</div></div>
      <button className="iconbtn" onClick={() => nav(-1)} aria-label={t('Back')}><Icon name="chevronLeft" /></button>
    </div>

    <section className="dfield dfield-body dfield-band" aria-label={t('Weight trend')}>
      <div className="dfield-head"><h2 className="dfield-lead">{t('Weight trend')}</h2><Icon name="scale" className="dfield-pict" /></div>
      {last ? <>
        <div className="dfield-weight"><span className="num-xl">{fmtNum(Math.round(last.trend * 10) / 10)}</span><span className="dfield-unit">{S.unit}</span></div>
        <div className="dfield-sub">{t('Last weigh-in {0} {1} · {2}', fmtNum([...series].reverse().find(x => x.w != null).w), S.unit, fmtDate([...series].reverse().find(x => x.w != null).d, true))}</div>
        <div className="body-rate">
          {rate.rate != null
            ? <><span className="num-m">{signed(Math.round(rate.rate * 100) / 100)} %</span><span>{t('per week')} · {signed(Math.round(rate.kgPerWeek * 100) / 100, S.unit)}</span></>
            : <span>{t(REASON_TEXT[rate.reason])}</span>}
        </div>
        {band && <div className={'body-band band-' + band}>{t(BAND_TEXT[band])}</div>}
        {!cutting && rate.rate != null && <div className="dfield-sub">{S.targetW ? t('Your goal is above the trend: the 0.5–1% loss range does not apply.') : t('Set a goal weight below your trend to check the rate against the 0.5–1% range.')}</div>}
      </> : <div className="dfield-sub">{t(REASON_TEXT['no-data'])}</div>}
      <div className="dfield-actions">
        <button className="dfield-go" onClick={() => bwSheet()}><Icon name="plus" />{t('Log weight')}</button>
        <button className="dfield-ghost" onClick={goalSheet}><Icon name="target" />{S.targetW ? fmtNum(S.targetW) : t('Goal')}</button>
        {last && <button className="dfield-ghost" onClick={weighInsSheet} aria-label={t('All weigh-ins')}><Icon name="list" /></button>}
      </div>
    </section>

    {series.length > 1 && <div className="card">
      <h2>{t('Trend and weigh-ins')}</h2>
      <TrendChart series={series.slice(-120)} goal={S.targetW ?? null} unit={S.unit} />
      <p className="small muted">{t('The line is the trend: each weigh-in moves it 10% of the way, so water and salt from one day barely shift it (J. Walker, The Hacker\'s Diet). The squares are your weigh-ins.')}</p>
      <p className="small muted">{t('Rate range: {0}–{1}% of body weight per week to maximise muscle retention (Helms, Aragon & Fitschen, J Int Soc Sports Nutr, 2014).', fmtNum(RATE_BAND.low), fmtNum(RATE_BAND.high))}</p>
    </div>}

    <div className="card">
      <div className="row between" style={{ marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>{t('Body fat')}</h2>
        <Button size="sm" icon="plus" onClick={() => bodyFatSheet()}>{t('Log')}</Button>
      </div>
      {lastFat ? <>
        <div className="row" style={{ gap: 18, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <div><span className="num-l">{fmtNum(lastFat.pct)}</span> <span className="small">%</span></div>
          {lastFat.lean != null && <div className="small">{t('Lean mass')} <b className="num-m">{fmtNum(lastFat.lean)}</b> {S.unit}</div>}
        </div>
        <div className="small muted">{fmtDate(lastFat.d, true)} · {t(METHOD_LABEL[lastFat.method] || 'Other')}</div>
        {fat.length > 1 && <FatList fat={fat} unit={S.unit} />}
      </> : <div className="small muted">{t('No body-fat readings yet. Log one from a scale or calipers, or add waist and neck measurements to get the Navy estimate.')}</div>}
      {profileMissing && <div className="small" style={{ marginTop: 10 }}>{t('The Navy estimate needs your height and sex in the profile below.')}</div>}
      <p className="small muted" style={{ marginTop: 8 }}>{t('Navy estimate: circumference equations of Hodgdon & Beckett (Naval Health Research Center, 1984). An estimate, typically a few points off a lab measurement.')}</p>
    </div>

    <div className="card">
      <div className="row between" style={{ marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>{t('Measurements')}</h2>
        <Button size="sm" icon="plus" onClick={() => measureSheet()}>{t('Log')}</Button>
      </div>
      {measures.length ? <div className="measure-grid">
        {MEASURE_FIELDS.filter(f => changes[f]).map(f => <div key={f} className="measure">
          <span className="measure-l">{t(MEASURE_LABEL[f])}</span>
          <span className="num-m">{fmtNum(changes[f].last.v)}<small> cm</small></span>
          {changes[f].first.d !== changes[f].last.d && <span className="small">{signed(Math.round(changes[f].change * 10) / 10, 'cm')} {t('since {0}', fmtDate(changes[f].first.d, true))}</span>}
        </div>)}
      </div> : <div className="small muted">{t('No measurements yet. Waist is the best home measure of fat loss; arms and thighs show whether muscle is kept.')}</div>}
      {measures.length > 0 && <MeasureHistory measures={measures} />}
    </div>

    <div className="card">
      <h2>{t('Profile')}</h2>
      <ProfileRows />
    </div>
  </div>
}

function FatList({ fat, unit }) {
  return <div className="body-list">
    {[...fat].reverse().slice(0, 8).map(x => <div key={x.id} className="body-row">
      <span className="br-d">{fmtDate(x.d, true)}</span>
      <span className="br-m">{t(METHOD_LABEL[x.method] || 'Other')}</span>
      <span className="br-v"><b>{fmtNum(x.pct)} %</b>{x.lean != null && <small>{fmtNum(x.lean)} {unit}</small>}</span>
      {String(x.id).startsWith('navy:') ? <span /> : <button className="linkbtn" onClick={() => removeEntry('bodyfat', x.id)} aria-label={t('Delete')}><Icon name="trash" /></button>}
    </div>)}
  </div>
}

function MeasureHistory({ measures }) {
  return <div className="body-list">
    {[...measures].reverse().slice(0, 6).map(m => <div key={m.id} className="body-row">
      <span className="br-d">{fmtDate(m.d, true)}</span>
      <span className="br-m">{MEASURE_FIELDS.filter(f => Number(m[f]) > 0).map(f => t(MEASURE_LABEL[f]) + ' ' + fmtNum(m[f])).join(' · ')}</span>
      <span />
      <button className="linkbtn" onClick={() => removeEntry('measures', m.id)} aria-label={t('Delete')}><Icon name="trash" /></button>
    </div>)}
  </div>
}

function ProfileRows() {
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const p = S.profile || {}
  const set = patch => update(s => { s.profile = { ...(s.profile || {}), ...patch } })
  // The sex starts from the body-map figure chosen in Settings, until it is set here.
  useEffect(() => {
    if (!p.sex && (S.body === 'male' || S.body === 'female')) set({ sex: S.body })
  }, [])
  return <>
    <Row icon="person" title={t('Sex')}>
      <Segmented className="seg-inline" value={p.sex || null} onChange={v => set({ sex: v })}
        options={[{ value: 'male', label: t('Male') }, { value: 'female', label: t('Female') }]} />
    </Row>
    <Row icon="arrowUp" title={t('Height (cm)')}>
      <NumberField className="body-num" value={p.heightCm ?? null} nullable decimal={false} onChange={v => set({ heightCm: v > 0 ? v : null })} />
    </Row>
    <div className="small muted" style={{ marginTop: 6 }}>{t('Used for the Navy body-fat estimate, and later for your calorie and protein targets.')}</div>
  </>
}

/* ----------------------------------------------------------------- sheets -- */

const ui = () => useUI.getState()
function removeEntry(field, id) {
  confirmSheet({
    title: t('Delete this entry?'), confirmText: t('Delete'), danger: true,
    onConfirm: () => useStore.getState().update(s => {
      // A tombstone, not a removal: another device's copy cannot bring it back (sync-merge).
      s[field] = (s[field] || []).map(e => e?.id === id ? { id, deleted: true, t: Date.now() } : e)
    }),
  })
}

function MeasureSheet({ close }) {
  const S = useStore.getState().S
  const prev = liveMeasures(S).at(-1) || {}
  const [d, setD] = useState(todayISO())
  const [vals, setVals] = useState(() => Object.fromEntries(MEASURE_FIELDS.map(f => [f, null])))
  const setF = (f, v) => setVals(x => ({ ...x, [f]: v > 0 ? v : null }))
  const any = MEASURE_FIELDS.some(f => vals[f] > 0)
  const navy = navyBodyFat({ sex: S.profile?.sex, heightCm: S.profile?.heightCm, neck: vals.neck, waist: vals.waist, hip: vals.hip })
  const save = () => {
    if (!any) return
    const entry = { id: uid(), d, t: Date.now(), ...Object.fromEntries(MEASURE_FIELDS.filter(f => vals[f] > 0).map(f => [f, Math.round(vals[f] * 10) / 10])) }
    useStore.getState().update(s => { s.measures = [...(s.measures || []), entry] })
    close()
    ui().toast(t('Measurements saved'))
  }
  return <>
    <h3>{t('Log measurements')}</h3>
    <div className="muted small" style={{ marginBottom: 10 }}>{t('In centimetres, relaxed, same time of day and same side each time. Leave empty what you do not measure.')}</div>
    <Row icon="calendar" title={t('Date')}><input type="date" className="timef" value={d} max={todayISO()} onChange={e => setD(e.target.value)} /></Row>
    {MEASURE_FIELDS.map(f => <Row key={f} title={t(MEASURE_LABEL[f])} subtitle={prev[f] ? t('Last: {0} cm', fmtNum(prev[f])) : undefined}>
      <NumberField value={vals[f]} nullable fit onChange={v => setF(f, v)} />
    </Row>)}
    {navy != null && <div className="small" style={{ margin: '10px 0' }}>{t('Navy estimate with these measurements: {0} % body fat.', fmtNum(navy))}</div>}
    <div style={{ height: 12 }} />
    <Button variant="primary" disabled={!any} onClick={save}>{t('Save')}</Button>
  </>
}

function BodyFatSheet({ close }) {
  const [d, setD] = useState(todayISO())
  const [pct, setPct] = useState(null)
  const [method, setMethod] = useState('scale')
  const ok = pct > 2 && pct < 70
  const save = () => {
    if (!ok) return
    useStore.getState().update(s => { s.bodyfat = [...(s.bodyfat || []), { id: uid(), d, t: Date.now(), pct: Math.round(pct * 10) / 10, method }] })
    close()
    ui().toast(t('Body fat saved'))
  }
  return <>
    <h3>{t('Log body fat')}</h3>
    <Row icon="calendar" title={t('Date')}><input type="date" className="timef" value={d} max={todayISO()} onChange={e => setD(e.target.value)} /></Row>
    <Row title={t('Body fat (%)')}><NumberField value={pct} nullable fit onChange={v => setPct(v)} /></Row>
    <div className="sect-t" style={{ marginTop: 12 }}>{t('Method')}</div>
    <div className="chips" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {['scale', 'calipers', 'dexa', 'other'].map(m => <button key={m} className={'chip nocap' + (method === m ? ' on' : '')} onClick={() => setMethod(m)}>{t(METHOD_LABEL[m])}</button>)}
    </div>
    <div className="small muted" style={{ marginTop: 10 }}>{t('Readings from different methods are not comparable: keep to one to follow the change.')}</div>
    <div style={{ height: 16 }} />
    <Button variant="primary" disabled={!ok} onClick={save}>{t('Save')}</Button>
  </>
}

export const measureSheet = () => ui().openSheet(close => <MeasureSheet close={close} />)
export const bodyFatSheet = () => ui().openSheet(close => <BodyFatSheet close={close} />)
