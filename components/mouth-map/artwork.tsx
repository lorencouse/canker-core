import { CHEEKS, FRONT, LIPS, type MouthView } from '@/utils/mouth-map/geometry';

/**
 * The mouth drawn as a soft toy, to sit in Kanko's world: rounded shapes,
 * shaded by radial gradients and lifted by one soft drop shadow, with no
 * outlines and no anatomical detail (one smooth band per arch rather than
 * teeth, no palate ridges, no tongue texture). Detail would only compete
 * with the sores, which stay the one saturated thing on the map.
 *
 * Every shape is drawn over the regions utils/mouth-map/geometry.ts
 * hit-tests, so a stored sore lands on the same tissue it always did. Every
 * colour comes from a --mm-* custom property in styles/main.css, which is
 * what makes dark mode free; utils/contrast.test.ts holds those colours to
 * the severity ramp.
 *
 * `p` is an id prefix so two maps on one page do not share gradient ids.
 */

type P = { p: string };

const mm = (token: string) => `hsl(var(--mm-${token}))`;
const stop = (offset: number, token: string) => (
  <stop offset={offset} style={{ stopColor: mm(token) }} />
);

export function MapDefs({ p }: P) {
  return (
    <defs>
      <radialGradient id={`${p}cavity`} cx="50%" cy="45%" r="60%">
        {stop(0, 'gum')}{stop(1, 'gum-deep')}
      </radialGradient>
      <radialGradient id={`${p}palate`} cx="50%" cy="70%" r="75%">
        {stop(0, 'palate')}{stop(0.75, 'palate')}{stop(1, 'tissue')}
      </radialGradient>
      <radialGradient id={`${p}floor`} cx="50%" cy="20%" r="80%">
        {stop(0, 'tissue-light')}{stop(0.7, 'tissue-light')}{stop(1, 'tissue')}
      </radialGradient>
      <radialGradient id={`${p}tongue`} cx="45%" cy="35%" r="70%">
        {stop(0, 'tongue-light')}{stop(0.55, 'tongue')}{stop(1, 'tongue-deep')}
      </radialGradient>
      <linearGradient id={`${p}tooth`} x1="0" y1="0" x2="0" y2="1">
        {stop(0, 'tooth')}{stop(0.7, 'tooth')}{stop(1, 'tooth-shade')}
      </linearGradient>
      <radialGradient id={`${p}cheek`} cx="50%" cy="42%" r="62%">
        {stop(0, 'tissue-light')}{stop(0.55, 'tissue')}{stop(1, 'tissue-deep')}
      </radialGradient>
      <radialGradient id={`${p}lip`} cx="50%" cy="30%" r="75%">
        {stop(0, 'lip-light')}{stop(0.55, 'lip')}{stop(1, 'lip-deep')}
      </radialGradient>
      {/* Also the halo filter SoreMarker and MouthMapHero refer to. */}
      <filter id={`${p}soft`} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
      <filter id={`${p}shadow`} x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow
          dx="0"
          dy="3"
          stdDeviation="3"
          style={{ floodColor: mm('shadow') }}
        />
      </filter>
    </defs>
  );
}

function Label({
  x, y, children, size = 10.5
}: { x: number; y: number; children: string; size?: number }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      className="mouth-map-label"
      fontSize={size}
      style={{ pointerEvents: 'none' }}
    >
      {children}
    </text>
  );
}

function Small({ x, y, anchor, children }: { x: number; y: number; anchor: 'start' | 'end'; children: string }) {
  return (
    <text x={x} y={y} textAnchor={anchor} className="mouth-map-small" style={{ pointerEvents: 'none' }}>
      {children}
    </text>
  );
}

/* --- mouth interior: gums, roof, floor, throat, tongue -------------------- */

function Interior({ p }: P) {
  const { cx, uy, ly, rx, ury, lry, tongue: t } = FRONT;
  // The gum ring runs from rx - 16 to rx + 10 in geometry.ts; the tooth band
  // sits on its middle, so wherever it is drawn a tap reads as gums.
  const bandR = rx - 3;
  const band = 18;
  const tx0 = t.x, tx1 = t.x + t.w, top = t.top, bottom = t.bottom;
  // Square-shouldered at the back, rounding to a narrower tip, following the
  // tapered box the hit-testing uses.
  const mid = top + (bottom - top) * 0.5;
  const tongue = `M ${tx0} ${top + 22} Q ${tx0} ${top} ${tx0 + 26} ${top} L ${tx1 - 26} ${top} Q ${tx1} ${top} ${tx1} ${top + 22} L ${tx1} ${mid} C ${tx1} ${bottom - 30} ${cx + 52} ${bottom} ${cx} ${bottom} C ${cx - 52} ${bottom} ${tx0} ${bottom - 30} ${tx0} ${mid} Z`;
  return (
    <>
      <path
        d={`M ${cx - rx - 10} ${uy} A ${rx + 10} ${ury + 10} 0 0 1 ${cx + rx + 10} ${uy} L ${cx + rx + 10} ${ly} A ${rx + 10} ${lry + 10} 0 0 1 ${cx - rx - 10} ${ly} Z`}
        fill={`url(#${p}cavity)`}
      />
      <path
        d={`M ${cx - rx + 16} ${uy} A ${rx - 16} ${ury - 16} 0 0 1 ${cx + rx - 16} ${uy} Z`}
        fill={`url(#${p}palate)`}
      />
      <path
        d={`M ${cx - rx + 16} ${ly} A ${rx - 16} ${lry - 16} 0 0 0 ${cx + rx - 16} ${ly} Z`}
        fill={`url(#${p}floor)`}
      />
      <ellipse
        cx={cx}
        cy={(uy + ly) / 2}
        rx={rx * 0.78}
        ry={(ly - uy) * 0.3}
        fill={mm('throat')}
        opacity="0.8"
        filter={`url(#${p}soft)`}
      />
      <path
        d={`M ${cx - bandR} ${uy} A ${bandR} ${ury - 3} 0 0 1 ${cx + bandR} ${uy}`}
        fill="none"
        stroke={`url(#${p}tooth)`}
        strokeWidth={band}
        strokeLinecap="round"
        filter={`url(#${p}shadow)`}
      />
      <path
        d={`M ${cx - bandR} ${ly} A ${bandR} ${lry - 3} 0 0 0 ${cx + bandR} ${ly}`}
        fill="none"
        stroke={`url(#${p}tooth)`}
        strokeWidth={band}
        strokeLinecap="round"
        filter={`url(#${p}shadow)`}
      />
      <path d={tongue} fill={`url(#${p}tongue)`} filter={`url(#${p}shadow)`} />
      <path
        d={`M ${cx} ${top + 34} L ${cx} ${bottom - 34}`}
        stroke={mm('tongue-deep')}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.6"
      />
      <Label x={cx} y={uy - ury * 0.42}>Roof</Label>
      <Label x={cx} y={top + 22}>Tongue</Label>
      <Label x={cx} y={ly + lry * 0.8} size={9.5}>Floor</Label>
    </>
  );
}

