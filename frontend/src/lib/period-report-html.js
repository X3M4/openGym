// The period report as one self-contained HTML document (lib/period-report.js builds the data).
// Printed through the same two paths as the plan sheet: the browser's print dialog on the web,
// the native Print plugin (Android PrintManager → "Save as PDF") in the app. Charts are inline
// SVG and the face is embedded, so the document renders the same in an off-screen WebView with
// no network: SuperOpenGym's system (DESIGN.md) on paper — white ground, navy ink, flat domain
// fields, Archivo wide for headings and condensed for numerals, one 4px corner.
import archivoWoff2 from '@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2?inline'
import { t, getLang, RTL_LANGS, exerciseNameFor, dateLocale } from './i18n.js'
import { EXIDX } from './exercises.js'
import { fmtNum, fmtDur } from './format.js'
import { fmtSec } from './history.js'
import { fmtSpeed, speedUnitOf } from './speed.js'
import { isWarmupRow, dropsOf, clustersOf, isSideSet, setType } from './workout-model.js'
import { MIN_WEEKS } from './correlation.js'
import { FOOD_MIN_DAYS } from './period-report.js'

const INK = '#13233f', TRAIN = '#3a9fe4', BODY = '#34b06a', FOOD = '#f39a33', MOVE = '#f5c932', STRENGTH = '#8f80dc', SILVER = '#eef2f6', RULE = '#d3dbe4'

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const dateOf = iso => new Date(iso + 'T12:00:00')
const longDate = iso => dateOf(iso).toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const shortDate = iso => dateOf(iso).toLocaleDateString(dateLocale(), { day: 'numeric', month: 'short' })
const exName = id => (EXIDX[id] ? exerciseNameFor(EXIDX[id]) : t('Unknown exercise'))
const signed = (v, unit) => (v > 0 ? '+' : v < 0 ? '−' : '±') + fmtNum(Math.abs(v)) + ' ' + unit
const pct = v => Math.round(v * 100) + ' %'

/* --------------------------------------------------------------- charts -- */

