// Home's domain field (views/Home.jsx): which field today shows, and what it can truthfully say.

// What the field at the top of Home is about right now: a session in progress, one due today,
// or — when there is none to do — the body. 
export function fieldKind(S, todayRoutines, doneToday) {
  if (S.active) return 'active'
  if (todayRoutines.some(r => r.ex.length) && !doneToday) return 'train'
  return 'body'
}

// Median length, in minutes, of the finished sessions of these routines — only from sessions
// that recorded a start and an end. Null when there is nothing to go on: the field then says
// nothing about time rather than guess.
export function typicalMinutes(workouts, routineIds) {
  const ids = new Set(routineIds)
  const mins = workouts
    .filter(w => (w.routineIds || [w.routineId]).some(id => ids.has(id)) && w.start && w.end && w.end > w.start)
    .map(w => (w.end - w.start) / 60000)
    .filter(m => m >= 5 && m <= 300)
    .sort((a, b) => a - b)
  if (!mins.length) return null
  const mid = Math.floor(mins.length / 2)
  return Math.round(mins.length % 2 ? mins[mid] : (mins[mid - 1] + mins[mid]) / 2)
}