/* --- cheek (buccal mucosa), flattened -------------------------------------- */

function Cheek({
  p, x, y, w, h, name, flip
}: P & { x: number; y: number; w: number; h: number; name: string; flip: boolean }) {
  const cx = x + w / 2, cy = y + h / 2;
  return (
    <>
      {/* Corner radius matches the rounded rect geometry.ts hit-tests. */}
      <rect x={x} y={y} width={w} height={h} rx={w * 0.45} fill={`url(#${p}cheek)`} filter={`url(#${p}shadow)`} />
      {/* The bite line, where the teeth meet the cheek. */}
      <path
        d={`M ${x + w * 0.13} ${cy} Q ${cx} ${cy - 8} ${x + w * 0.87} ${cy}`}
        fill="none"
        stroke={mm('tissue-deep')}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Label x={cx} y={y - 10}>{name}</Label>
      <Small x={flip ? x + w - 10 : x + 10} y={y + h + 16} anchor={flip ? 'end' : 'start'}>lips</Small>
      <Small x={flip ? x + 10 : x + w - 10} y={y + h + 16} anchor={flip ? 'start' : 'end'}>throat</Small>
    </>
  );
}

/* --- inner lip --------------------------------------------------------------- */

function Lip({
  p, cx, y, w, h, upper, name
}: P & { cx: number; y: number; w: number; h: number; upper: boolean; name: string }) {
  const x0 = cx - w / 2, x1 = cx + w / 2;
  // The hit-testing ellipses: centre and vertical radius per lip.
  const cy = upper ? y + h * 0.6 : y + h * 0.45;
  const ry = upper ? h * 0.6 : h * 0.62;
  const k = 0.55; // cubic control length for a quarter ellipse
  const top = cy - ry, bot = cy + ry;
  const d = upper
    ? // A cupid's bow on top, a full ellipse underneath.
      `M ${x0} ${cy} Q ${x0 + w * 0.1} ${top + 6} ${cx - w * 0.16} ${top + 2} Q ${cx - w * 0.07} ${top} ${cx} ${top + h * 0.18} Q ${cx + w * 0.07} ${top} ${cx + w * 0.16} ${top + 2} Q ${x1 - w * 0.1} ${top + 6} ${x1} ${cy} C ${x1} ${cy + ry * k} ${cx + (w / 2) * k} ${bot} ${cx} ${bot} C ${cx - (w / 2) * k} ${bot} ${x0} ${cy + ry * k} ${x0} ${cy} Z`
    : `M ${x0} ${cy} C ${x0 + w * 0.12} ${top + ry * 0.35} ${cx - (w / 2) * k} ${top} ${cx} ${top} C ${cx + (w / 2) * k} ${top} ${x1 - w * 0.12} ${top + ry * 0.35} ${x1} ${cy} C ${x1} ${cy + ry * k} ${cx + (w / 2) * k} ${bot} ${cx} ${bot} C ${cx - (w / 2) * k} ${bot} ${x0} ${cy + ry * k} ${x0} ${cy} Z`;
  const seamY = upper ? cy + ry * 0.15 : cy - ry * 0.15;
  const seamC = upper ? cy + ry * 0.5 : cy + ry * 0.2;
  return (
    <>
      <path d={d} fill={`url(#${p}lip)`} filter={`url(#${p}shadow)`} />
      <path
        d={`M ${x0 + w * 0.12} ${seamY} Q ${cx} ${seamC} ${x1 - w * 0.12} ${seamY}`}
        fill="none"
        // Soft ink rather than lip-deep: the lip gradient's stops sit too
        // close together for a seam drawn in one of them to show.
        stroke={mm('ink-soft')}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Label x={cx} y={upper ? y - h * 0.2 : y - h * 0.3}>{name}</Label>
    </>
  );
}

/* --- the three views ------------------------------------------------------- */

export function ViewArtwork({ view, p }: P & { view: MouthView }) {
  switch (view) {
    case 'front':
      return <Interior p={p} />;
    case 'cheeks':
      return (
        <>
          <Cheek p={p} {...CHEEKS.left} name="Left cheek" flip={false} />
          <Cheek p={p} {...CHEEKS.right} name="Right cheek" flip />
        </>
      );
    case 'lips':
      return (
        <>
          <Lip p={p} {...LIPS.upper} upper name="Inside the upper lip" />
          <Lip p={p} {...LIPS.lower} upper={false} name="Inside the lower lip" />
        </>
      );
  }
}
