import { uid } from './format.js'
import { defaultConfig, isBw, modeOf } from './history.js'
import { isAssisted, isBodyweightEq, isCardio } from './exercises.js'
import { sessionsFor } from './progression.js'

/**
 * Create a deep copy of a routine with a new id and a "(Copy)" suffix.
 * All exercises and their configuration are preserved independently.
 */
export function copyRoutine(routine, suffix = 'Copy') {
  const copy = structuredClone(routine)
  copy.id = uid()
  // "Push (Copy)" copied again becomes "Push (Copy 2)", not "Push (Copy) (Copy)".
  const esc = suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = new RegExp('^(.*) \\(' + esc + '(?: (\\d+))?\\)$').exec(routine.name || '')
  copy.name = m ? m[1] + ' (' + suffix + ' ' + ((Number(m[2]) || 1) + 1) + ')' : routine.name + ' (' + suffix + ')'
  return copy
}

/**
 * Delete a routine and every pointer to it, in place on a store draft. A weekday holds a list of
 * routine ids, so the deleted one is pulled from each day and the key dropped when it empties
 * (never store []); a day that never named it is left exactly as it was. A per-date reschedule
 * (dayPlan) naming it goes too: left behind, the day still counts as overridden and wears a
 * "rescheduled" badge for good with no way to clear it.
 *
 * Plan's swipe, RoutineEdit's button and the Coach's remove-routine all delete through here, so
 * the next thing that learns to point at a routine is cleaned up in one place, not three.
 * Returns the dropped dayPlan entries ({ iso: id }), which the Coach records so a revert can put
 * them back.
 */
export function deleteRoutine(s, id) {
  s.routines = s.routines.filter(r => r.id !== id)
  Object.keys(s.week || {}).forEach(d => {
    const ids = [].concat(s.week[d])
    if (!ids.includes(id)) return
    const next = ids.filter(rid => rid !== id)
    if (next.length) s.week[d] = next; else delete s.week[d]
  })
  const dropped = {}
  Object.keys(s.dayPlan || {}).forEach(iso => {
    if (s.dayPlan[iso] === id) { dropped[iso] = id; delete s.dayPlan[iso] }
  })
  return dropped
}

/**
 * A routine slot with another exercise in it (#110): the machine you planned around is gone, or
 * a variation takes over the lift for a block. The slot keeps its place and what was set up for
 * it — sets, reps, weight, rest, warm-ups, the progression rule, the note, its superset — and only
 * the exercise changes. The old way (remove, add, configure again) lost all of that.
 *
 * Some things cannot come along. A cardio slot is minutes at a speed and a lifting slot is sets
 * of reps at a load, so between the two only the note, the rest and the superset carry over and
 * the rest starts from the new exercise's defaults. A load means something else once the new
 * exercise is bodyweight where the old one was not, or the other way round: 60 kg on a bench is
 * not 60 kg added to a push-up. The same goes for an assistance machine, where the number is
 * help rather than load: 40 kg off a pull-up is not 40 kg on a pulldown. There the weight goes
 * back to 0. The bodyweight, assisted and per-side flags describe the movement, not the
 * prescription, so they are dropped and the new exercise follows its own, the way the Coach's
 * swap does (lib/coach.js): a split squat's "per side" would split a back squat's reps into L/R.
 *
 * What is not carried is history. Progress belongs to a routine and an exercise together (#216),
 * so the new exercise starts on its own line — its own sessions in this routine, and until there
 * are any, the slot's numbers — and the old exercise keeps its sessions, ready if it comes back.
 * That is also why the old exercise's weight gives way to the new one's own wherever the new one
 * has been logged (`S`, and the routine `rid` the slot is in): the next session reads a slot
 * weight that differs from the one its last session was planned at as a deliberate edit, and
 * opens there (#275, nextPrescription). An 80 kg barbell bench carried onto dumbbells trained at
 * 30 would open the dumbbells at 80 — and only when the two rep schemes differed, because a
 * plan whose sets and reps match just carries on. With the new exercise's own planned weight in
 * the slot, its history decides either way. One never logged keeps the slot's weight, since
 * there is nothing better to start from.
 *
 * Picking the exercise that is already in the slot replaces nothing, and changes nothing.
 */
