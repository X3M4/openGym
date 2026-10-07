import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { t, dateLocale } from '../lib/i18n.js'
import { fmtNum, todayISO, uid } from '../lib/format.js'
import { confirmSheet } from '../sheets.jsx'
import { MOBILE } from '../lib/mobile.js'
import { targets, dayTotals, portion, MEALS, PAL, PROTEIN_RANGE, FAT_RANGE, ADAPT_MIN_DAYS, ADAPT_WINDOW } from '../lib/nutrition.js'
import { searchFoods, productByCode, OffLimitError } from '../lib/off.js'
import Icon from '../components/Icon.jsx'
import { Button, Row, NumberField, CommitNumberField, Segmented, TextField } from '../components/ui.jsx'

// Nutrition (SuperOpenGym Phase 6): the day's log against targets worked out from the profile
// (lib/nutrition.js), foods of your own and from Open Food Facts (lib/off.js), saved meals.

const MEAL_LABEL = { breakfast: 'Breakfast', midmorning: 'Mid-morning', lunch: 'Lunch', snack: 'Afternoon snack', dinner: 'Dinner' }
const MISSING_LABEL = { sex: 'sex', height: 'height', age: 'year of birth', activity: 'activity level', weight: 'a weigh-in', bodyfat: 'a body-fat reading (for protein on lean mass)' }
const ACTIVITY_LABEL = { sedentary: 'Sedentary or light', active: 'Active', vigorous: 'Vigorous' }
const r1 = v => Math.round(v * 10) / 10
// two decimals where one would misstate the number (PAL 1.85, a 0.75% rate)
const fmt2 = v => Number(v).toLocaleString(dateLocale(), { maximumFractionDigits: 2 })
const dateOf = iso => new Date(iso + 'T12:00:00')
const shift = (iso, n) => { const d = dateOf(iso); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }
const live = xs => (xs || []).filter(e => e && !e.deleted)
const ui = () => useUI.getState()
const update = (...a) => useStore.getState().update(...a)

function Meter({ label, value, target, unit }) {
  const pct = target ? Math.min(100, (value / target) * 100) : 0
  return <div className="nmeter">
    <div className="nmeter-h"><span>{label}</span><span><b>{fmtNum(value)}</b>{target ? ` / ${fmtNum(target)}` : ''} {unit}</span></div>
    <div className="nmeter-b"><i style={{ width: pct + '%' }} /></div>
  </div>
}

export default function Nutrition() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const today = todayISO()
  const [d, setD] = useState(today)
  const T = targets(S, today)
  const day = dayTotals(S.foodLog, d)
  const left = T.kcal != null ? T.kcal - day.kcal : null
  const label = d === today ? t('Today') : dateOf(d).toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long' })

  return <div className="narrow">
    <div className="hdr">
      <div><h1>{t('Nutrition')}</h1><div className="sub">{t('What you eat against your targets')}</div></div>
      <button className="iconbtn" onClick={() => nav(-1)} aria-label={t('Back')}><Icon name="chevronLeft" /></button>
    </div>

    <section className="dfield dfield-food dfield-band" aria-label={t('Nutrition')}>
      <div className="nday">
        <button className="iconbtn" onClick={() => setD(shift(d, -1))} aria-label={t('Previous day')}><Icon name="chevronLeft" /></button>
        <span className="nday-l">{label}</span>
        <button className="iconbtn" disabled={d >= today} onClick={() => setD(shift(d, 1))} aria-label={t('Next day')}><Icon name="chevronRight" /></button>
      </div>
      <div className="dfield-weight"><span className="num-xl">{fmtNum(day.kcal)}</span><span className="dfield-unit">{T.kcal != null ? `/ ${fmtNum(T.kcal)} kcal` : 'kcal'}</span></div>
      {left != null && <div className="dfield-rate">{left >= 0 ? t('{0} kcal left', fmtNum(left)) : t('{0} kcal over', fmtNum(-left))}</div>}
      <div className="nmeters">
        <Meter label={t('Protein')} value={day.p} target={T.protein} unit="g" />
        <Meter label={t('Carbohydrates')} value={day.c} target={T.carbs} unit="g" />
        <Meter label={t('Fat')} value={day.f} target={T.fat} unit="g" />
      </div>
    </section>

    {MEALS.map(m => <MealBlock key={m} meal={m} d={d} items={day.items.filter(e => (e.meal || 'snack') === m)} />)}

    <TargetsCard T={T} />
    <p className="small muted" style={{ margin: '4px 2px 18px' }}>{t('Foods marked OFF come from Open Food Facts (openfoodfacts.org), data under the Open Database License.')}</p>
  </div>
}