// Weekly bars: one field-coloured bar per week, its value on top.
function barChart(items, color, fmt) {
  if (!items.length || !items.some(i => i.v > 0)) return `<p class="empty">${esc(t('No data in this period.'))}</p>`
  const W = 680, H = 190, P = { l: 8, r: 8, t: 22, b: 26 }
  const max = Math.max(...items.map(i => i.v)) || 1
  const bw = (W - P.l - P.r) / items.length
  const bars = items.map((it, i) => {
    const h = (H - P.t - P.b) * (it.v / max)
    const x = P.l + i * bw + bw * 0.14, y = H - P.b - h, w = bw * 0.72
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${color}"/>
      ${it.v > 0 ? `<text x="${(x + w / 2).toFixed(1)}" y="${(y - 5).toFixed(1)}" class="v">${esc(fmt(it.v))}</text>` : ''}
      <text x="${(x + w / 2).toFixed(1)}" y="${H - 8}" class="l">${esc(it.label)}</text>`
  }).join('')
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img"><line x1="${P.l}" x2="${W - P.r}" y1="${H - P.b}" y2="${H - P.b}" stroke="${INK}" stroke-width="1"/>${bars}</svg>`
}

// A line over time, with its first and last values written at the ends.
function lineChart(points, color, unit, { h = 170, goal = null, axes = true } = {}) {
  if (points.length < 2) return `<p class="empty">${esc(t('Not enough entries to draw a line.'))}</p>`
  const W = 680, H = h, P = { l: 44, r: 54, t: 14, b: 24 }
  const ys = points.map(p => p.y).concat(goal != null ? [goal] : [])
  let lo = Math.min(...ys), hi = Math.max(...ys)
  if (hi - lo < 1) { lo -= 0.5; hi += 0.5 }
  const t0 = points[0].t, t1 = points.at(-1).t || t0 + 1
  const X = tt => P.l + (W - P.l - P.r) * ((tt - t0) / ((t1 - t0) || 1))
  const Y = v => P.t + (H - P.t - P.b) * (1 - (v - lo) / (hi - lo))
  const poly = points.map(p => `${X(p.t).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ')
  const ticks = !axes ? '' : [lo, (lo + hi) / 2, hi].map(v => `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" stroke="${RULE}" stroke-width="1"/>
    <text x="${P.l - 6}" y="${(Y(v) + 3.5).toFixed(1)}" class="ax" text-anchor="end">${esc(fmtNum(Math.round(v * 10) / 10))}</text>`).join('')
  const goalLine = goal != null ? `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(goal).toFixed(1)}" y2="${Y(goal).toFixed(1)}" stroke="${INK}" stroke-width="1.4" stroke-dasharray="6 4"/>
    <text x="${P.l + 4}" y="${(Y(goal) - 5).toFixed(1)}" class="ax">${esc(t('Goal'))} ${esc(fmtNum(goal))}</text>` : ''
  const last = points.at(-1)
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img">${ticks}${goalLine}
    <polyline points="${poly}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="miter"/>
    <rect x="${(X(last.t) - 4).toFixed(1)}" y="${(Y(last.y) - 4).toFixed(1)}" width="8" height="8" fill="${INK}"/>
    <text x="${(X(last.t) + 8).toFixed(1)}" y="${(Y(last.y) - 8).toFixed(1)}" class="v" style="text-anchor:start">${esc(fmtNum(last.y))} ${esc(unit)}</text>
    ${axes ? `<text x="${P.l}" y="${H - 6}" class="ax">${esc(shortDate(points[0].d))}</text>
    <text x="${W - P.r}" y="${H - 6}" class="ax" style="text-anchor:end">${esc(shortDate(last.d))}</text>` : ''}</svg>`
}

// Horizontal bars, one row per body part.
function hbars(rows, color) {
  if (!rows.length) return `<p class="empty">${esc(t('No data in this period.'))}</p>`
  const max = Math.max(...rows.map(r => r.sets))
  return `<div class="hbars">${rows.map(r => `<div class="hb"><span class="hb-l">${esc(t(r.bp))}</span>
    <span class="hb-b"><i style="width:${(100 * r.sets / max).toFixed(1)}%;background:${color}"></i></span><span class="hb-v">${r.sets}</span></div>`).join('')}</div>`
}

/* ------------------------------------------------------------- sections -- */

function summaryHTML(rep) {
  const s = rep.summary, u = rep.unit
  const cell = (color, label, value, sub = '') => `<div class="stat" style="--f:${color}"><span class="stat-l">${esc(label)}</span><span class="stat-v">${value}</span>${sub ? `<span class="stat-s">${sub}</span>` : ''}</div>`
  const weight = s.weightFirst && s.weightLast
    ? cell(BODY, t('Body weight'), `${esc(fmtNum(s.weightLast.y))}<small> ${esc(u)}</small>`, esc(signed(s.weightLast.y - s.weightFirst.y, u) + ' · ' + t('since {0}', shortDate(s.weightFirst.d))))
    : cell(BODY, t('Body weight'), '—', esc(t('No weigh-ins in this period')))
  return `<div class="stats">
    ${cell(TRAIN, t('Sessions'), esc(s.sessions), s.plannedDays ? esc(t('{0} of {1} planned days done', s.plannedDone, s.plannedDays)) : '')}
    ${cell(TRAIN, t('Plan adherence'), s.adherence == null ? '—' : esc(pct(s.adherence)))}
    ${cell(STRENGTH, t('Work sets'), esc(s.sets))}
    ${cell(STRENGTH, t('Volume'), `${esc(fmtNum(Math.round(s.volume)))}<small> ${esc(u)}</small>`, esc(t('weight × reps')))}
    ${cell(TRAIN, t('Time trained'), s.timeMs ? esc(fmtDur(s.timeMs)) : '—')}
    ${cell(MOVE, t('Cardio'), `${esc(fmtNum(Math.round(s.cardioMin)))}<small> min</small>`)}
    ${cell(STRENGTH, t('Records (PR)'), esc(s.prs))}
    ${weight}
  </div>`
}

function calendarHTML(rep, ws) {
  const days = rep.days
  // pad the first week back to its first day so columns line up with weekdays
  const lead = (dateOf(days[0].d).getDay() - ws + 7) % 7
  const cells = [...Array(lead).fill(null), ...days]
  while (cells.length % 7) cells.push(null)
  const head = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2026, 0, 4 + ((ws + i) % 7))   // 4 Jan 2026 is a Sunday
    return `<div class="cal-h">${esc(d.toLocaleDateString(dateLocale(), { weekday: 'short' }))}</div>`
  }).join('')
  const mark = { done: t('Trained'), missed: t('Not done'), planned: t('Planned'), rest: '' }
  const body = cells.map(c => {
    if (!c) return '<div class="cal-c out"></div>'
    const names = (c.done.length ? c.done.map(x => x.name) : c.planned.map(x => x.name)).filter(Boolean).join(' + ')
    return `<div class="cal-c ${c.status}">
      <div class="cal-top"><span class="cal-n">${dateOf(c.d).getDate()}${dateOf(c.d).getDate() === 1 || c === days[0] ? ` <span class="cal-mo">${esc(dateOf(c.d).toLocaleDateString(dateLocale(), { month: 'short' }))}</span>` : ''}</span>${c.moved ? `<span class="cal-mv">${esc(t('moved'))}</span>` : ''}</div>
      ${names ? `<div class="cal-r">${esc(names)}</div>` : ''}
      ${mark[c.status] ? `<div class="cal-s">${esc(mark[c.status])}</div>` : ''}
    </div>`
  }).join('')
  return `<div class="cal">${head}${body}</div>
    <p class="note">${esc(t('Planned days follow your current weekly plan plus the days you moved: the app does not keep earlier versions of the weekly plan.'))}</p>`
}

