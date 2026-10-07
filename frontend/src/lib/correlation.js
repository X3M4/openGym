// Week-by-week relations between training and the change in body weight, for the period report
// (lib/period-report.js). Read in plain words, never as a formula: the reader should understand
// what happened in their own weeks without knowing what a coefficient is.
//
// The coefficient is Pearson's r. Its strength is named with Cohen's conventional thresholds for
// a correlation — 0.1 small, 0.3 medium, 0.5 large (J. Cohen, Statistical Power Analysis for the
// Behavioral Sciences, 2nd ed., 1988) — and only medium and large ones are reported as relations.
// Below MIN_WEEKS paired weeks nothing is concluded at all: with a handful of points a strong r is
// mostly chance. Every finding is a coincidence in time, not a cause, and the report says so.

export const MIN_WEEKS = 8
// A relation that rests on one or two odd weeks is not one: each side of the plain-words split
// needs at least this many weeks, or the variable is listed with the unclear ones.
export const MIN_GROUP = 3
export const COHEN = { small: 0.1, medium: 0.3, large: 0.5 }

/** Pearson's r of two equal-length number arrays; null when either side does not vary. */
export function pearson(xs, ys) {
  const n = Math.min(xs.length, ys.length)
  if (n < 2) return null
  let mx = 0, my = 0
  for (let i = 0; i < n; i++) { mx += xs[i]; my += ys[i] }
  mx /= n; my /= n
  let sxy = 0, sxx = 0, syy = 0
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx, dy = ys[i] - my
    sxy += dx * dy; sxx += dx * dx; syy += dy * dy
  }
  if (sxx === 0 || syy === 0) return null
  return sxy / Math.sqrt(sxx * syy)
}

/** 'large' | 'medium' | 'small' | 'none', from |r| and Cohen's thresholds. */
export function strengthOf(r) {
  const a = Math.abs(r ?? 0)
  return a >= COHEN.large ? 'large' : a >= COHEN.medium ? 'medium' : a >= COHEN.small ? 'small' : 'none'
}

const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length

/**
 * The weeks split at the variable's median into "more" and "less", with the average weight change
 * of each group — the sentence a reader can check against their own memory of those weeks.
 * `threshold` is the smallest value counted as "more". Null when the split leaves a group empty.
 */
export function splitAtMedian(xs, ys) {
  const sorted = [...xs].sort((a, b) => a - b)
  const mid = sorted[Math.floor((sorted.length - 1) / 2)]
  // "more" is strictly above the lower median, so a variable that is mostly one value still splits;
  // when nothing is above it (the median is the top value), "more" is the median itself
  let threshold = sorted.find(v => v > mid)
  if (threshold == null) threshold = sorted.some(v => v < mid) ? mid : null
  if (threshold == null) return null
  const hi = [], lo = []
  xs.forEach((x, i) => (x >= threshold ? hi : lo).push(ys[i]))
  if (!hi.length || !lo.length) return null
  return { threshold, more: { weeks: hi.length, change: mean(hi) }, less: { weeks: lo.length, change: mean(lo) } }
}

/**
 * Relate each weekly training variable to the next week's change in average body weight.
 *
 * `weeks`: [{ vars: { [key]: number }, change: number|null }] — `change` is the weight change from
 * this week's average to the next week's, null when either week has no weigh-in.
 * `keys`: the variables to test.
 *
 * Returns { enough, weeks, findings, weak } — findings sorted by strength, each
 * { key, r, strength, direction: 'more-loss' | 'less-loss', split }.
 */
export function weeklyRelations(weeks, keys) {
  const paired = weeks.filter(w => w.change != null && isFinite(w.change))
  if (paired.length < MIN_WEEKS) return { enough: false, weeks: paired.length, findings: [], weak: [] }
  const findings = [], weak = []
  for (const key of keys) {
    const xs = paired.map(w => Number(w.vars[key]) || 0)
    const ys = paired.map(w => w.change)
    const r = pearson(xs, ys)
    if (r == null) continue
    const strength = strengthOf(r)
    const split = splitAtMedian(xs, ys)
    const balanced = split && split.more.weeks >= MIN_GROUP && split.less.weeks >= MIN_GROUP
    if ((strength === 'medium' || strength === 'large') && balanced) {
      // A negative r means: more of this, a lower (or more falling) weight the week after.
      findings.push({ key, r, strength, direction: r < 0 ? 'more-loss' : 'less-loss', split })
    } else weak.push(key)
  }
  findings.sort((a, b) => Math.abs(b.r) - Math.abs(a.r))
  return { enough: true, weeks: paired.length, findings, weak }
}
