'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { PluginListenerHandle } from '@capacitor/core';

import {
  COVERS_TABS,
  NativeTabBar,
  applyTop,
  barPlatform,
  barState,
  makeSync,
  nativeTabsAvailable,
  readPalette,
  refuseNativeTabs,
  type BarSync,
  type NativeTab
} from './native-tabs';

const noSubscribe = () => () => {};

/**
 * Drives the platform's own tab bar (native-tabs.ts) from the web shell. It
 * is shown where utils/nav-mode.ts says bar and put away where it says rail
 * or top, under anything that covers the foot of the page, and when the
 * shell goes. `onPick` is a tap on a tab, by its id.
 */
export function useNativeTabBar(
  tabs: NativeTab[],
  onPick: (id: string) => void
): void {
  // The server render and the first client render both draw the web bar;
  // the plugin is asked after hydration. A refusal gives the bar back.
  const available = useSyncExternalStore(
    noSubscribe,
    nativeTabsAvailable,
    () => false
  );
  const [refused, setRefused] = useState(false);
  const on = available && !refused;
  const [tick, setTick] = useState(0);
  const latest = useRef({ tabs, onPick });
  useEffect(() => {
    latest.current = { tabs, onPick };
  });
  const sync = useRef<BarSync | null>(null);

  // Anything that changes what the bar should be: the nav mode, the theme,
  // a dialog opening or closing, the window changing shape.
  useEffect(() => {
    if (!on) return;
    let frame = 0;
    const bump = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setTick((n) => n + 1));
    };
    const root = new MutationObserver(bump);
    root.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-nav', 'class']
    });
    const body = new MutationObserver(bump);
    body.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state', 'data-covers-tabs']
    });
    const resized = () => {
      sync.current?.forget();
      bump();
    };
    window.addEventListener('resize', resized);
    return () => {
      cancelAnimationFrame(frame);
      root.disconnect();
      body.disconnect();
      window.removeEventListener('resize', resized);
    };
  }, [on]);

  useEffect(() => {
    if (!on) return;
    sync.current = makeSync(
      (s) => NativeTabBar.set(s),
      (top) => applyTop(top),
      () => {
        refuseNativeTabs();
        setRefused(true);
      }
    );
    const handles: PluginListenerHandle[] = [];
    let gone = false;
    const keep = (h: PluginListenerHandle) =>
      gone ? void h.remove() : void handles.push(h);
    void NativeTabBar.addListener('select', ({ id }) =>
      latest.current.onPick(id)
    )
      .then(keep)
      .catch(() => {});
    void NativeTabBar.addListener('top', ({ top }) => {
      if (typeof top === 'number' && top > 0) applyTop(top);
    })
      .then(keep)
      .catch(() => {});
    return () => {
      gone = true;
      handles.forEach((h) => void h.remove());
      // The shell is going (signing out, the first run): put the bar away
      // and give the page its own inset back.
      sync.current?.(
        barState(latest.current.tabs, true, readPalette(), barPlatform())
      );
      applyTop(null);
      sync.current = null;
    };
  }, [on]);

  useEffect(() => {
    if (!on) return;
    const mode = document.documentElement.dataset.nav ?? 'bar';
    const covered = !!document.querySelector(COVERS_TABS);
    sync.current?.(
      barState(tabs, mode !== 'bar' || covered, readPalette(), barPlatform())
    );
  }, [on, tabs, tick]);
}