// Each relation variable as a plain noun ("Weeks with more sessions…") and as a threshold phrase
// ("3 or more sessions"), so every sentence reads naturally in English and Spanish alike.
const VAR_NOUN = {
  sessions: () => t('sessions'),
  sets: () => t('work sets'),
  volume: () => t('volume'),
  cardioMin: () => t('minutes of cardio'),
  strengthSessions: () => t('strength-only sessions'),
  cardioSessions: () => t('cardio-only sessions'),
  mixedSessions: () => t('mixed sessions'),
  kcal: () => t('calories eaten'),
  steps: () => t('daily steps'),
  extCardio: () => t('cardio from other apps'),
  protein: () => t('protein eaten'),
}
const routineName = (key, routines) => routines.find(x => x.id === key.slice(8))?.name || t('a routine')
function varNoun(key, routines) {
  if (key.startsWith('routine:')) return t('sessions of "{0}"', routineName(key, routines))
  return (VAR_NOUN[key] || (() => key))()
}
function thresholdText(key, v, unit, routines) {
  const n = fmtNum(Math.round(v))
  if (key.startsWith('routine:')) return t('{0} or more sessions of "{1}"', n, routineName(key, routines))
  return ({
    sessions: () => t('{0} or more sessions', n),
    sets: () => t('{0} or more work sets', n),
    volume: () => t('{0} or more of volume', n + ' ' + unit),
    cardioMin: () => t('{0} or more minutes of cardio', n),
    strengthSessions: () => t('{0} or more strength-only sessions', n),
    cardioSessions: () => t('{0} or more cardio-only sessions', n),
    mixedSessions: () => t('{0} or more mixed sessions', n),
    kcal: () => t('{0} kcal a day or more', n),
    steps: () => t('{0} steps a day or more', n),
    extCardio: () => t('{0} or more minutes of cardio from other apps', n),
    protein: () => t('{0} g of protein a day or more', n),
  }[key] || (() => n))()
}