function MealBlock({ meal, d, items }) {
  const kcal = items.reduce((n, e) => n + (Number(e.kcal) || 0), 0)
  const saveMeal = () => {
    const S = useStore.getState().S
    const name = `${t(MEAL_LABEL[meal])} ${dateOf(d).toLocaleDateString(dateLocale(), { day: 'numeric', month: 'short' })}`
    const foods = live(S.foods)
    const entries = items.map(e => ({ foodId: e.foodId && foods.some(f => f.id === e.foodId) ? e.foodId : null, name: e.name, g: e.g, kcal: e.kcal, p: e.p, c: e.c, f: e.f }))
    update(s => { s.meals = [...(s.meals || []), { id: uid(), t: Date.now(), name, items: entries }] })
    ui().toast(t('Meal saved as "{0}"', name))
  }
  return <div className="card nmeal">
    <div className="row between">
      <h2 style={{ margin: 0 }}>{t(MEAL_LABEL[meal])}</h2>
      <span className="small"><b>{fmtNum(kcal)}</b> kcal</span>
    </div>
    {items.length > 0 && <div className="body-list">
      {items.map(e => <div key={e.id} className="body-row">
        <span className="br-d">{fmtNum(e.g)} g</span>
        <span className="br-m">{e.name}{e.source === 'off' ? <span className="tag nocap" style={{ marginInlineStart: 6 }}>OFF</span> : null}</span>
        <span className="br-v"><b>{fmtNum(e.kcal)} kcal</b><small>{fmtNum(e.p)} g {t('protein')}</small></span>
        <button className="linkbtn" aria-label={t('Delete')} onClick={() => update(s => { s.foodLog = (s.foodLog || []).map(x => x?.id === e.id ? { id: e.id, deleted: true, t: Date.now() } : x) })}><Icon name="trash" /></button>
      </div>)}
    </div>}
    <div className="row" style={{ gap: 8, marginTop: 10 }}>
      <Button size="sm" icon="plus" onClick={() => addFoodSheet(meal, d)}>{t('Add')}</Button>
      {items.length > 1 && <Button size="sm" variant="ghost" onClick={saveMeal}>{t('Save as meal')}</Button>}
    </div>
  </div>
}

/* ----------------------------------------------------------------- targets -- */

