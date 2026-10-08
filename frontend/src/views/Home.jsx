import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { effectiveRoutines, effectiveRoutineIds, nextTrainingDay, streakWeeks, lastBW, setsDoneActive } from '../lib/history.js'
import { fmtNum, fmtDate, todayISO, isoOf, weekKey, weekStartOf, weekDayOffset, DAYS, DAYN } from '../lib/format.js'
import { t, dateLocale } from '../lib/i18n.js'
import { bwSheet, goalSheet, dayOverrideSheet, calendarSheet, startFlow, starterPlanSheet, weighInsSheet } from '../sheets.jsx'
import LineChart from '../components/LineChart.jsx'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'
import { tappable } from '../lib/use-sheet-keyboard.js'
import { glyphOf } from '../lib/glyphs.js'
import { fieldKind, typicalMinutes } from '../lib/home-field.js'
import { trendSeries, weeklyRate, rateBand, isCutting } from '../lib/body-comp.js'
import { targets, dayTotals } from '../lib/nutrition.js'
import { stepsOn, exerciseOn, EXERCISE_TYPES, STRENGTH_TYPES } from '../lib/health-sync.js'
import { AlertBand } from '../components/DeficitAlerts.jsx'

// Home = what to do now + a quick glance. Deep charts & history live in Stats.
export default function Home() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const user = useStore(s => s.user)
  const [weekOffset, setWeekOffset] = useState(0)

  const today = new Date()
  // A weekday can hold several routines. `todayRoutines` is the whole day; `routine` is the
  // first, kept for the one-routine glyph. The derived session name joins them (§9).
  const todayRoutines = effectiveRoutines(S, todayISO())
  const routine = todayRoutines[0] || null
  const todayName = todayRoutines.map(r => r.name).join(' + ')
  // An open editor on a saved workout (lib/session-edit.js) holds S.active too, but it is not a
  // session in progress: the row takes you back to it as an edit, the way the tab bar does.
  const editingSaved = !!S.active?.editingWorkoutId
  // On a rest day, saying when you train next beats leaving the row as a full stop.
  const next = !S.active && !todayRoutines.length ? nextTrainingDay(S, todayISO()) : null
  const bw = lastBW(S)
  const prevBW = S.bodyweight.length > 1 ? S.bodyweight[S.bodyweight.length - 2] : null
  const delta = bw && prevBW ? bw.w - prevBW.w : null

  const ws = weekStartOf(S)
  // The first day of the shown week. Named for the role, not for Monday — which day that is
  // is the setting.
  const wkStart = new Date(today)
  wkStart.setDate(today.getDate() - weekDayOffset(today.getDay(), ws) + weekOffset * 7)
  const doneDays = new Set(S.workouts.map(w => w.d))
  // The last session logged for today, if any — what the row below reports instead of asking
  // you to start the one you already did. Last wins, so a second session names itself.
  const doneToday = S.workouts.filter(w => w.d === todayISO()).at(-1) || null
  const strip = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(wkStart); d.setDate(wkStart.getDate() + i)
    const iso = isoOf(d)
    const eff = effectiveRoutineIds(S, iso).length > 0, ovr = S.dayPlan[iso] !== undefined, done = doneDays.has(iso)
    const dot = done ? ' done' : ovr && eff ? ' ovr' : eff ? ' plan' : ''
    strip.push(<div key={i} className={'wday' + (iso === todayISO() ? ' today' : '')} {...tappable(() => dayOverrideSheet(iso))}>
      <div className="lbl">{t(DAYS[d.getDay()])}</div><div className="num">{d.getDate()}</div><div className={'dot' + dot} /></div>)
  }
  const wkEnd = new Date(wkStart); wkEnd.setDate(wkStart.getDate() + 6)
  const wkLabel = weekOffset === 0 ? t('This week') : `${wkStart.getDate()} ${wkStart.toLocaleDateString(dateLocale(), { month: 'short' })} – ${wkEnd.getDate()} ${wkEnd.toLocaleDateString(dateLocale(), { month: 'short' })}`

  const wThisWeek = S.workouts.filter(w => weekKey(w.d, ws) === weekKey(todayISO(), ws)).length
  // Days scheduled, not routines — a combined day counts as 1, matching wThisWeek (one w).
  const plannedPerWeek = Object.values(S.week).filter(ids => ids?.length).length
  const bwPoints = S.bodyweight.slice(-30).map(b => ({ t: b.t || new Date(b.d).getTime(), y: b.w, d: b.d }))

  // today's session shown right under the week strip
  const onToday = () => { if (S.active) nav('/workout'); else if (todayRoutines.length) startFlow(effectiveRoutineIds(S, todayISO())); else dayOverrideSheet(todayISO()) }

  return <div className="narrow home">
    <div className="hdr">
      <div><h1>{user ? t('Hi {0}', user.name) : 'SuperOpenGym'}</h1><div className="sub">{today.toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long' })}</div></div>
      <button className="iconbtn" onClick={() => nav('/settings')} aria-label={t('Settings')}><Icon name="gear" /></button>
    </div>

    <div className="home-grid">
    <TodayField S={S} routine={routine} todayRoutines={todayRoutines} todayName={todayName} doneToday={doneToday}
      editingSaved={editingSaved} next={next} bw={bw} delta={delta} bwPoints={bwPoints} onToday={onToday} />
    <div className="home-side">

    <div className="card">
      <div className="row between" style={{ marginBottom: 8 }}>
        <button className="iconbtn" style={{ width: 30, height: 30, fontSize: 15 }} onClick={() => setWeekOffset(w => w - 1)} aria-label={t('Previous week')}><Icon name="chevronLeft" /></button>
        <div className="small muted" style={{ fontWeight: 500 }}>{wkLabel}</div>
        <button className="iconbtn" style={{ width: 30, height: 30, fontSize: 15 }} onClick={() => setWeekOffset(w => w + 1)} aria-label={t('Next week')}><Icon name="chevronRight" /></button>
      </div>
      <div className="week">{strip}</div>
      {/* The row above starts today's plan in one tap, and so does the Start button in the tab
          bar — which is the whole problem when you want something else. Both jump straight into
          the planned session whenever there is one, so the Start screen (a freestyle session,
          and your other routines) is only reachable on a day with nothing planned. The one other
          way in, "Choose a different workout" on the weigh-in sheet, does not exist when the
          weigh-in is switched off. This is that door, and it starts nothing on its own. */}
      {!S.active && <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
        <Button size="sm" variant="ghost" className="dim" icon="reset" onClick={() => nav('/workout')}>
          {t('Choose a different workout')}
        </Button>
      </div>}
    </div>

    {/* Jump to the gym check-in cards (QR membership codes). Shown here as a quick tap on
        arrival at the gym; folds away per user via the "Gym check-in" switch in Settings. */}
    {S.checkIn !== false && (
      <button className="dband" onClick={() => nav('/checkin')}>
        <span className="dband-sq dband-rest"><Icon name="qr" /></span>
        <span className="dband-m"><span className="dband-t">{t('Check in')}</span><span className="dband-s">{t('At the gym')}</span></span>
        <Icon name="chevronRight" className="dband-c" />
      </button>
    )}

    {!S.routines.length && !S.active && (
      <div className="card">
        <div className="row" style={{ gap: 10, marginBottom: 6 }}>
          <span className="lrow-i"><Icon name="sparkles" /></span>
          <div className="big" style={{ fontSize: 22 }}>{t('Welcome!')}</div>
        </div>
        <div className="muted small" style={{ marginBottom: 12 }}>{t('Set up your weekly routine to get going — or load a ready-made starter plan.')}</div>
        <Button variant="primary" icon="sparkles" onClick={starterPlanSheet}>{t('Load starter plan')}</Button>
        <div style={{ height: 8 }} /><Button onClick={() => nav('/plan')}>{t('Build my own plan')}</Button>
      </div>
    )}

    {S.showWeightCard !== false && fieldKind(S, todayRoutines, doneToday) !== 'body' &&
      <BodyBand S={S} bw={bw} delta={delta} bwPoints={bwPoints} />}

    <AlertBand S={S} />
    <NutritionBand S={S} />
    <ActivityBand S={S} />

    <button className="dband" onClick={() => calendarSheet()}>
      <span className="dband-sq dband-train"><Icon name="flame" /></span>
      <span className="dband-m">
        <span className="dband-t">{t('{0} week streak', streakWeeks(S))}</span>
        <span className="dband-s">{wThisWeek}{plannedPerWeek ? ' / ' + plannedPerWeek : ''} {t('this week')} · {t(S.workouts.length === 1 ? '{0} workout total' : '{0} workouts total', S.workouts.length)}</span>
      </span>
      <Icon name="calendar" className="dband-c" />
    </button>
    </div>
    </div>
  </div>
}