// One relation block. `kind` is 'weight' (kg/lb, the weekly average weigh-in) or 'fat' (points of
// body-fat %, readings of one method).
function relationBlock(R, routines, kind, unit) {
  const fmtChange = v => kind === 'fat' ? signed(Math.round(v * 10) / 10, t('pts')) : signed(Math.round(v * 10) / 10, unit)
  const findings = R.findings.map(f => {
    const strong = f.strength === 'large'
    const what = varNoun(f.key, routines)
    const head = kind === 'fat'
      ? (f.direction === 'more-loss'
        ? t('Weeks with more {0} were followed by a bigger drop in body fat.', what)
        : t('Weeks with more {0} were followed by a smaller drop in body fat, or a rise.', what))
      : (f.direction === 'more-loss'
        ? t('Weeks with more {0} were followed by a bigger drop in weight.', what)
        : t('Weeks with more {0} were followed by a smaller drop in weight, or a rise.', what))
    const split = f.split ? `<p>${esc(t('Weeks with {0}: {1} on average ({2} weeks). Weeks with fewer: {3} ({4} weeks).',
      thresholdText(f.key, f.split.threshold, unit, routines), fmtChange(f.split.more.change), f.split.more.weeks, fmtChange(f.split.less.change), f.split.less.weeks))}</p>` : ''   // both sides hold MIN_GROUP (3) weeks or more, so "weeks" is always plural
    return `<div class="finding"><span class="badge">${esc(strong ? t('Strong relation') : t('Moderate relation'))}</span><p class="f-h">${esc(head)}</p>${split}</div>`
  }).join('')
  const none = !R.findings.length ? `<div class="callout">${esc(kind === 'fat'
    ? t('No clear relation in these {0} weeks between how you trained and how your body fat changed.', R.weeks)
    : t('No clear relation in these {0} weeks between how you trained and how your weight changed.', R.weeks))}</div>` : ''
  const weak = R.weak.length ? `<p class="note">${esc(t('No clear relation with: {0}.', R.weak.map(k => varNoun(k, routines)).join(', ')))}</p>` : ''
  const food = (R.short || []).filter(k => k === 'kcal' || k === 'protein')
  const short = food.length ? `<p class="note">${esc(t('Not enough food logged to compare: {0}. Each needs {1} weeks with food logged on at least {2} days.', food.map(k => varNoun(k, routines)).join(', '), MIN_WEEKS, FOOD_MIN_DAYS))}</p>` : ''
  return findings + none + weak + short
}

function relationsHTML(rep, routines) {
  const R = rep.relations, F = rep.fatRelations, u = rep.unit
  let out = `<p>${esc(t('Each week of the period is compared with how your average weight, and your body fat when you log it, changed into the following week.'))}</p>`
  out += `<h4>${esc(t('Weight'))}</h4>`
  out += R.enough ? relationBlock(R, routines, 'weight', u)
    : `<div class="callout">${esc(t('Not enough data yet: a relation needs at least {0} weeks with weigh-ins in that week and the next. This period has {1}.', MIN_WEEKS, R.weeks))}</div>`
  out += `<h4 style="margin-top:14px">${esc(t('Body fat'))}${F.method ? ' · ' + esc(t(METHOD_LABEL[F.method] || 'Other')) : ''}</h4>`
  out += F.enough ? relationBlock(F, routines, 'fat', u)
    : `<div class="callout">${esc(t('Not enough body-fat readings yet: a relation needs at least {0} weeks with a reading in that week and the next, all by the same method. This period has {1}.', MIN_WEEKS, F.weeks))}</div>`
  const weeks = Math.max(R.weeks, F.weeks)
  return out + `<p class="note">${esc(t('Based on {0} weeks. These are coincidences in time, not proof of cause: sleep, food, water and stress move the scale too.', weeks))}</p>`
}

const METHOD_LABEL = { scale: 'Smart scale (bioimpedance)', calipers: 'Skinfold calipers', dexa: 'DEXA scan', navy: 'US Navy estimate', other: 'Other' }
const MEASURE_LABEL = { waist: 'Waist', neck: 'Neck', hip: 'Hip', chest: 'Chest', shoulders: 'Shoulders', arm: 'Arm', thigh: 'Thigh', calf: 'Calf' }

function activityHTML(rep) {
  const A = rep.activity
  if (!A.stepDays && !A.sessions) return `<p class="empty">${esc(t('Nothing from Health Connect in this period.'))}</p>`
  const cell = (color, label, value, sub = '') => `<div class="stat" style="--f:${color}"><span class="stat-l">${esc(label)}</span><span class="stat-v">${value}</span>${sub ? `<span class="stat-s">${sub}</span>` : ''}</div>`
  return `<div class="stats">
    ${cell(MOVE, t('Steps'), A.steps != null ? esc(fmtNum(A.steps)) : '—', esc(t('a day, mean of {0} days with a count', A.stepDays)))}
    ${cell(MOVE, t('Cardio from other apps'), `${esc(fmtNum(A.cardioMin))}<small> min</small>`, esc(t('{0} sessions', A.sessions)))}
  </div>`
}

