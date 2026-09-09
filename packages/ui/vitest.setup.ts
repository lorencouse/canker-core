import '@testing-library/jest-dom/vitest';

/**
 * jsdom has no layout engine and only a partial SVG/pointer implementation, so the
 * handful of browser APIs our components legitimately use have to be stubbed here.
 * Everything below is deliberately *minimal and honest*: an identity screen CTM, a
 * plain point, no-op observers. Components must still behave correctly when these
 * APIs are missing entirely — that is asserted in the mouth-map tests.
 */

// --- matchMedia (prefers-reduced-motion et al.) -----------------------------
if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    })
  });
}

// --- ResizeObserver (Radix Slider / Popover measure with it) ----------------
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

// --- Pointer capture (Radix Slider / Select) --------------------------------
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// --- SVG geometry -----------------------------------------------------------
/** A 2D identity matrix shaped like an SVGMatrix, including `inverse()`. */
function identityMatrix(): DOMMatrix {
  const m = {
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    e: 0,
    f: 0,
    inverse: () => identityMatrix()
  };
  return m as unknown as DOMMatrix;
}

Object.defineProperty(SVGElement.prototype, 'getScreenCTM', {
  writable: true,
  configurable: true,
  value: function getScreenCTM(): DOMMatrix {
    return identityMatrix();
  }
});

/**
 * jsdom implements neither `createSVGPoint` nor `DOMPoint`. Nothing in this
 * package uses them any more (the mouth map inverts the CTM by hand), but the
 * stub keeps the surface honest if that ever changes.
 */
Object.defineProperty(SVGSVGElement.prototype, 'createSVGPoint', {
  writable: true,
  configurable: true,
  value: function createSVGPoint(): DOMPoint {
    const point = {
      x: 0,
      y: 0,
      matrixTransform(m: {
        a: number;
        b: number;
        c: number;
        d: number;
        e: number;
        f: number;
      }) {
        return {
          x: m.a * point.x + m.c * point.y + m.e,
          y: m.b * point.x + m.d * point.y + m.f
        };
      }
    };
    return point as unknown as DOMPoint;
  }
});