function TodayField({ S, routine, todayRoutines, todayName, doneToday, editingSaved, next, bw, delta, bwPoints, onToday }) {
  const nav = useNavigate()
  const kind = fieldKind(S, todayRoutines, doneToday)

  if (kind === 'active') return <section className="dfield dfield-active" aria-label={t('Today')}>
    <div className="dfield-hero" aria-hidden="true"><Icon name={editingSaved ? 'pencil' : 'timer'} /></div>
    <div className="dfield-words">
      <h2 className="dfield-title">{S.active.name}</h2>
      <div className="dfield-note">{editingSaved ? t('Edit workout') : t('In progress')}</div>
    </div>
    <button className="dfield-go" onClick={() => nav('/workout')}>{editingSaved ? t('Edit') : t('Resume')}<Icon name="chevronRight" /></button>
  </section>

  if (kind === 'train') {
    const exCount = todayRoutines.reduce((n, r) => n + r.ex.length, 0)
    const setCount = todayRoutines.reduce((n, r) => n + r.ex.reduce((m, e) => m + (Number(e.sets) || 0), 0), 0)
    const mins = typicalMinutes(S.workouts, todayRoutines.map(r => r.id))
    return <section className="dfield dfield-train" aria-label={t('Today')}>
      <div className="dfield-hero" aria-hidden="true"><Icon name={glyphOf(routine.emoji)} /></div>
      <div className="dfield-words">
      <h2 className="dfield-title">{todayName}</h2>
      {S.dayPlan[todayISO()] !== undefined && <div className="dfield-note">{t('rescheduled')}</div>}
      <dl className="dfield-facts">
        <div><dt>{t('Exercises')}</dt><dd>{exCount}</dd></div>
        {setCount > 0 && <div><dt>{t('Sets')}</dt><dd>{setCount}</dd></div>}
        {mins != null && <div><dt>{t('Usual time')}</dt><dd>{mins}<small> min</small></dd></div>}
      </dl>
      </div>
      <button className="dfield-go" onClick={onToday}>{t('Start')}<Icon name="chevronRight" /></button>
    </section>
  }

  // body: the weight curve against the goal, the latest weigh-in at the end of the line
  return <section className="dfield dfield-body" aria-label={t('Body weight')}>
    <div className="dfield-head">
      <h2 className="dfield-lead">{t('Body weight')}</h2>
      <Icon name="scale" className="dfield-pict" />
    </div>
    <div className="dfield-note">{doneToday ? (doneToday.name ? t('{0} — done', doneToday.name) : t('Workout done'))
      : next ? t('Next session: {0}, {1}', t(DAYN[next.weekday]), next.routine.name) : t('Rest day')}</div>
    {S.showWeightCard === false ? <div className="dfield-title">{doneToday ? t('Done') : t('Rest day')}</div>
    : bw ? <>
      <WeightSummary S={S} big />
    </> : <div className="dfield-sub">{t('No entries yet — log your weight to start the curve.')}</div>}
    {S.showWeightCard !== false && <div className="dfield-actions">
      <button className="dfield-go" onClick={() => bwSheet()}><Icon name="plus" />{t('Log weight')}</button>
      <button className="dfield-ghost" onClick={goalSheet}><Icon name="target" />{S.targetW ? fmtNum(S.targetW) : t('Goal')}</button>
      {bw && <button className="dfield-ghost" onClick={weighInsSheet} aria-label={t('All weigh-ins')}><Icon name="list" /></button>}
    </div>}
  </section>
}