function foodHTML(rep) {
  const F = rep.food
  if (!F.days) return `<p class="empty">${esc(t('No food logged in this period.'))}</p>`
  const cell = (color, label, value, sub = '') => `<div class="stat" style="--f:${color}"><span class="stat-l">${esc(label)}</span><span class="stat-v">${value}</span>${sub ? `<span class="stat-s">${sub}</span>` : ''}</div>`
  return `<div class="stats">
    ${cell(FOOD, t('Calories'), `${esc(fmtNum(F.kcal))}<small> kcal</small>`, esc(t('a day, mean of {0} of {1} days logged', F.days, F.totalDays)))}
    ${cell(FOOD, t('Protein'), `${esc(fmtNum(F.p))}<small> g</small>`, esc(t('a day')))}
    ${cell(FOOD, t('Carbohydrates'), `${esc(fmtNum(F.c))}<small> g</small>`, esc(t('a day')))}
    ${cell(FOOD, t('Fat'), `${esc(fmtNum(F.f))}<small> g</small>`, esc(t('a day')))}
  </div>`
}

function bodyHTML(rep) {
  const B = rep.body, u = rep.unit
  const cell = (color, label, value, sub = '') => `<div class="stat" style="--f:${color}"><span class="stat-l">${esc(label)}</span><span class="stat-v">${value}</span>${sub ? `<span class="stat-s">${sub}</span>` : ''}</div>`
  const r1 = x => Math.round(x * 10) / 10
  const trend = B.trendFirst && B.trendLast
    ? cell(BODY, t('Weight trend'), `${esc(fmtNum(r1(B.trendLast.y)))}<small> ${esc(u)}</small>`, esc(signed(r1(B.trendLast.y - B.trendFirst.y), u) + ' · ' + t('since {0}', shortDate(B.trendFirst.d))))
    : cell(BODY, t('Weight trend'), '—', esc(t('No weigh-ins in this period')))
  const rate = cell(BODY, t('Rate at the end'), B.rate == null ? '—' : `${esc(signed(Math.round(B.rate * 100) / 100, ''))}<small> % ${esc(t('per week'))}</small>`,
    B.rate == null ? '' : esc(signed(Math.round(B.kgPerWeek * 100) / 100, u) + ' ' + t('per week')))
  const fatFirst = B.fat[0], fatLast = B.fat.at(-1)
  const fat = fatLast
    ? cell(BODY, t('Body fat'), `${esc(fmtNum(fatLast.pct))}<small> %</small>`, esc((fatFirst !== fatLast ? signed(r1(fatLast.pct - fatFirst.pct), t('pts')) + ' · ' : '') + t(METHOD_LABEL[fatLast.method] || 'Other')))
    : cell(BODY, t('Body fat'), '—', esc(t('No readings in this period')))
  const lean = fatLast?.lean != null
    ? cell(STRENGTH, t('Lean mass'), `${esc(fmtNum(fatLast.lean))}<small> ${esc(u)}</small>`, fatFirst?.lean != null && fatFirst !== fatLast ? esc(signed(r1(fatLast.lean - fatFirst.lean), u)) : '')
    : cell(STRENGTH, t('Lean mass'), '—', '')
  const rows = Object.entries(B.measures).map(([f, m]) => `<div class="hb"><span class="hb-l">${esc(t(MEASURE_LABEL[f] || f))}</span>
    <span>${esc(fmtNum(m.first.v))} → <b>${esc(fmtNum(m.last.v))} cm</b></span><span class="hb-v">${m.first.d !== m.last.d ? esc(signed(r1(m.change), 'cm')) : ''}</span></div>`).join('')
  return `<div class="stats">${trend}${rate}${fat}${lean}</div>
    ${rows ? `<h4 style="margin-top:14px">${esc(t('Measurements'))}</h4><div class="hbars">${rows}</div>` : ''}
    <p class="note" style="margin-top:10px">${esc(t('Trend: exponentially smoothed average, 10% per weigh-in (J. Walker, The Hacker\'s Diet). Recommended rate when cutting: 0.5–1% of body weight per week (Helms, Aragon & Fitschen, 2014). Navy estimate: Hodgdon & Beckett, 1984.'))}</p>`
}