function TargetsCard({ T }) {
  const S = useStore(s => s.S)
  const N = T.settings, P = S.profile || {}
  const setN = patch => update(s => { s.nutrition = { ...(s.nutrition || {}), ...patch } })
  const setP = patch => update(s => { s.profile = { ...(s.profile || {}), ...patch } })
  const fromText = {
    adaptive: t('From what you ate and how your trend moved over the last {0} days: {1} kcal a day eaten, {2} kg trend change.', ADAPT_WINDOW, fmtNum(T.adaptive.intake ?? 0), fmtNum(T.adaptive.changeKg ?? 0)),
    formula: t('Mifflin–St Jeor resting energy {0} kcal × activity {1}.', fmtNum(T.bmr ?? 0), fmt2(PAL[P.activity] ?? 0)),
    manual: t('Set by you.'),
  }
  return <div className="card">
    <h2>{t('Targets')}</h2>
    {T.missing.length > 0 && <div className="callout-s">{t('To work out your targets the app still needs: {0}.', T.missing.map(k => t(MISSING_LABEL[k])).join(', '))}</div>}
    <div className="ntargets">
      <div><span className="measure-l">{t('Calories')}</span><span className="num-m">{T.kcal != null ? fmtNum(T.kcal) : '—'}<small> kcal</small></span></div>
      <div><span className="measure-l">{t('Protein')}</span><span className="num-m">{T.protein != null ? fmtNum(T.protein) : '—'}<small> g</small></span></div>
      <div><span className="measure-l">{t('Fat')}</span><span className="num-m">{T.fat != null ? fmtNum(T.fat) : '—'}<small> g</small></span></div>
      <div><span className="measure-l">{t('Carbohydrates')}</span><span className="num-m">{T.carbs != null ? fmtNum(T.carbs) : '—'}<small> g</small></span></div>
    </div>
    {T.kcalFrom && <p className="small">{fromText[T.kcalFrom]}{T.deficit ? ' ' + t('Minus {0} kcal a day for a loss of {1}% of body weight a week.', fmtNum(T.deficit), fmt2(N.ratePct)) : ''}</p>}
    {N.mode === 'adaptive' && T.adaptive.tdee == null && <p className="small muted">{t('The adaptive estimate starts after {0} days with food logged in the last {1}; until then the formula is used. Days logged: {2}.', ADAPT_MIN_DAYS, ADAPT_WINDOW, T.adaptive.days ?? 0)}</p>}
    {T.proteinFrom === 'lean' && <p className="small">{t('Protein: {0} g per kg of lean mass ({1} kg).', fmt2(N.protPerKgLean), fmtNum(T.leanKg))}</p>}

    <div className="sect-t" style={{ marginTop: 14 }}>{t('How calories are set')}</div>
    <Segmented value={N.mode} onChange={v => setN({ mode: v })}
      options={[{ value: 'adaptive', label: t('Adaptive') }, { value: 'formula', label: t('Formula') }, { value: 'manual', label: t('Manual') }]} />
    {N.mode === 'manual' ? <>
      <Row title={t('Calories (kcal)')}><CommitNumberField className="body-num" value={N.manualKcal ?? null} decimal={false} onCommit={v => setN({ manualKcal: v > 0 ? Math.round(v) : null })} /></Row>
      <Row title={t('Protein (g)')}><CommitNumberField className="body-num" value={N.manualProtein ?? null} decimal={false} onCommit={v => setN({ manualProtein: v > 0 ? Math.round(v) : null })} /></Row>
    </> : <>
      <Row title={t('Year of birth')}><CommitNumberField className="body-num" value={P.birthYear ?? null} decimal={false}
        onCommit={v => setP({ birthYear: v > 1900 && v <= new Date().getFullYear() - 10 ? Math.round(v) : (v == null ? null : P.birthYear ?? null) })} /></Row>
      <div className="sect-t" style={{ marginTop: 10 }}>{t('Activity level')}</div>
      <Segmented value={P.activity || null} onChange={v => setP({ activity: v })}
        options={Object.keys(PAL).map(k => ({ value: k, label: t(ACTIVITY_LABEL[k]) }))} />
      <Row title={t('Protein per kg of lean mass')} subtitle={t('Range {0}–{1} g', fmtNum(PROTEIN_RANGE.low), fmtNum(PROTEIN_RANGE.high))}>
        <CommitNumberField className="body-num" value={N.protPerKgLean} onCommit={v => setN({ protPerKgLean: v == null ? N.protPerKgLean : Math.min(PROTEIN_RANGE.high, Math.max(PROTEIN_RANGE.low, r1(v))) })} /></Row>
      <Row title={t('Fat, % of calories')} subtitle={t('Range {0}–{1} %', FAT_RANGE.low, FAT_RANGE.high)}>
        <CommitNumberField className="body-num" value={N.fatPct} decimal={false} onCommit={v => setN({ fatPct: v == null ? N.fatPct : Math.min(FAT_RANGE.high, Math.max(FAT_RANGE.low, Math.round(v))) })} /></Row>
      <Row title={t('Loss aimed at, % of body weight a week')} subtitle={t('Range 0.5–1 %')}>
        <CommitNumberField className="body-num" value={N.ratePct} onCommit={v => setN({ ratePct: v == null ? N.ratePct : Math.min(1, Math.max(0.5, Math.round(v * 100) / 100)) })} /></Row>
      <p className="small muted" style={{ marginTop: 8 }}>{t('Height and sex are set in Body. Sources: resting energy, Mifflin–St Jeor (1990); activity levels, FAO/WHO/UNU (2001), each band\'s midpoint; about 7700 kcal per kg lost, an approximation that overstates the deficit for lean people (Hall, 2008); protein 2.3–3.1 g/kg of lean mass and fat 15–30% of calories, Helms, Aragon & Fitschen (2014).')}</p>
    </>}
  </div>
}