// The body band: the same green field as the rest-day field, compact, for days when training
// owns the top of Home. Ink is navy throughout, the chart included.
function BodyBand({ S, bw, delta, bwPoints }) {
  return <section className="dfield dfield-body dfield-band" aria-label={t('Body weight')}>
    <div className="dfield-head">
      <h2 className="dfield-lead">{t('Body weight')}</h2>
      <Icon name="scale" className="dfield-pict" />
    </div>
    {bw ? <>
      <WeightSummary S={S} />
    </> : <div className="dfield-sub">{S.weighIn === false
      ? t('No entries yet — log your weight to start the curve.')
      : t("No entries yet — log your weight to start the curve. It's also asked before every workout.")}</div>}
    <div className="dfield-actions">
      <button className="dfield-go" onClick={() => bwSheet()}><Icon name="plus" />{t('Log')}</button>
      <button className="dfield-ghost" onClick={goalSheet}><Icon name="target" />{S.targetW ? fmtNum(S.targetW) : t('Goal')}</button>
      {bw && <button className="dfield-ghost" onClick={weighInsSheet} aria-label={t('All weigh-ins')}><Icon name="list" /></button>}
    </div>
  </section>
}

const BAND_SHORT = { fast: 'faster than 1% a week', 'in-range': 'in the 0.5–1% range', slow: 'under 0.5% a week', 'not-losing': 'not going down' }
// The body field's content: the weight trend (not the day's weigh-in, which water and salt move),
// the weekly rate against the 0.5–1% band when cutting, and the way into the Body screen.
function WeightSummary({ S, big = false }) {
  const nav = useNavigate()
  const series = trendSeries(S.bodyweight)
  const last = series.at(-1)
  const lastIn = [...series].reverse().find(x => x.w != null)
  const rate = weeklyRate(S.bodyweight, todayISO())
  const trend = Math.round(last.trend * 10) / 10
  const band = isCutting(S.targetW, last.trend) ? rateBand(rate.rate) : null
  const toGoal = S.targetW != null ? S.targetW - trend : null
  const points = series.slice(-60).map(x => ({ t: new Date(x.d + 'T12:00:00').getTime(), y: Math.round(x.trend * 10) / 10, d: x.d }))
  return <>
    <div className="dfield-weight">
      <span className={big ? 'num-xl' : 'num-l'}>{fmtNum(trend)}</span><span className="dfield-unit">{S.unit} · {t('trend')}</span>
    </div>
    <div className="dfield-sub">{t('Last weigh-in {0} {1} · {2}', fmtNum(lastIn.w), S.unit, fmtDate(lastIn.d, true))}
      {toGoal != null ? ' · ' + (Math.abs(toGoal) < 0.05 ? t('Goal reached!') : t(toGoal > 0 ? '{0} to gain' : '{0} to lose', fmtNum(Math.abs(Math.round(toGoal * 10) / 10)) + ' ' + S.unit)) : ''}</div>
    {rate.rate != null && <div className="dfield-rate">{(rate.rate > 0 ? '+' : rate.rate < 0 ? '−' : '±') + fmtNum(Math.abs(Math.round(rate.rate * 100) / 100))} % {t('per week')}{band ? ' · ' + t(BAND_SHORT[band]) : ''}</div>}
    {points.length > 1 && <div className="dfield-chart"><LineChart points={points} h={big ? 110 : 96} unit={S.unit} goal={S.targetW} color="var(--on-field)" goalColor="var(--on-field)" ink="var(--on-field)" /></div>}
    <button className="dfield-open" onClick={() => nav('/body')}>{t('Body: trend, measurements and body fat')}<Icon name="chevronRight" /></button>
  </>
}