function setText(entryId, s, unit, speedUnit) {
  const tag = isWarmupRow(s) ? ` <span class="tag">${esc(t('warm-up'))}</span>` : ''
  const effort = s.rir != null ? ` · RIR ${esc(fmtNum(s.rir))}` : s.rpe != null ? ` · RPE ${esc(fmtNum(s.rpe))}` : ''
  if (Number(s.min) > 0 || Number(s.speed) > 0) return `${esc(fmtNum(s.min || 0))} min @ ${esc(fmtSpeed(s.speed || 0, speedUnit))}${tag}`
  if (Number(s.sec) > 0 && !(Number(s.r) > 0)) return `${esc(fmtSec(s.sec))}${Number(s.w) > 0 ? ' · ' + esc(fmtNum(s.w)) + ' ' + esc(unit) : ''}${tag}`
  const one = x => `${esc(fmtNum(Number(x.w) || 0))} ${esc(unit)} × ${esc(fmtNum(Number(x.r) || 0))}`
  let main = isSideSet(s) ? `${esc(t('L'))} ${one(s.sides.L)} / ${esc(t('R'))} ${one(s.sides.R)}` : one(s)
  if (setType(s) === 'dropset') main += ' → ' + dropsOf(s).map(one).join(' → ')
  if (setType(s) === 'restpause') main += ` (${esc(t('rest-pause'))}: ${clustersOf(s).map(c => esc(fmtNum(c.r))).join(' + ')})`
  return main + effort + tag
}

function workoutsHTML(rep, speedUnit) {
  if (!rep.workouts.length) return `<p class="empty">${esc(t('No sessions logged in this period.'))}</p>`
  return rep.workouts.map(w => {
    const meta = [w.durMs ? fmtDur(w.durMs) : null, t('{0} work sets', w.sets), w.volume ? fmtNum(Math.round(w.volume)) + ' ' + rep.unit : null,
      w.cardioMin ? fmtNum(Math.round(w.cardioMin)) + ' min ' + t('cardio') : null, w.prs ? t('{0} PR', w.prs) : null].filter(Boolean).map(esc).join(' · ')
    const exs = w.exercises.map(e => `<div class="wx"><div class="wx-n">${esc(exName(e.id))}${e.sg ? ` <span class="tag">${esc(t('superset'))}</span>` : ''}</div>
      <ol class="wx-s">${e.sets.map(s => `<li>${setText(e.id, s, rep.unit, speedUnit)}</li>`).join('')}</ol>${e.note ? `<div class="wx-note">${esc(e.note)}</div>` : ''}</div>`).join('')
    return `<section class="wo"><div class="wo-h"><h3>${esc(w.name || t('Workout'))}</h3><span class="wo-d">${esc(longDate(w.d))}</span></div>
      <div class="wo-m">${meta}</div>${exs}${w.note ? `<div class="wx-note">${esc(w.note)}</div>` : ''}</section>`
  }).join('')
}

/* ------------------------------------------------------------- document -- */

