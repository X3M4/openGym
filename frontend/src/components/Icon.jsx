// SuperOpenGym icon set — the Munich '72 programme (DESIGN.md), drawn on a 24×24 grid.
//
// Two families, one geometry:
//   · interface icons — single-weight strokes at 0°, 45° and 90°, square caps and mitred joins
//     (set on .icn), circles only where the object is round. Live area 3…21.
//   · sport pictograms — Otl Aicher's figures: a solid round head and limbs as heavy bars on the
//     45° grid with round ends (fig(), below). They read at tab-bar size and hold up as the
//     200px pictogram on Home's training field.
// Everything is drawn in currentColor, so an icon takes the colour of whatever it sits in.

// A pictogram figure: a solid head and limb bars (each an "x y x y …" polyline) of one weight.
const BAR = 2.9
const fig = (head, bars, extra = null) => <>
  <circle cx={head[0]} cy={head[1]} r={head[2] || 2.1} fill="currentColor" stroke="none" />
  {bars.map((b, i) => <polyline key={i} points={b} fill="none" strokeWidth={BAR} strokeLinecap="round" strokeLinejoin="round" />)}
  {extra}
</>
// Equipment drawn as solid blocks next to a figure.
const block = (x, y, w, h) => <rect x={x} y={y} width={w} height={h} fill="currentColor" stroke="none" />

