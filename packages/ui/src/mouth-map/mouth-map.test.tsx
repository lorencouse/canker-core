import { fireEvent, render, screen } from '@testing-library/react';
import { SORE_SURFACES, type SoreSurface } from '@canker/core';

import {
  MAPPED_SURFACES,
  SURFACE_GEOMETRY,
  SURFACE_PATHS,
  VIEWBOX_SIZE,
  isMappedSurface,
  surfaceToViewBox,
  viewBoxToSurface,
  type MappedSurface
} from './geometry';
import { MouthMap, type MouthMapSore } from './mouth-map';
import { MouthMapThumb } from './mouth-map-thumb';
import { MouthHeatmap } from './mouth-heatmap';

const EXPECTED_MAPPED = SORE_SURFACES.filter((s) => s !== 'other');

function svgRoot(slot: string): SVGSVGElement {
  const el = document.querySelector(`svg[data-slot="${slot}"]`);
  if (!el) throw new Error(`no svg with data-slot="${slot}"`);
  return el as SVGSVGElement;
}

// ---------------------------------------------------------------------------
// geometry
// ---------------------------------------------------------------------------

describe('geometry', () => {
  it('has an entry for every mapped surface and nothing else', () => {
    expect(EXPECTED_MAPPED).toHaveLength(13);
    expect([...MAPPED_SURFACES].sort()).toEqual([...EXPECTED_MAPPED].sort());
    expect(Object.keys(SURFACE_GEOMETRY).sort()).toEqual([...EXPECTED_MAPPED].sort());
    expect(Object.keys(SURFACE_PATHS).sort()).toEqual([...EXPECTED_MAPPED].sort());
  });

  it('keeps every bbox inside the 0..400 viewBox', () => {
    for (const surface of MAPPED_SURFACES) {
      const { bbox, label } = SURFACE_GEOMETRY[surface];
      expect(bbox.w, surface).toBeGreaterThan(0);
      expect(bbox.h, surface).toBeGreaterThan(0);
      expect(bbox.x, surface).toBeGreaterThanOrEqual(0);
      expect(bbox.y, surface).toBeGreaterThanOrEqual(0);
      expect(bbox.x + bbox.w, surface).toBeLessThanOrEqual(VIEWBOX_SIZE);
      expect(bbox.y + bbox.h, surface).toBeLessThanOrEqual(VIEWBOX_SIZE);
      expect(label.x, surface).toBeGreaterThanOrEqual(0);
      expect(label.x, surface).toBeLessThanOrEqual(VIEWBOX_SIZE);
      expect(label.y, surface).toBeGreaterThanOrEqual(0);
      expect(label.y, surface).toBeLessThanOrEqual(VIEWBOX_SIZE);
    }
  });

  it('round-trips surfaceToViewBox -> viewBoxToSurface for every surface', () => {
    for (const surface of MAPPED_SURFACES) {
      const v = surfaceToViewBox(surface, 0.25, 0.75);
      const back = viewBoxToSurface(surface, v.x, v.y);
      expect(back.x, surface).toBeCloseTo(0.25, 6);
      expect(back.y, surface).toBeCloseTo(0.75, 6);
    }
  });

  it('clamps out-of-range points in both directions', () => {
    for (const surface of MAPPED_SURFACES) {
      const { bbox } = SURFACE_GEOMETRY[surface];
      expect(viewBoxToSurface(surface, -9999, -9999)).toEqual({ x: 0, y: 0 });
      expect(viewBoxToSurface(surface, 9999, 9999)).toEqual({ x: 1, y: 1 });
      // and the forward direction clamps the normalised input too
      expect(surfaceToViewBox(surface, -1, 2)).toEqual({
        x: bbox.x,
        y: bbox.y + bbox.h
      });
    }
  });

  it('isMappedSurface rejects "other" and nullish values', () => {
    expect(isMappedSurface('other')).toBe(false);
    expect(isMappedSurface(null)).toBe(false);
    expect(isMappedSurface(undefined)).toBe(false);
    for (const surface of MAPPED_SURFACES) expect(isMappedSurface(surface)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// MouthMap rendering
// ---------------------------------------------------------------------------

const sores: MouthMapSore[] = [
  { id: 'a', surface: 'cheek_left', x: 0.25, y: 0.5, pain: 7, healed: false },
  { id: 'b', surface: 'tongue_dorsum', x: 0.5, y: 0.5, pain: 2, healed: true },
  { id: 'c', surface: 'palate_hard', x: 0.5, y: 0.5, pain: null, healed: false },
  { id: 'd', surface: 'other' as SoreSurface, x: 0.5, y: 0.5, pain: 4, healed: false }
];

describe('MouthMap', () => {
  it('draws all 13 surfaces', () => {
    render(<MouthMap sores={[]} mode="view" />);
    const paths = svgRoot('mouth-map').querySelectorAll('[data-surface]');
    expect(paths).toHaveLength(13);
    const drawn = [...paths].map((p) => p.getAttribute('data-surface'));
    expect(drawn.sort()).toEqual([...EXPECTED_MAPPED].sort());
    expect(drawn).not.toContain('other');
  });

  it('renders one pin per mapped sore and skips "other"', () => {
    render(<MouthMap sores={sores} mode="view" />);
    const pins = svgRoot('mouth-map').querySelectorAll('[data-sore-id]');
    expect(pins).toHaveLength(3);
    expect([...pins].map((p) => p.getAttribute('data-sore-id'))).not.toContain('d');
  });

  it('does not throw for a sore with pain: null and labels it', () => {
    expect(() => render(<MouthMap sores={sores} mode="view" />)).not.toThrow();
    expect(screen.getByLabelText('Roof of mouth, pain not recorded')).toBeInTheDocument();
  });

  it('gives the selected pin a selection ring and paints it last', () => {
    render(<MouthMap sores={sores} mode="view" selectedSoreId="a" />);
    const root = svgRoot('mouth-map');
    const selected = root.querySelector('[data-sore-id="a"]')!;
    expect(selected).toHaveAttribute('data-selected', 'true');
    expect(selected).toHaveAttribute('aria-pressed', 'true');
    expect(selected.querySelector('circle[stroke="var(--accent)"]')).toBeTruthy();

    const unselected = root.querySelector('[data-sore-id="b"]')!;
    expect(unselected).not.toHaveAttribute('data-selected');
    expect(unselected.querySelector('circle[stroke="var(--accent)"]')).toBeNull();

    // selected sore is the last pin in document order so it paints on top
    const ids = [...root.querySelectorAll('[data-sore-id]')].map((p) =>
      p.getAttribute('data-sore-id')
    );
    expect(ids[ids.length - 1]).toBe('a');
  });

  it('dims healed pins and colours them with the heal token', () => {
    render(<MouthMap sores={sores} mode="view" />);
    const root = svgRoot('mouth-map');
    const healed = root.querySelector('[data-sore-id="b"]')!;
    const open = root.querySelector('[data-sore-id="a"]')!;
    expect(healed).toHaveAttribute('opacity', '0.6');
    expect(open).toHaveAttribute('opacity', '1');
    expect(healed.querySelector('circle[fill="var(--heal)"]')).toBeTruthy();
    expect(open.querySelector('circle[fill="var(--pain-4)"]')).toBeTruthy();
  });

  it('highlights the surface of the selected sore', () => {
    render(<MouthMap sores={sores} mode="view" selectedSoreId="a" />);
    const surface = svgRoot('mouth-map').querySelector('[data-surface="cheek_left"]')!;
    expect(surface).toHaveAttribute('data-selected', 'true');
  });
});

// ---------------------------------------------------------------------------
// MouthMap interaction — view mode
// ---------------------------------------------------------------------------

describe('MouthMap view mode', () => {
  it('calls onSelectSore when a pin is clicked', () => {
    const onSelectSore = vi.fn();
    render(<MouthMap sores={sores} mode="view" onSelectSore={onSelectSore} />);
    fireEvent.click(svgRoot('mouth-map').querySelector('[data-sore-id="a"]')!);
    expect(onSelectSore).toHaveBeenCalledExactlyOnceWith('a');
  });

  it('calls onSelectSore on Enter and Space on a focused pin', () => {
    const onSelectSore = vi.fn();
    render(<MouthMap sores={sores} mode="view" onSelectSore={onSelectSore} />);
    const pin = svgRoot('mouth-map').querySelector('[data-sore-id="b"]')!;
    expect(pin).toHaveAttribute('tabindex', '0');
    fireEvent.keyDown(pin, { key: 'Enter' });
    expect(onSelectSore).toHaveBeenCalledWith('b');
    fireEvent.keyDown(pin, { key: ' ' });
    expect(onSelectSore).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(pin, { key: 'a' });
    expect(onSelectSore).toHaveBeenCalledTimes(2);
  });

  it('does not place when a surface is clicked in view mode', () => {
    const onPlace = vi.fn();
    const onSelectSurface = vi.fn();
    render(
      <MouthMap
        sores={[]}
        mode="view"
        onPlace={onPlace}
        onSelectSurface={onSelectSurface}
      />
    );
    fireEvent.click(svgRoot('mouth-map').querySelector('[data-surface="gum_upper"]')!);
    expect(onSelectSurface).toHaveBeenCalledExactlyOnceWith('gum_upper');
    expect(onPlace).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// MouthMap interaction — place mode
// ---------------------------------------------------------------------------

describe('MouthMap place mode', () => {
  it('calls onSelectSurface when a surface is clicked', () => {
    const onSelectSurface = vi.fn();
    render(<MouthMap sores={[]} mode="place" onSelectSurface={onSelectSurface} />);
    fireEvent.click(svgRoot('mouth-map').querySelector('[data-surface="cheek_right"]')!);
    expect(onSelectSurface).toHaveBeenCalledExactlyOnceWith('cheek_right');
  });

  it('calls onPlace with normalised in-range coordinates while zoomed', () => {
    const onPlace = vi.fn();
    render(<MouthMap sores={[]} mode="place" zoomTo="cheek_left" onPlace={onPlace} />);
    // The stubbed screen CTM is the identity, so client coords are viewBox coords.
    fireEvent.click(svgRoot('mouth-map').querySelector('[data-surface="cheek_left"]')!, {
      clientX: 50,
      clientY: 200
    });
    expect(onPlace).toHaveBeenCalledTimes(1);
    const [surface, x, y] = onPlace.mock.calls[0]!;
    expect(surface).toBe('cheek_left');
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x).toBeLessThanOrEqual(1);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(y).toBeLessThanOrEqual(1);
  });

  it('maps an unzoomed click to the point under the pointer', () => {
    const onPlace = vi.fn();
    render(<MouthMap sores={[]} mode="place" onPlace={onPlace} />);
    const { bbox } = SURFACE_GEOMETRY.gum_upper;
    fireEvent.click(svgRoot('mouth-map').querySelector('[data-surface="gum_upper"]')!, {
      clientX: bbox.x + bbox.w * 0.25,
      clientY: bbox.y + bbox.h * 0.75
    });
    const [, x, y] = onPlace.mock.calls[0]!;
    expect(x).toBeCloseTo(0.25, 6);
    expect(y).toBeCloseTo(0.75, 6);
  });

  it('falls back to the surface centre when getScreenCTM is unavailable', () => {
    const proto = SVGElement.prototype as unknown as Record<string, unknown>;
    const original = proto.getScreenCTM;
    delete proto.getScreenCTM;
    try {
      const onPlace = vi.fn();
      render(<MouthMap sores={[]} mode="place" onPlace={onPlace} />);
      expect(() =>
        fireEvent.click(
          svgRoot('mouth-map').querySelector('[data-surface="palate_soft"]')!,
          { clientX: 200, clientY: 166 }
        )
      ).not.toThrow();
      expect(onPlace).toHaveBeenCalledExactlyOnceWith('palate_soft', 0.5, 0.5);
    } finally {
      proto.getScreenCTM = original;
    }
  });

  it('falls back to the surface centre when the CTM is degenerate', () => {
    const spy = vi
      .spyOn(SVGSVGElement.prototype, 'getScreenCTM')
      .mockReturnValue({ a: 0, b: 0, c: 0, d: 0, e: 0, f: 0 } as unknown as DOMMatrix);
    try {
      const onPlace = vi.fn();
      render(<MouthMap sores={[]} mode="place" onPlace={onPlace} />);
      fireEvent.click(svgRoot('mouth-map').querySelector('[data-surface="gum_lower"]')!, {
        clientX: 200,
        clientY: 340
      });
      expect(onPlace).toHaveBeenCalledExactlyOnceWith('gum_lower', 0.5, 0.5);
    } finally {
      spy.mockRestore();
    }
  });

  it('places at the surface centre on keyboard activation', () => {
    const onPlace = vi.fn();
    render(<MouthMap sores={[]} mode="place" onPlace={onPlace} />);
    fireEvent.keyDown(
      svgRoot('mouth-map').querySelector('[data-surface="tongue_left"]')!,
      { key: 'Enter' }
    );
    expect(onPlace).toHaveBeenCalledExactlyOnceWith('tongue_left', 0.5, 0.5);
  });
});

// ---------------------------------------------------------------------------
// MouthMapThumb / MouthHeatmap
// ---------------------------------------------------------------------------

describe('MouthMapThumb', () => {
  it('renders decoratively without a sore', () => {
    render(<MouthMapThumb />);
    const svg = svgRoot('mouth-map-thumb');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg.querySelectorAll('[data-surface]')).toHaveLength(13);
    expect(svg.querySelector('circle')).toBeNull();
  });

  it('renders a pin and a label for a sore', () => {
    render(
      <MouthMapThumb
        sore={{ surface: 'cheek_right', x: 0.5, y: 0.5, pain: 9, healed: false }}
      />
    );
    const svg = screen.getByRole('img', { name: 'Right cheek' });
    expect(svg.querySelector('circle[fill="var(--pain-5)"]')).toBeTruthy();
    expect(svg.querySelector('[data-surface="cheek_right"]')).toHaveAttribute(
      'data-selected',
      'true'
    );
  });

  it('ignores an unmapped surface without throwing', () => {
    expect(() =>
      render(
        <MouthMapThumb
          sore={{
            surface: 'other' as SoreSurface,
            x: 0.5,
            y: 0.5,
            pain: 5,
            healed: false
          }}
        />
      )
    ).not.toThrow();
    expect(svgRoot('mouth-map-thumb').querySelector('circle')).toBeNull();
  });

  it('marks a healed sore in its accessible name', () => {
    render(
      <MouthMapThumb
        sore={{ surface: 'gum_lower', x: 0.2, y: 0.2, pain: null, healed: true }}
      />
    );
    expect(screen.getByRole('img', { name: 'Lower gum, healed' })).toBeInTheDocument();
  });
});

describe('MouthHeatmap', () => {
  it('renders one blob per mapped sore', () => {
    render(
      <MouthHeatmap
        sores={sores.map((s) => ({
          id: s.id,
          surface: s.surface,
          x: s.x,
          y: s.y,
          pain: s.pain,
          healed: s.healed
        }))}
      />
    );
    const svg = screen.getByRole('img', { name: 'Mouth heatmap, 3 sores' });
    const blobs = svg.querySelectorAll('[data-slot="mouth-heat"] circle');
    expect(blobs).toHaveLength(3);
    expect([...blobs].map((b) => b.getAttribute('data-sore-id'))).toEqual([
      'a',
      'b',
      'c'
    ]);
  });

  it('renders with no sores at all', () => {
    render(<MouthHeatmap sores={[]} />);
    const svg = screen.getByRole('img', { name: 'Mouth heatmap, 0 sores' });
    expect(svg.querySelectorAll('[data-slot="mouth-heat"] circle')).toHaveLength(0);
    expect(svg.querySelectorAll('[data-surface]')).toHaveLength(13);
  });
});

// ---------------------------------------------------------------------------
// smoke: every surface is individually clickable and zoomable
// ---------------------------------------------------------------------------

describe('every surface', () => {
  it.each(MAPPED_SURFACES as MappedSurface[])(
    'renders, zooms to and places on %s',
    (surface) => {
      const onPlace = vi.fn();
      render(<MouthMap sores={[]} mode="place" zoomTo={surface} onPlace={onPlace} />);
      const root = svgRoot('mouth-map');
      const el = root.querySelector(`[data-surface="${surface}"]`)!;
      expect(el).toBeTruthy();
      const { bbox } = SURFACE_GEOMETRY[surface];
      fireEvent.click(el, {
        clientX: bbox.x + bbox.w / 2,
        clientY: bbox.y + bbox.h / 2
      });
      expect(onPlace).toHaveBeenCalledTimes(1);
      const [, x, y] = onPlace.mock.calls[0]!;
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(1);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(1);
    }
  );
});