/** The whole printable document. `S` supplies routines (names), unit and the week start. */
export function periodReportHTML(rep, S, owner) {
  const ws = S.weekStart === 0 ? 0 : 1
  const speedUnit = speedUnitOf(S)
  const weekLabel = k => shortDate(k)
  const title = t('Training report')
  const range = `${longDate(rep.from)} – ${longDate(rep.to)}`
  const lifts = rep.lifts.map(l => {
    const a = l.points[0].y, b = l.points.at(-1).y
    const delta = l.points.length > 1 ? ` (${signed(Math.round((b - a) * 10) / 10, rep.unit)})` : ''
    return `<div class="lift"><h4>${esc(exName(l.id))}</h4>
      <div class="lift-v">${esc(fmtNum(a))} → <b>${esc(fmtNum(b))} ${esc(rep.unit)}</b>${esc(delta)}</div>
      ${lineChart(l.points, STRENGTH, rep.unit, { h: 90, axes: false })}</div>`
  }).join('')
  return `<!doctype html><html lang="${getLang()}" dir="${RTL_LANGS.has(getLang()) ? 'rtl' : 'ltr'}"><head><meta charset="utf-8">
<title>${esc(title)} · ${esc(rep.from)} – ${esc(rep.to)}</title>
<style>
  @font-face { font-family: 'Archivo R'; src: url(${archivoWoff2}) format('woff2'); font-weight: 100 900; font-stretch: 62% 125%; }
  @page { size: A4; margin: 14mm 13mm; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; color: ${INK}; background: #fff; font: 13px/1.45 'Archivo R', system-ui, sans-serif; font-variant-numeric: tabular-nums; }
  .doc { max-width: 760px; margin: 0 auto; }
  header { background: ${TRAIN}; padding: 20px 22px 18px; border-radius: 4px; margin-bottom: 22px; }
  .wm { font-weight: 750; font-stretch: 112%; font-size: 15px; letter-spacing: -.01em; }
  h1 { font-size: 34px; line-height: 1; font-weight: 750; font-stretch: 112%; text-transform: uppercase; letter-spacing: -.01em; margin: 26px 0 8px; }
  .range { font-size: 14px; font-weight: 600; }
  .who { font-size: 12px; margin-top: 2px; }
  h2 { font-size: 19px; font-weight: 700; font-stretch: 112%; margin: 30px 0 12px; padding-top: 10px; border-top: 3px solid ${INK}; break-after: avoid; page-break-after: avoid; }
  h4 { font-size: 13px; font-weight: 650; margin: 0 0 4px; text-transform: capitalize; }
  p { margin: 0 0 8px; }
  .note { font-size: 11.5px; color: #4a5872; }
  .empty { color: #6b7790; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .stat { background: ${SILVER}; border-radius: 4px; overflow: hidden; display: flex; flex-direction: column; padding: 0 10px 10px; break-inside: avoid; }
  .stat::before { content: ''; display: block; height: 6px; margin: 0 -10px 8px; background: var(--f); }
  .stat-l { font-size: 11px; font-weight: 600; }
  .stat-v { font-size: 30px; line-height: 1.05; font-weight: 700; font-stretch: 78%; }
  .stat-v small { font-size: 13px; font-weight: 600; font-stretch: 100%; }
  .stat-s { font-size: 10.5px; color: #4a5872; margin-top: 2px; }
  .cal { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
  .cal-h { font-size: 10.5px; font-weight: 650; text-transform: uppercase; letter-spacing: .05em; padding: 2px 4px; }
  .cal-c { min-height: 62px; border-radius: 3px; padding: 4px 5px; font-size: 10px; line-height: 1.25; background: #fff; border: 1px solid ${RULE}; break-inside: avoid; }
  .cal-c.out { border: 0; background: transparent; }
  .cal-c.done { background: ${TRAIN}; border-color: ${TRAIN}; }
  .cal-c.missed { border: 1.5px solid ${INK}; }
  .cal-c.planned { background: ${SILVER}; }
  .cal-top { display: flex; justify-content: space-between; align-items: baseline; }
  .cal-n { font-size: 13px; font-weight: 700; font-stretch: 78%; }
  .cal-mo { font-size: 9.5px; font-weight: 700; font-stretch: 100%; text-transform: uppercase; }
  .cal-mv { font-size: 8.5px; font-weight: 650; text-transform: uppercase; }
  .cal-r { font-weight: 600; margin-top: 2px; overflow-wrap: anywhere; }
  .cal-s { font-size: 9px; margin-top: 2px; }
  .legend { display: flex; gap: 14px; font-size: 10.5px; margin: 8px 0 4px; }
  .legend i { display: inline-block; width: 11px; height: 11px; vertical-align: -1px; margin-inline-end: 4px; border-radius: 2px; }
  .chart { width: 100%; height: auto; display: block; margin: 4px 0 8px; break-inside: avoid; }
  .chart text { font-family: 'Archivo R', system-ui, sans-serif; fill: ${INK}; }
  .chart .v { font-size: 11px; font-weight: 700; text-anchor: middle; }
  .chart .l, .chart .ax { font-size: 10px; text-anchor: middle; }
  .chart .ax { text-anchor: start; }
  .lifts { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 18px; }
  .lift { break-inside: avoid; }
  .lift-v { font-size: 12px; }
  .lift-v b { font-size: 15px; font-stretch: 78%; }
  .hbars { display: flex; flex-direction: column; gap: 4px; }
  .hb { display: grid; grid-template-columns: 120px 1fr 34px; gap: 8px; align-items: center; font-size: 11.5px; }
  .hb-l { text-transform: capitalize; }
  .hb-b { height: 12px; background: ${SILVER}; }
  .hb-b i { display: block; height: 100%; }
  .hb-v { font-weight: 700; text-align: end; }
  .callout { background: ${SILVER}; border-radius: 4px; padding: 12px 14px; margin: 8px 0; }
  .finding { background: ${SILVER}; border-radius: 4px; padding: 12px 14px; margin: 8px 0; break-inside: avoid; }
  .badge { display: inline-block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; background: ${INK}; color: #fff; padding: 2px 6px; border-radius: 2px; margin-bottom: 6px; }
  .f-h { font-size: 15px; font-weight: 650; }
  .wo { border-top: 1px solid ${RULE}; padding: 10px 0 6px; break-inside: avoid; page-break-inside: avoid; }
  .wo-h { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
  .wo-h h3 { margin: 0; font-size: 15px; font-weight: 700; font-stretch: 112%; text-transform: uppercase; }
  .wo-d { font-size: 11.5px; white-space: nowrap; }
  .wo-m { font-size: 11.5px; color: #4a5872; margin: 2px 0 6px; }
  .wx { display: grid; grid-template-columns: 200px 1fr; gap: 10px; padding: 3px 0; font-size: 11.5px; }
  .wx-n { font-weight: 600; text-transform: capitalize; }
  .wx-s { margin: 0; padding-inline-start: 16px; }
  .wx-note { grid-column: 1 / -1; font-size: 11px; color: #4a5872; font-style: italic; }
  .tag { font-size: 9px; font-weight: 700; text-transform: uppercase; background: ${SILVER}; padding: 1px 4px; border-radius: 2px; }
  footer { margin-top: 28px; padding-top: 8px; border-top: 1px solid ${RULE}; font-size: 10.5px; color: #4a5872; display: flex; justify-content: space-between; }
</style></head>
<body><div class="doc">
  <header><div class="wm">SuperOpenGym</div><h1>${esc(title)}</h1><div class="range">${esc(range)}</div>${owner ? `<div class="who">${esc(owner)}</div>` : ''}</header>

  <h2>${esc(t('Summary'))}</h2>
  ${summaryHTML(rep)}

  <h2>${esc(t('Body composition'))}</h2>
  ${bodyHTML(rep)}

  <h2>${esc(t('Nutrition'))}</h2>
  ${foodHTML(rep)}

  <h2>${esc(t('Activity'))}</h2>
  ${activityHTML(rep)}

  <h2>${esc(t('Plan and sessions, day by day'))}</h2>
  <div class="legend"><span><i style="background:${TRAIN}"></i>${esc(t('Trained'))}</span><span><i style="border:1.5px solid ${INK}"></i>${esc(t('Planned, not done'))}</span><span><i style="background:${SILVER}"></i>${esc(t('Planned, still to come'))}</span></div>
  ${calendarHTML(rep, ws)}

  <h2>${esc(t('Charts'))}</h2>
  <h4>${esc(t('Volume per week'))} (${esc(rep.unit)})</h4>
  ${barChart(rep.weeks.map(w => ({ label: weekLabel(w.week), v: Math.round(w.vars.volume) })), STRENGTH, v => fmtNum(v))}
  <h4>${esc(t('Sessions per week'))}</h4>
  ${barChart(rep.weeks.map(w => ({ label: weekLabel(w.week), v: w.vars.sessions })), TRAIN, v => fmtNum(v))}
  <h4>${esc(t('Work sets per muscle group'))}</h4>
  ${hbars(rep.bodyParts, STRENGTH)}
  <h4 style="margin-top:14px">${esc(t('Weight trend'))} (${esc(rep.unit)})</h4>
  ${lineChart(rep.body.trend, BODY, rep.unit, { goal: S.targetW ?? null })}
  ${rep.lifts.length ? `<h4 style="margin-top:6px">${esc(t('Estimated 1RM of your most trained exercises'))} (${esc(rep.unit)})</h4><div class="lifts">${lifts}</div>` : ''}

  <h2>${esc(t('Training and weight change'))}</h2>
  ${relationsHTML(rep, S.routines || [])}

  <h2>${esc(t('Every session in detail'))}</h2>
  ${workoutsHTML(rep, speedUnit)}

  <footer><span>${esc(t('Made with SuperOpenGym, based on openGym'))}</span><span>${esc(new Date().toLocaleDateString(dateLocale()))}</span></footer>
</div></body></html>`
}