/* ---------------------------------------------------------------- add food -- */

function AmountStep({ food, meal, d, onDone, onBack }) {
  const [g, setG] = useState(food.servingG || 100)
  const p = portion(food, g)
  const add = () => {
    if (!(g > 0)) return
    update(s => {
      let foodId = food.id
      if (!foodId) {
        // an Open Food Facts product joins your foods the first time it is logged
        const same = live(s.foods).find(f => f.code && f.code === food.code)
        if (same) foodId = same.id
        else { foodId = uid(); s.foods = [...(s.foods || []), { ...food, id: foodId, t: Date.now() }] }
      }
      s.foodLog = [...(s.foodLog || []), { id: uid(), t: Date.now(), d, meal, foodId, name: food.name, source: food.source || 'own', g, ...p }]
    })
    onDone()
  }
  return <>
    <button className="linkbtn" style={{ fontSize: 15 }} onClick={onBack}><Icon name="chevronLeft" /> {t('Back')}</button>
    <h3 style={{ marginTop: 6 }}>{food.name}</h3>
    <div className="small muted">{food.brand ? food.brand + ' · ' : ''}{t('per 100 g')}: {fmtNum(food.per100.kcal)} kcal · {fmtNum(food.per100.p)} g {t('protein')}{food.source === 'off' ? ' · Open Food Facts' : ''}</div>
    <Row title={t('Amount (g)')}><NumberField className="body-num" value={g} onChange={v => setG(v > 0 ? v : 0)} /></Row>
    <div className="chips" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '8px 0' }}>
      {[food.servingG, 50, 100, 150, 200].filter((v, i, a) => v > 0 && a.indexOf(v) === i).map(v => <button key={v} className={'chip nocap' + (g === v ? ' on' : '')} onClick={() => setG(v)}>{fmtNum(v)} g{v === food.servingG ? ' · ' + t('serving') : ''}</button>)}
    </div>
    <div className="ntargets" style={{ margin: '10px 0' }}>
      <div><span className="measure-l">kcal</span><span className="num-m">{fmtNum(p.kcal)}</span></div>
      <div><span className="measure-l">{t('Protein')}</span><span className="num-m">{fmtNum(p.p)}<small> g</small></span></div>
      <div><span className="measure-l">{t('Carbs')}</span><span className="num-m">{fmtNum(p.c)}<small> g</small></span></div>
      <div><span className="measure-l">{t('Fat')}</span><span className="num-m">{fmtNum(p.f)}<small> g</small></span></div>
    </div>
    <Button variant="primary" disabled={!(g > 0)} onClick={add}>{t('Add to {0}', t(MEAL_LABEL[meal]).toLowerCase())}</Button>
  </>
}

function FoodRow({ food, onPick, onDelete }) {
  return <div className="body-row" style={{ cursor: 'pointer' }} onClick={() => onPick(food)}>
    <span className="br-d">{fmtNum(food.per100.kcal)}<small> kcal</small></span>
    <span className="br-m"><b style={{ color: 'var(--label)' }}>{food.name}</b>{food.brand ? ' · ' + food.brand : ''}{food.source === 'off' ? <span className="tag nocap" style={{ marginInlineStart: 6 }}>OFF</span> : null}</span>
    <span className="br-v"><small>{fmtNum(food.per100.p)} g {t('protein')}</small></span>
    {onDelete ? <button className="linkbtn" aria-label={t('Delete')} onClick={e => { e.stopPropagation(); onDelete(food) }}><Icon name="trash" /></button> : <span />}
  </div>
}