// The nutrition band: today's calories against the target and the protein, into Nutrition.
function NutritionBand({ S }) {
  const nav = useNavigate()
  const today = todayISO()
  const T = targets(S, today)
  const day = dayTotals(S.foodLog, today)
  return <button className="dband" onClick={() => nav('/nutrition')}>
    <span className="dband-sq dband-food"><Icon name="food" /></span>
    <span className="dband-m">
      <span className="dband-t">{fmtNum(day.kcal)}{T.kcal != null ? ' / ' + fmtNum(T.kcal) : ''} kcal</span>
      <span className="dband-s">{t('Protein')} {fmtNum(day.p)}{T.protein != null ? ' / ' + fmtNum(T.protein) : ''} g{!day.items.length ? ' · ' + t('nothing logged today') : ''}</span>
    </span>
    <Icon name="chevronRight" className="dband-c" />
  </button>
}

// The activity band: today's steps and other apps' exercise, from Health Connect. Shown once
// Health Connect is on or anything has arrived from it.
function ActivityBand({ S }) {
  const nav = useNavigate()
  const today = todayISO()
  if (!S.health?.on && !(S.activity || []).length) return null
  const steps = stepsOn(S, today)
  const sessions = exerciseOn(S, today)
  const cardio = Math.round(sessions.filter(x => !STRENGTH_TYPES.has(x.type)).reduce((n, x) => n + (x.end - x.start) / 60000, 0))
  return <button className="dband" onClick={() => nav('/settings')}>
    <span className="dband-sq dband-move"><Icon name="figureRun" /></span>
    <span className="dband-m">
      <span className="dband-t">{steps != null ? t('{0} steps', fmtNum(steps)) : t('No steps yet today')}</span>
      <span className="dband-s">{sessions.length ? sessions.map(x => t(EXERCISE_TYPES[x.type] || 'Workout')).join(' · ') + (cardio ? ' · ' + t('{0} min of cardio', cardio) : '') : t('From Health Connect')}</span>
    </span>
    <Icon name="chevronRight" className="dband-c" />
  </button>
}