export function replaceSlotExercise(slot, id, S, rid) {
  const old = slot || {}
  if (old.id === id) return { ...old }
  if ((modeOf(old) === 'cardio') !== isCardio(id)) {
    const kept = ['sg', 'note', 'restSec', 'alt'].filter(key => old[key] != null)
    return setSlotAlternatives({ id, ...defaultConfig(id), ...Object.fromEntries(kept.map(key => [key, old[key]])) }, old.alt)
  }
  const { id: _replaced, bodyweight: _flag, assisted: _assisted, side: _side, ...carried } = old
  // Alternatives belong to the slot, so they stay — minus the exercise that now fills it.
  const out = setSlotAlternatives({ id, ...carried }, old.alt)
  if (isCardio(id)) return out
  if (isBw(old) !== isBodyweightEq(id)) {
    out.weight = 0
    // A rep ceiling belongs to bodyweight work: it adds sets where there is no load to add.
    delete out.repsMax
  }
  if (isAssisted(old) !== isAssisted(id)) out.weight = 0
  // The session the next prescription will read for this slot (nextPrescription), so the weight
  // put here is the one that session was planned at: the restart rule then sees no edit and
  // holds at what was lifted, or the plan carries on from it. A session saved before plans were
  // stamped has no planned weight, and what was lifted in it is the nearest thing.
  const mode = modeOf(out)
  const last = S ? sessionsFor(S, id, out, rid).filter(s => s.mode === mode).at(-1) : null
  if (last) out.weight = last.planned?.weight ?? last.weight ?? 0
  return out
}

// How many alternatives one slot keeps. A handful covers "the machine is taken" and "I fancy
// the other one today"; past that it is a second routine.
export const MAX_ALTERNATIVES = 6

/**
 * A slot's alternatives, tidied: ids only, each once, never the slot's own exercise, only the
 * ones `known` accepts (an exercise deleted or not shipped any more), at most MAX_ALTERNATIVES.
 * Returns [] for anything that is not a list, so callers can drop the field when it is empty.
 */
export function cleanAlternatives(list, slotId, known = () => true) {
  if (!Array.isArray(list)) return []
  const out = []
  for (const id of list) {
    if (typeof id !== 'string' || !id || id === slotId || out.includes(id) || !known(id)) continue
    out.push(id)
    if (out.length === MAX_ALTERNATIVES) break
  }
  return out
}

/** Set a slot's alternatives in place: written only when there are any, so a plan keeps its shape. */
export function setSlotAlternatives(slot, list, known) {
  const alt = cleanAlternatives(list, slot.id, known)
  if (alt.length) slot.alt = alt
  else delete slot.alt
  return slot
}

/**
 * What a workout entry can be swapped to from its routine's plan: the slot's planned exercise
 * and its alternatives, minus the exercise the entry holds now. The slot is found by the entry's
 * exercise being either the slot's own or one of its alternatives — so after a swap the original
 * is offered back. Returns { index, ids } (index of the slot in the routine), or null when the
 * routine has no slot for it or nothing to offer.
 */
export function slotAlternatives(routine, exId) {
  const ex = Array.isArray(routine?.ex) ? routine.ex : []
  let index = ex.findIndex(s => s?.id === exId)
  if (index < 0) index = ex.findIndex(s => Array.isArray(s?.alt) && s.alt.includes(exId))
  if (index < 0) return null
  const slot = ex[index]
  const ids = [slot.id, ...cleanAlternatives(slot.alt, slot.id)].filter(id => id !== exId)
  return ids.length ? { index, ids } : null
}