const P = {
  /* ---- navigation ---- */
  house: <path d="M3.5 11 12 3.5l8.5 7.5M6 9v11.5h12V9M10 20.5v-6h4v6" />,
  calendar: <><path d="M3.5 6h17v14.5h-17Z" /><path d="M8 3.5v4M16 3.5v4M3.5 10.5h17" /><path d="M7.5 14h2M11 14h2M14.5 14h2M7.5 17h2M11 17h2" /></>,
  chart: <path d="M4.5 20.5V13M9.5 20.5V5.5M14.5 20.5v-6M19.5 20.5V9M3 20.5h18" />,
  magnifier: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></>,
  gear: <><path d="M10 3.5h4l.6 2.6 1.6.9 2.5-.9 2 3.4-1.9 1.8v1.4l1.9 1.8-2 3.4-2.5-.9-1.6.9L14 20.5h-4l-.6-2.6-1.6-.9-2.5.9-2-3.4 1.9-1.8v-1.4L3.3 9.5l2-3.4 2.5.9 1.6-.9Z" /><circle cx="12" cy="12" r="2.8" /></>,

  /* ---- training (pictograms) ---- */
  dumbbell: <>{block(4.2, 7.5, 3.2, 9)}{block(16.6, 7.5, 3.2, 9)}{block(2, 9.5, 2.2, 5)}{block(19.8, 9.5, 2.2, 5)}<path d="M7.4 12h9.2" strokeWidth={BAR} /></>,
  barbell: <>{block(5, 6, 2.6, 12)}{block(16.4, 6, 2.6, 12)}{block(8.2, 8.5, 1.8, 7)}{block(14, 8.5, 1.8, 7)}<path d="M2 12h20" strokeWidth="2" /></>,
  figureRun: fig([15.2, 4.2], ['14 7.6 11.2 12.4 13.6 15.4 12.4 20.4', '11.2 12.4 7.6 14.6 5 13', '13.6 8.8 16.8 11 19.6 10']),
  figureStrength: fig([12, 3.8], ['12 7.2 12 13.6 9 20.4', '12 13.6 15 20.4'], <>{block(3, 8, 18, 1.9)}{block(3.2, 6, 2, 6)}{block(18.8, 6, 2, 6)}</>),
  food: <><path d="M7 3.5v17M4.5 3.5V9a2.5 2.5 0 0 0 5 0V3.5" /><path d="M17.5 20.5v-17C15.3 4.8 14 7.5 14 10.5v3h3.5" /></>,
  scale: <><path d="M3.5 4.5h17v16h-17Z" /><path d="M7.5 10.5a4.5 4.5 0 0 1 9 0Z" /><path d="M12 10.5 13.6 8M8.5 16.5h7" /></>,
  flame: <path d="M12 21c3.6 0 6-2.4 6-5.8 0-4.4-3.8-6-3-10.7C12.2 5.4 10.5 7.8 10.5 10.3c0 1-.6 1.7-1.4 1.7S7.8 11.2 7.8 10C6.6 11.4 6 13.3 6 15.2 6 18.6 8.4 21 12 21Z" />,
  timer: <><circle cx="12" cy="13.5" r="7" /><path d="M12 9.5v4.5h3.5M9.5 3.5h5M18.5 6.5l1.5 1.5" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5.5l3.5 2" /></>,

  /* ---- status / achievement ---- */
  trophy: <><path d="M7.5 3.5h9V9a4.5 4.5 0 0 1-9 0Z" /><path d="M7.5 5.5h-3v2a3 3 0 0 0 3 3M16.5 5.5h3v2a3 3 0 0 1-3 3M12 13.5v3.5M8 20.5h8v-3.5H8Z" /></>,
  medal: <><circle cx="12" cy="15" r="5.5" /><path d="M9 9.8 5.5 3.5M15 9.8l3.5-6.3M10 3.5h4" /><path d="m12 12.5 .9 1.8 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3Z" fill="currentColor" stroke="none" /></>,
  target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.8" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /></>,
  star: <path d="m12 3.5 2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6-4.5-4.1 6-.7Z" />,
  starFill: <path d="m12 3.5 2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6-4.5-4.1 6-.7Z" fill="currentColor" stroke="none" />,
  crown: <path d="M3.5 18.5h17M4 16 3.5 7l4.5 3.5L12 4.5l4 6L20.5 7 20 16Z" />,
  bolt: <path d="M13.5 3 5.5 13.5H11l-1 7.5 8.5-10.5H13Z" />,
  shield: <path d="M12 3.5 5 6v6c0 4.2 2.9 7.4 7 8.5 4.1-1.1 7-4.3 7-8.5V6Z" />,
  heart: <path d="M12 20 4.6 12.6a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9a4.6 4.6 0 0 1 6.5 6.5Z" />,
  rocket: <><path d="M12 3c3 2.6 4.5 6 4.5 9.5V17h-9v-4.5C7.5 9 9 5.6 12 3Z" /><circle cx="12" cy="10" r="1.8" /><path d="M7.5 13.5 4.5 16.5v4l3-2.5M16.5 13.5l3 3v4l-3-2.5M10.5 20.5h3" /></>,
  sparkles: <><path d="m8.5 3.5 1.3 3.2 3.2 1.3-3.2 1.3-1.3 3.2-1.3-3.2L4 8l3.2-1.3Z" /><path d="m16.5 12 1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z" /></>,
  lightbulb: <><path d="M9 16.5a6 6 0 1 1 6 0v2H9Z" /><path d="M10 21h4M12 12.5v4" /></>,

  /* ---- routine glyphs: what a training day is (pictograms) ---- */
  // push: an overhead press — the bar locked out above the head, arms in a V
  arm: fig([12, 7.2], ['12 10.4 12 15 9.4 20.5', '12 15 14.6 20.5', '7 4.6 9.2 9 12 10.4 14.8 9 17 4.6'], <>{block(3, 3, 18, 1.9)}{block(3, 1.4, 2.2, 5)}{block(18.8, 1.4, 2.2, 5)}</>),
  // core: a crunch on the 45° — torso bar, bent knees
  abs: fig([6.2, 9.4], ['8.4 11.6 12.6 15.6 18 13.6', '18 13.6 20.5 18.8', '8.4 11.6 4.5 13.6'], <path d="M3 20.5h18" />),
  // legs: a squat — thighs level, shins at 45°, bar across the back
  legs: fig([11, 3.6], ['11 7 9.4 12 15.2 12.8 12.4 19.6', '9.4 12 7 17 8.4 20.4'], <>{block(4.5, 6.4, 15, 1.9)}</>),
  // pull: a figure hanging from the bar, elbows at 45°
  pullup: fig([12, 8.6], ['7 3.5 9 7.6 12 11.4 12 16.4 10 20.5', '17 3.5 15 7.6 12 11.4', '12 16.4 14 20.5'], <path d="M3 3.5h18" strokeWidth="2" />),
  kettlebell: <><path d="M8.5 10.5V8.8a3.5 3.5 0 0 1 7 0v1.7" /><path d="M6.2 12.5a7 7 0 0 1 11.6 0c1.4 2 1.7 5 1 7.5H5.2c-.7-2.5-.4-5.5 1-7.5Z" fill="currentColor" stroke="none" /></>,
  // a solid ring: the hole is real, so the plate sits on any field colour
  plate: <circle cx="12" cy="12" r="6" fill="none" strokeWidth="5.6" />,
  // machine: a seated press — figure on a seat, arms forward to the handles
  machine: fig([9, 4.6], ['9 8 9 14 14 14 14 20.5', '9 9.6 13.6 11.4 17 11.4'], <>{block(18, 3.5, 2.2, 17)}{block(5, 15.2, 6.4, 2)}</>),
  bike: fig([13.6, 4], ['12.6 7.4 10.4 11.2 14.6 13.6 13.4 17', '12.6 7.4 17.4 9'], <><circle cx="5.6" cy="16.4" r="3.8" /><circle cx="18.4" cy="16.4" r="3.8" /></>),
  swim: fig([6.4, 8.6], ['8.8 10 13.6 9.2 17 6', '13.6 9.2 19.6 11'], <path d="M3 15.5c1.5-1.3 3-1.3 4.5 0s3 1.3 4.5 0 3-1.3 4.5 0 3 1.3 4.5 0M3 19.5c1.5-1.3 3-1.3 4.5 0s3 1.3 4.5 0 3-1.3 4.5 0 3 1.3 4.5 0" />),
  boxing: fig([8.6, 4.2], ['8.6 7.6 8.6 13.6 6 20.4', '8.6 13.6 11.4 20.4', '8.6 9.4 13.2 11 16 9'], <circle cx="18.4" cy="8.6" r="2.4" fill="currentColor" stroke="none" />),
  stretch: fig([6, 9.8], ['8 11.6 13.6 16 20.5 16', '8 11.6 13 7 17 4.5', '13.6 16 10.6 20.5'], <path d="M3 20.5h18" />),

  /* ---- actions ---- */
  plus: <path d="M12 4.5v15M4.5 12h15" />,
  minus: <path d="M4.5 12h15" />,
  check: <path d="m4.5 12.5 5 5 10-10" />,
  checkCircle: <><circle cx="12" cy="12" r="8.5" /><path d="m8 12.2 3 3 5-5.2" /></>,
  xmark: <path d="m5.5 5.5 13 13M18.5 5.5l-13 13" />,
  pencil: <><path d="M16 4 20 8 9 19H5v-4Z" /><path d="m13.5 6.5 4 4" /></>,
  trash: <><path d="M4.5 6.5h15M9.5 6.5v-3h5v3" /><path d="M6.5 6.5 7.5 20.5h9l1-14" /><path d="M10.5 10v7M13.5 10v7" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3.2-3.2a4 4 0 0 0-5.7-5.7l-1.4 1.4" /><path d="M14 10a4 4 0 0 0-5.7 0l-3.2 3.2a4 4 0 0 0 5.7 5.7l1.4-1.4" /></>,
  play: <path d="M7.5 4.5 19 12 7.5 19.5Z" fill="currentColor" />,
  pause: <path d="M8.5 5v14M15.5 5v14" strokeWidth="3" />,
  reset: <><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" /><path d="M4 3.5v5h5" /></>,
  bell: <><path d="M6.5 10.5a5.5 5.5 0 0 1 11 0V16l2 2h-15l2-2Z" /><path d="M10 20.5h4" /></>,
  bellSlash: <><path d="M8 6.2a5.5 5.5 0 0 1 9.5 4.3V16l2 2H10M6.5 11v5l-2 2H8" /><path d="M10 20.5h4M3.5 3.5l17 17" /></>,
  chevronRight: <path d="m9 5 7 7-7 7" />,
  chevronLeft: <path d="m15 5-7 7 7 7" />,
  chevronDown: <path d="m5 9 7 7 7-7" />,
  chevronUp: <path d="m5 15 7-7 7 7" />,
  arrowUp: <path d="M12 20V4.5M5.5 11 12 4.5l6.5 6.5" />,
  arrowDown: <path d="M12 4v15.5M5.5 13l6.5 6.5 6.5-6.5" />,
  expand: <path d="M14 4h6v6M10 20H4v-6M20 4l-6.5 6.5M4 20l6.5-6.5" />,
  minimize: <path d="M20 10h-6V4M4 14h6v6M14 10l6-6M10 14l-6 6" />,

  /* ---- objects ---- */
  person: <><circle cx="12" cy="7.5" r="3.8" fill="currentColor" stroke="none" /><path d="M4.5 20.5v-2.5a4 4 0 0 1 4-4h7a4 4 0 0 1 4 4v2.5" /></>,
  personCircle: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="10" r="2.8" fill="currentColor" stroke="none" /><path d="M7 18.2a5.5 5.5 0 0 1 10 0" /></>,
  clipboard: <><path d="M5.5 5h13v15.5h-13Z" /><path d="M9 3.5h6v3H9Z" /><path d="M8.5 11h7M8.5 14.5h7M8.5 18h4" /></>,
  list: <><path d="M9 6.5h11M9 12h11M9 17.5h11" /><path d="M4 5.3h2.4v2.4H4ZM4 10.8h2.4v2.4H4ZM4 16.3h2.4v2.4H4Z" fill="currentColor" stroke="none" /></>,
  folder: <path d="M3.5 5.5h6l2 2.5h9v12h-17Z" />,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.2 2.3 3.3 5.2 3.3 8.5s-1.1 6.2-3.3 8.5c-2.2-2.3-3.3-5.2-3.3-8.5S9.8 5.8 12 3.5Z" /></>,
  moon: <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8.5 8.5 0 1 0 10 10Z" />,
  sun: <><circle cx="12" cy="12" r="4.2" /><path d="M12 3v2.5M12 18.5V21M21 12h-2.5M5.5 12H3M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8M18.4 18.4l-1.8-1.8M7.4 7.4 5.6 5.6" /></>,
  key: <><circle cx="8" cy="16" r="4" /><path d="m11 13 9-9M16.5 7.5l2.5 2.5M14 10l2 2" /></>,
  lock: <><path d="M5 10.5h14v10H5Z" /><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3M12 14v3" /></>,
  envelope: <><path d="M3.5 5.5h17v13h-17Z" /><path d="m3.5 6 8.5 7 8.5-7" /></>,
  cloud: <path d="M7 18.5h10.5a3.8 3.8 0 0 0 .2-7.6A5.6 5.6 0 0 0 6.9 11.6 3.5 3.5 0 0 0 7 18.5Z" />,
  cloudSlash: <><path d="M7 18.5h10.5a3.8 3.8 0 0 0 .2-7.6A5.6 5.6 0 0 0 6.9 11.6 3.5 3.5 0 0 0 7 18.5Z" /><path d="M3.5 3.5l17 17" /></>,
  download: <path d="M12 3.5V15M6.5 9.5 12 15l5.5-5.5M4 20h16" />,
  upload: <path d="M12 15V3.5M6.5 9 12 3.5 17.5 9M4 20h16" />,
  wrench: <path d="M15 3.5a5 5 0 0 0-4.7 6.7L3.5 17v3.5H7l6.8-6.8a5 5 0 0 0 6.7-4.7l-3 3-3.5-1-1-3.5Z" />,
  // chequered: the finish line
  flag: <><path d="M5.5 21V3.5" /><path d="M5.5 4h14v10h-14Z" /><path d="M12.5 4h7v5h-7ZM5.5 9h7v5h-7Z" fill="currentColor" stroke="none" /></>,
  chartLine: <path d="M3.5 3.5v17h17M7 16l4-5 3 3 5.5-7" />,
  dot: <circle cx="12" cy="12" r="4.5" fill="currentColor" stroke="none" />,
  more: <path d="M4 10.5h3v3H4ZM10.5 10.5h3v3h-3ZM17 10.5h3v3h-3Z" fill="currentColor" stroke="none" />,
  grip: <path d="M8 5h2.6v2.6H8ZM13.4 5H16v2.6h-2.6ZM8 10.7h2.6v2.6H8ZM13.4 10.7H16v2.6h-2.6ZM8 16.4h2.6V19H8ZM13.4 16.4H16V19h-2.6Z" fill="currentColor" stroke="none" />,
  history: <><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" /><path d="M4 3.5v5h5" /><path d="M12 7.5v5l3.5 2" /></>,
  signOut: <><path d="M14 4H5v16h9" /><path d="m16 8 4 4-4 4M20 12H10" /></>,
  shuffle: <><path d="M3.5 7h3c1.8 0 3 1 4 2.6l3 4.8c1 1.6 2.2 2.6 4 2.6h3M3.5 17h3c1.8 0 3-1 4-2.6l.6-1M14 10.5l.5-.9c1-1.6 2.2-2.6 4-2.6h2" /><path d="m18 4 3 3-3 3M18 14l3 3-3 3" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v6" /><path d="M10.9 6.9h2.2v2.2h-2.2Z" fill="currentColor" stroke="none" /></>,
  qr: <><path d="M3.5 3.5h6.5V10H3.5ZM14 3.5h6.5V10H14ZM3.5 14H10v6.5H3.5Z" /><path d="M5.9 5.9h1.7v1.7H5.9ZM16.4 5.9h1.7v1.7h-1.7ZM5.9 16.4h1.7v1.7H5.9ZM14 14h2.6v2.6H14ZM17.9 17.9h2.6v2.6h-2.6ZM14 17.9h2.6v2.6H14ZM17.9 14h2.6v2.6h-2.6Z" fill="currentColor" stroke="none" /></>,
  camera: <><path d="M3.5 7.5h4l1.5-2.5h6l1.5 2.5h4v12h-17Z" /><circle cx="12" cy="13" r="3.5" /></>,
  image: <><path d="M3.5 4.5h17v15h-17Z" /><circle cx="8.5" cy="9.5" r="1.8" fill="currentColor" stroke="none" /><path d="m3.5 17 5-5 3.5 3.5 3-3 5.5 5.5" /></>,
  warning: <><path d="M12 3 21.5 20h-19Z" /><path d="M12 9.5V14" /><path d="M10.9 15.8h2.2V18h-2.2Z" fill="currentColor" stroke="none" /></>,
}

// A few keys are aliases so call sites can say what they mean.
P.search = P.magnifier
P.settings = P.gear
P.exercises = P.magnifier
P.weight = P.scale
P.streak = P.flame
P.done = P.check

export const ICON_NAMES = Object.keys(P)

/**
 * <Icon name="flame" />           — inherits font-size via `1em` sizing
 * <Icon name="flame" size={28} /> — explicit pixel size
 */
export default function Icon({ name, size, className = '', style, ...rest }) {
  const d = P[name]
  if (!d) return null
  const s = size ? { width: size, height: size } : null
  return (
    <svg
      className={'icn ' + className}
      data-icon={name}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={s ? { ...s, ...style } : style}
      {...rest}
    >
      {d}
    </svg>
  )
}