function AddFood({ meal, d, close }) {
  const S = useStore(s => s.S)
  const [tab, setTab] = useState('mine')
  const [picked, setPicked] = useState(null)
  const [q, setQ] = useState('')
  const [results, setResults] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [newCode, setNewCode] = useState('')
  const done = () => { close(); ui().toast(t('Food added')) }
  if (picked) return <AmountStep food={picked} meal={meal} d={d} onDone={done} onBack={() => setPicked(null)} />

  const mine = live(S.foods).filter(f => !q || (f.name + ' ' + (f.brand || '')).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))
  const offError = e => setMsg(e instanceof OffLimitError ? t('Open Food Facts allows a few searches a minute: try again in {0} s.', e.waitSec) : t('Open Food Facts could not be reached. Are you online?'))
  const search = async () => {
    setBusy(true); setMsg(''); setResults(null)
    try { setResults(await searchFoods(q)) } catch (e) { offError(e) }
    setBusy(false)
  }
  const scan = async () => {
    setMsg('')
    try {
      const { scanCode } = await import('../lib/scan.js')
      const code = await scanCode()
      if (!code) return
      const own = live(S.foods).find(f => f.code === code.value)
      if (own) { setPicked(own); return }
      setBusy(true)
      const food = await productByCode(code.value)
      setBusy(false)
      if (food) setPicked(food)
      else { setTab('new'); setMsg(t('Barcode {0} is not in Open Food Facts: create the food and it will be found next time.', code.value)); setNewCode(code.value) }
    } catch (e) { setBusy(false); if (e instanceof OffLimitError || /off-http|fetch/i.test(String(e?.message))) offError(e); else setMsg(t('The scanner could not start.')) }
  }
  const tabs = [{ value: 'mine', label: t('Mine') }, { value: 'search', label: 'OFF' }, ...(MOBILE ? [{ value: 'scan', label: t('Scan') }] : []), { value: 'new', label: t('New') }, { value: 'meals', label: t('Meals') }]
  return <>
    <h3>{t('Add to {0}', t(MEAL_LABEL[meal]).toLowerCase())}</h3>
    <Segmented value={tab} onChange={v => { setTab(v); setMsg('') }} options={tabs} />
    <div style={{ height: 10 }} />
    {msg && <div className="callout-s">{msg}</div>}
    {tab === 'mine' && <>
      <TextField placeholder={t('Search your foods')} value={q} onChange={e => setQ(e.target.value)} />
      {mine.length ? <div className="body-list">{mine.slice(0, 50).map(f => <FoodRow key={f.id} food={f} onPick={setPicked}
        onDelete={food => confirmSheet({ title: t('Delete this food?'), message: t('Days already logged keep it.'), confirmText: t('Delete'), danger: true,
          onConfirm: () => update(s => { s.foods = (s.foods || []).map(x => x?.id === food.id ? { id: food.id, deleted: true, t: Date.now() } : x) }) })} />)}</div>
        : <p className="small muted" style={{ marginTop: 10 }}>{t('Your foods appear here: the ones you create and every Open Food Facts product you log.')}</p>}
    </>}
    {tab === 'search' && <>
      <div className="row" style={{ gap: 8 }}>
        <TextField placeholder={t('e.g. greek yogurt, oats')} value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') search() }} />
        <Button size="sm" variant="primary" disabled={busy || q.trim().length < 2} onClick={search}>{t('Search')}</Button>
      </div>
      {busy && <p className="small muted">{t('Searching…')}</p>}
      {results && (results.length ? <div className="body-list">{results.map((f, i) => <FoodRow key={(f.code || '') + i} food={f} onPick={setPicked} />)}</div>
        : <p className="small muted">{t('No products with energy values found.')}</p>)}
      <p className="small muted" style={{ marginTop: 10 }}>{t('Searches go to Open Food Facts when you tap Search, a few per minute at most.')}</p>
    </>}
    {tab === 'scan' && <>
      <Button variant="primary" icon="qr" disabled={busy} onClick={scan}>{busy ? t('Looking up…') : t('Scan a barcode')}</Button>
      <p className="small muted" style={{ marginTop: 10 }}>{t('Your own foods with that barcode are found first; otherwise Open Food Facts is asked.')}</p>
    </>}
    {tab === 'new' && <NewFood code={newCode} onSaved={setPicked} />}
    {tab === 'meals' && <SavedMeals meal={meal} d={d} close={close} />}
  </>
}

