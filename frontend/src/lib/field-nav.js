// The signature move (SuperOpenGym Phase 9): a domain field on Home carries on into its screen.
// The tapped field — or a band's coloured square — takes the shared view-transition name `field`,
// the destination's top field (.dfield-dest) holds the same name, and the router runs the swap
// inside document.startViewTransition: the colour grows into the screen instead of cutting to it.
// Without View Transitions, or with reduced motion asked for, it is a plain navigation.
export function fieldNav(nav, ev, to) {
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const el = ev?.currentTarget && (ev.currentTarget.querySelector?.('.dband-sq') || ev.currentTarget.closest?.('.dfield'))
  if (reduce || !el || typeof document === 'undefined' || !document.startViewTransition) { nav(to); return }
  el.style.viewTransitionName = 'field'
  nav(to, { viewTransition: true })
}
