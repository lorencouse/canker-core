import type React from 'react';

import { CHEEKS, FRONT, LIPS, type MouthView } from '@/utils/mouth-map/geometry';

/**
 * The mouth drawn as soft illustration: real anatomy (cupid's bow, frenulum,
 * palate ridges, tongue texture) in low-chroma tissue tones, so plotted sores
 * remain the only saturated colour. Every colour comes from a --mm-* custom
 * property in styles/main.css, which is what makes dark mode free.
 *
 * `p` is an id prefix so two maps on one page do not share gradient ids.
 */

type P = { p: string };

const ink = 'hsl(var(--mm-ink))';
const inkSoft = 'hsl(var(--mm-ink-soft))';
const stop = (offset: number, token: string) => (
  <stop offset={offset} style={{ stopColor: `hsl(var(--mm-${token}))` }} />
);

export function MapDefs({ p }: P) {
  return (
    <defs>
      <radialGradient id={`${p}tongue`} cx="50%" cy="35%" r="70%">
        {stop(0, 'tongue-light')}{stop(0.65, 'tongue')}{stop(1, 'tongue-deep')}
      </radialGradient>
      <radialGradient id={`${p}cheek`} cx="50%" cy="45%" r="65%">
        {stop(0, 'tissue-light')}{stop(0.7, 'tissue')}{stop(1, 'tissue-deep')}
      </radialGradient>
      <linearGradient id={`${p}lipU`} x1="0" y1="0" x2="0" y2="1">
        {stop(0, 'tissue-deep')}{stop(0.45, 'tissue')}{stop(1, 'tissue-light')}
      </linearGradient>
      <linearGradient id={`${p}lipL`} x1="0" y1="0" x2="0" y2="1">
        {stop(0, 'tissue-light')}{stop(0.55, 'tissue')}{stop(1, 'tissue-deep')}
      </linearGradient>
      <radialGradient id={`${p}palate`} cx="50%" cy="20%" r="80%">
        {stop(0, 'palate')}{stop(0.75, 'tissue')}{stop(1, 'throat')}
      </radialGradient>
      <radialGradient id={`${p}cavity`} cx="50%" cy="50%" r="60%">
        {stop(0, 'throat')}{stop(1, 'tissue')}
      </radialGradient>
      <linearGradient id={`${p}gum`} x1="0" y1="0" x2="0" y2="1">
        {stop(0, 'gum-deep')}{stop(1, 'gum')}
      </linearGradient>
      <linearGradient id={`${p}gumL`} x1="0" y1="0" x2="0" y2="1">
        {stop(0, 'gum')}{stop(1, 'gum-deep')}
      </linearGradient>
      <linearGradient id={`${p}tooth`} x1="0" y1="0" x2="0" y2="1">
        {stop(0, 'tooth')}{stop(1, 'tooth-shade')}
      </linearGradient>
      <radialGradient id={`${p}floor`} cx="50%" cy="100%" r="80%">
        {stop(0, 'tissue-light')}{stop(1, 'tissue-deep')}
      </radialGradient>
      <pattern id={`${p}pap`} width="7" height="7" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="0.9" fill={ink} opacity="0.28" />
        <circle cx="5.5" cy="5.5" r="0.7" fill={ink} opacity="0.2" />
      </pattern>
      <filter id={`${p}soft`} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
      <filter id={`${p}shadow`} x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="1.2" stdDeviation="1" floodColor="#000" floodOpacity="0.18" />
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

/* --- teeth along an elliptical arch, sized by tooth type ------------------ */

const HALF_ARCH = [
  { w: 22, h: 24, rx: 6 }, // central incisor
  { w: 18, h: 22, rx: 6 }, // lateral incisor
  { w: 18, h: 24, rx: 7 }, // canine
  { w: 16, h: 18, rx: 6 }, // premolars
  { w: 16, h: 18, rx: 6 },
  { w: 22, h: 20, rx: 6 }, // molars
  { w: 20, h: 18, rx: 6 }
];

function Teeth({
  p, cx, cy, rx, ry, apex
}: P & { cx: number; cy: number; rx: number; ry: number; apex: number }) {
  // Sample the arc so teeth can be spaced by arc length rather than angle.
  const n = 600;
  const a0 = apex - Math.PI * 0.95, a1 = apex + Math.PI * 0.95;
  const pts: { a: number; x: number; y: number; s: number }[] = [];
  let len = 0;
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    const pt = { a, x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a), s: 0 };
    if (i) len += Math.hypot(pt.x - pts[i - 1].x, pt.y - pts[i - 1].y);
    pt.s = len;
    pts.push(pt);
  }
  const mid = len / 2, gap = 2.2;
  const at = (s: number) => pts[Math.max(1, pts.findIndex((q) => q.s >= s))];

  const teeth: React.ReactNode[] = [];
  for (const side of [-1, 1]) {
    let off = gap / 2;
    HALF_ARCH.forEach((th, i) => {
      const pt = at(mid + side * (off + th.w / 2));
      off += th.w + gap;
      const rot = (Math.atan2(ry * Math.cos(pt.a), -rx * Math.sin(pt.a)) * 180) / Math.PI;
      // Push the crown inward so its edge sits on the arc.
      const nx = -Math.cos(pt.a) * rx, ny = -Math.sin(pt.a) * ry, nl = Math.hypot(nx, ny);
      const ox = pt.x + (nx / nl) * th.h * 0.35, oy = pt.y + (ny / nl) * th.h * 0.35;
      teeth.push(
        <g key={`${side}-${i}`} transform={`translate(${ox.toFixed(1)} ${oy.toFixed(1)}) rotate(${rot.toFixed(1)})`} filter={`url(#${p}shadow)`}>
          <rect x={-th.w / 2} y={-th.h / 2} width={th.w} height={th.h} rx={th.rx} fill={`url(#${p}tooth)`} stroke="hsl(var(--mm-tooth-line))" strokeWidth="0.8" />
          <line x1={-th.w / 2 + 4} y1={th.h / 2 - 5} x2={th.w / 2 - 4} y2={th.h / 2 - 5} stroke="hsl(var(--mm-tooth-line))" strokeWidth="0.6" opacity="0.5" />
        </g>
      );
    });
  }
  return <>{teeth}</>;
}

