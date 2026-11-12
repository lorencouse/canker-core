'use client';

import { useEffect } from 'react';
import {
  Capacitor,
  registerPlugin,
  type PluginListenerHandle
} from '@capacitor/core';

import {
  applyFold,
  foldFromRegions,
  regionsFromSegments,
  type Rect
} from '@/utils/fold';
import { applyNavMode } from '@/utils/nav-mode';

interface FoldPlugin {
  get(): Promise<{ regions?: Rect[] }>;
  addListener(
    event: 'change',
    cb: (e: { regions?: Rect[] }) => void
  ): Promise<PluginListenerHandle>;
}

const NativeFold = registerPlugin<FoldPlugin>('Fold');

type Viewport = { segments?: readonly DOMRectReadOnly[] | null };

/**
 * Keeps <html data-fold> (utils/fold.ts) and <html data-nav>
 * (utils/nav-mode.ts) true as the window changes: spanned, unspanned,
 * turned, resized, folded.
 *
 * The fold comes from the app's Fold plugin where the shell has one (the
 * Android System WebView and WebKit report nothing), and from Chrome's
 * Viewport Segments API otherwise. A binary from before the plugin, or a
 * browser without the API, answers nothing, and the page lays out by width
 * alone, as it always has.
 *
 * Mounted once, in the root layout. The head script has already set
 * data-nav before the first paint; this only follows changes, and adds the
 * one input the head script cannot know yet: a fold across the screen.
 */
export default function LayoutWatch() {
  useEffect(() => {
    const root = document.documentElement;
    const native =
      Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Fold');
    let regions: Rect[] = [];

    const draw = () => {
      if (!native) {
        const viewport = (window as unknown as { viewport?: Viewport })
          .viewport;
        regions = regionsFromSegments(
          (viewport?.segments ?? []).map((s) => ({
            x: s.x,
            y: s.y,
            width: s.width,
            height: s.height
          }))
        );
      }
      const fold = foldFromRegions(regions, {
        width: window.innerWidth,
        height: window.innerHeight
      });
      applyFold(fold, root);
      applyNavMode(fold?.axis ?? null);
    };

    let live = true;
    let handle: Promise<PluginListenerHandle> | null = null;
    if (native) {
      const take = (e: { regions?: Rect[] }) => {
        if (!live) return;
        regions = e.regions ?? [];
        draw();
      };
      NativeFold.get().then(take, () => {});
      handle = NativeFold.addListener('change', take);
    }

    draw();
    // A fold, an unfold or a turn sends new regions, but the window's size
    // can land after them, and whether the fold is usable depends on both.
    window.addEventListener('resize', draw);
    window.addEventListener('orientationchange', draw);
    return () => {
      live = false;
      window.removeEventListener('resize', draw);
      window.removeEventListener('orientationchange', draw);
      void handle?.then((h) => h.remove()).catch(() => {});
      applyFold(null, root);
    };
  }, []);

  return null;
}