function NewFood({ code, onSaved }) {
  const [f, setF] = useState({ name: '', brand: '', kcal: null, p: null, c: null, fat: null, servingG: null })
  const ok = f.name.trim() && f.kcal >= 0 && f.kcal != null
  const save = () => {
    if (!ok) return
    const food = { id: uid(), t: Date.now(), name: f.name.trim(), brand: f.brand.trim(), code: code || null, source: 'own',
      per100: { kcal: f.kcal, p: f.p || 0, c: f.c || 0, f: f.fat || 0 }, servingG: f.servingG || null }
    update(s => { s.foods = [...(s.foods || []), food] })
    onSaved(food)
  }
  const num = (k, label) => <Row title={label}><NumberField className="body-num" value={f[k]} nullable onChange={v => setF(x => ({ ...x, [k]: v >= 0 ? v : null }))} /></Row>
  return <>
    <TextField placeholder={t('Name')} value={f.name} onChange={e => setF(x => ({ ...x, name: e.target.value }))} />
    <div style={{ height: 8 }} />
    <TextField placeholder={t('Brand (optional)')} value={f.brand} onChange={e => setF(x => ({ ...x, brand: e.target.value }))} />
    <div className="sect-t" style={{ marginTop: 12 }}>{t('Per 100 g, as on the label')}</div>
    {num('kcal', t('Energy (kcal)'))}{num('p', t('Protein (g)'))}{num('c', t('Carbohydrates (g)'))}{num('fat', t('Fat (g)'))}
    {num('servingG', t('Serving (g, optional)'))}
    {code && <p className="small muted">{t('Barcode')}: {code}</p>}
    <div style={{ height: 12 }} />
    <Button variant="primary" disabled={!ok} onClick={save}>{t('Save and choose amount')}</Button>
  </>
}

function SavedMeals({ meal, d, close }) {
  const S = useStore(s => s.S)
  const meals = live(S.meals)
  const add = m => {
    update(s => { s.foodLog = [...(s.foodLog || []), ...m.items.map(it => ({ id: uid(), t: Date.now(), d, meal, foodId: it.foodId || null, name: it.name, g: it.g, kcal: it.kcal, p: it.p, c: it.c, f: it.f }))] })
    close(); ui().toast(t('Meal added'))
  }
  if (!meals.length) return <p className="small muted">{t('Log a meal with two or more foods and tap "Save as meal" to reuse it here in one tap.')}</p>
  return <div className="body-list">{meals.map(m => <div key={m.id} className="body-row" style={{ cursor: 'pointer' }} onClick={() => add(m)}>
    <span className="br-d">{fmtNum(m.items.reduce((n, i) => n + (i.kcal || 0), 0))}<small> kcal</small></span>
    <span className="br-m"><b style={{ color: 'var(--label)' }}>{m.name}</b> · {m.items.map(i => i.name).join(', ')}</span>
    <span />
    <button className="linkbtn" aria-label={t('Delete')} onClick={e => { e.stopPropagation(); update(s => { s.meals = (s.meals || []).map(x => x?.id === m.id ? { id: m.id, deleted: true, t: Date.now() } : x) }) }}><Icon name="trash" /></button>
  </div>)}</div>
}

export const addFoodSheet = (meal, d) => ui().openSheet(close => <AddFood meal={meal} d={d} close={close} />)