/* --- inner lip ------------------------------------------------------------ */

function LipInner({
  p, cx, y, w, h, upper, name
}: P & { cx: number; y: number; w: number; h: number; upper: boolean; name: string }) {
  const x0 = cx - w / 2, x1 = cx + w / 2;
  const d = upper
    ? `M ${x0} ${y + h * 0.62} C ${x0 + w * 0.05} ${y + h * 0.15} ${cx - w * 0.22} ${y - h * 0.02} ${cx - w * 0.08} ${y + h * 0.1} Q ${cx} ${y + h * 0.22} ${cx + w * 0.08} ${y + h * 0.1} C ${cx + w * 0.22} ${y - h * 0.02} ${x1 - w * 0.05} ${y + h * 0.15} ${x1} ${y + h * 0.62} C ${x1 - w * 0.15} ${y + h * 1.05} ${cx + w * 0.2} ${y + h * 1.15} ${cx} ${y + h * 1.15} C ${cx - w * 0.2} ${y + h * 1.15} ${x0 + w * 0.15} ${y + h * 1.05} ${x0} ${y + h * 0.62} Z`
    : `M ${x0} ${y + h * 0.38} C ${x0 + w * 0.15} ${y - h * 0.05} ${cx - w * 0.2} ${y - h * 0.15} ${cx} ${y - h * 0.15} C ${cx + w * 0.2} ${y - h * 0.15} ${x1 - w * 0.15} ${y - h * 0.05} ${x1} ${y + h * 0.38} C ${x1 - w * 0.05} ${y + h * 0.9} ${cx + w * 0.25} ${y + h * 1.08} ${cx} ${y + h * 1.08} C ${cx - w * 0.25} ${y + h * 1.08} ${x0 + w * 0.05} ${y + h * 0.9} ${x0} ${y + h * 0.38} Z`;
  const fy0 = upper ? y + h * 0.6 : y + h * 0.05;
  const fy1 = upper ? y + h * 1.05 : y + h * 0.45;
  const wetY = upper ? y + h * 0.55 : y + h * 0.45;
  const wetC = upper ? y + h * 0.42 : y + h * 0.6;
  return (
    <>
      <path d={d} fill={`url(#${p}${upper ? 'lipU' : 'lipL'})`} stroke={ink} strokeWidth="1" />
      <path d={`M ${cx} ${fy0} Q ${cx - 3} ${(fy0 + fy1) / 2} ${cx} ${fy1}`} fill="none" stroke={inkSoft} strokeWidth="1.5" />
      <path d={`M ${x0 + w * 0.15} ${wetY} Q ${cx} ${wetC} ${x1 - w * 0.15} ${wetY}`} fill="none" stroke="hsl(var(--mm-tissue-light))" strokeWidth="2" opacity="0.7" />
      <Label x={cx} y={upper ? y - h * 0.2 : y - h * 0.3}>{name}</Label>
    </>
  );
}

/* --- cheek (buccal mucosa), flattened -------------------------------------- */

function Cheek({
  p, x, y, w, h, name, flip
}: P & { x: number; y: number; w: number; h: number; name: string; flip: boolean }) {
  const cx = x + w / 2, cy = y + h / 2;
  const fx = flip ? x + w : x, bx = flip ? x : x + w;
  const d = `M ${cx} ${y} C ${cx + (bx - cx) * 0.95} ${y} ${bx} ${y + h * 0.18} ${bx} ${cy} C ${bx} ${y + h * 0.82} ${cx + (bx - cx) * 0.95} ${y + h} ${cx} ${y + h} C ${cx + (fx - cx) * 1.05} ${y + h} ${fx} ${y + h * 0.8} ${fx} ${cy} C ${fx} ${y + h * 0.2} ${cx + (fx - cx) * 1.05} ${y} ${cx} ${y} Z`;
  return (
    <>
      <path d={d} fill={`url(#${p}cheek)`} stroke={ink} strokeWidth="1" />
      <path d={`M ${x + w * 0.12} ${cy} Q ${x + w * 0.35} ${cy - 5} ${cx} ${cy} T ${x + w * 0.88} ${cy}`} fill="none" stroke={inkSoft} strokeWidth="1.5" />
      <Label x={cx} y={y - 10}>{name}</Label>
      <Small x={flip ? x + w - 10 : x + 10} y={y + h + 16} anchor={flip ? 'end' : 'start'}>lips</Small>
      <Small x={flip ? x + 10 : x + w - 10} y={y + h + 16} anchor={flip ? 'start' : 'end'}>throat</Small>
    </>
  );
}

/* --- mouth interior: arches, palate, tongue, floor ------------------------- */

function Interior({ p }: P) {
  const { cx, uy, ly, rx, ury, lry, h, tongue: t } = FRONT;
  const band = (cy: number, ryy: number, dir: 1 | -1, grad: string) => (
    <path
      d={`M ${cx - rx - 10} ${cy} A ${rx + 10} ${ryy + 10} 0 0 ${dir > 0 ? 1 : 0} ${cx + rx + 10} ${cy} L ${cx + rx - 16} ${cy} A ${rx - 16} ${ryy - 16} 0 0 ${dir > 0 ? 0 : 1} ${cx - rx + 16} ${cy} Z`}
      fill={`url(#${p}${grad})`}
      stroke={ink}
      strokeWidth="0.8"
    />
  );
  const tx = t.x, tw = t.w, ty = t.top, tb = t.bottom;
  const tongue = `M ${tx + 26} ${ty} Q ${cx} ${ty - 14} ${tx + tw - 26} ${ty} Q ${tx + tw + 2} ${ty + 6} ${tx + tw} ${ty + 40} Q ${tx + tw + 4} ${tb - h * 0.24} ${tx + tw - 22} ${tb - h * 0.08} Q ${tx + tw - 48} ${tb + 2} ${cx} ${tb} Q ${tx + 48} ${tb + 2} ${tx + 22} ${tb - h * 0.08} Q ${tx - 4} ${tb - h * 0.24} ${tx} ${ty + 40} Q ${tx - 2} ${ty + 6} ${tx + 26} ${ty} Z`;
  const rugae = [0, 1, 2, 3].map((i) => {
    const yy = uy - ury * 0.62 + i * 13, ww = rx * (0.28 + i * 0.09);
    return (
      <g key={i}>
        <path d={`M ${cx - ww} ${yy + 6} Q ${cx - ww * 0.5} ${yy} ${cx - 8} ${yy + 4}`} fill="none" stroke={inkSoft} strokeWidth="1.2" />
        <path d={`M ${cx + ww} ${yy + 6} Q ${cx + ww * 0.5} ${yy} ${cx + 8} ${yy + 4}`} fill="none" stroke={inkSoft} strokeWidth="1.2" />
      </g>
    );
  });
  return (
    <>
      <path d={`M ${cx - rx - 10} ${uy} A ${rx + 10} ${ury + 10} 0 0 1 ${cx + rx + 10} ${uy} L ${cx + rx + 10} ${ly} A ${rx + 10} ${lry + 10} 0 0 1 ${cx - rx - 10} ${ly} Z`} fill={`url(#${p}cavity)`} stroke={ink} strokeWidth="0.8" />
      <path d={`M ${cx - rx + 14} ${uy} A ${rx - 14} ${ury - 14} 0 0 1 ${cx + rx - 14} ${uy} L ${cx + rx - 14} ${uy + 8} Q ${cx} ${uy + 34} ${cx - rx + 14} ${uy + 8} Z`} fill={`url(#${p}palate)`} stroke={ink} strokeWidth="0.8" />
      {rugae}
      <line x1={cx} y1={uy - ury * 0.7} x2={cx} y2={uy - 6} stroke={inkSoft} strokeWidth="1" />
      <path d={`M ${cx - rx * 0.55} ${uy + 6} Q ${cx} ${uy + 26} ${cx + rx * 0.55} ${uy + 6}`} fill="none" stroke={ink} strokeWidth="0.8" opacity="0.6" />
      <path d={`M ${cx - 5} ${uy + 4} Q ${cx} ${uy + 22} ${cx + 5} ${uy + 4}`} fill="hsl(var(--mm-throat))" stroke={ink} strokeWidth="0.8" opacity="0.9" />
      {band(uy, ury, 1, 'gum')}
      <path d={`M ${cx - rx + 14} ${ly} A ${rx - 14} ${lry - 14} 0 0 0 ${cx + rx - 14} ${ly} L ${cx + rx - 14} ${ly - 20} L ${cx - rx + 14} ${ly - 20} Z`} fill={`url(#${p}floor)`} stroke={ink} strokeWidth="0.8" />
      {band(ly, lry, -1, 'gumL')}
      <path d={tongue} fill="hsl(var(--mm-tongue-deep))" opacity="0.5" transform="translate(0 4)" filter={`url(#${p}soft)`} />
      <path d={tongue} fill={`url(#${p}tongue)`} stroke={ink} strokeWidth="1" />
      <path d={tongue} fill={`url(#${p}pap)`} opacity="0.7" />
      <path d={`M ${cx} ${ty + 30} Q ${cx - 2} ${(ty + tb) / 2} ${cx} ${tb - 26}`} fill="none" stroke="hsl(var(--mm-tongue-deep))" strokeWidth="2" opacity="0.7" />
      <Teeth p={p} cx={cx} cy={uy} rx={rx} ry={ury} apex={Math.PI * 1.5} />
      <Teeth p={p} cx={cx} cy={ly} rx={rx} ry={lry} apex={Math.PI * 0.5} />
      <Label x={cx} y={uy - ury * 0.42}>Roof</Label>
      <Label x={cx} y={ty + 22}>Tongue</Label>
      <Label x={cx} y={ly + lry * 0.8} size={9.5}>Floor</Label>
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
          <LipInner p={p} {...LIPS.upper} upper name="Inside the upper lip" />
          <LipInner p={p} {...LIPS.lower} upper={false} name="Inside the lower lip" />
        </>
      );
  }
}

