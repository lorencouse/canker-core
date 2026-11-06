import { describe, expect, it, vi } from 'vitest';
import { hasSystemSignIn, systemSignIn } from './native';

/**
 * A stand-in for Capacitor's plugin proxy: like the real one, every property
 * it has no native method for (including `then`) becomes a call that rejects
 * as unimplemented. Resolving a promise with it would therefore never settle.
 */
const native = vi.hoisted(() => ({
  capabilities: vi.fn(async () => ({ httpsCallback: true })),
  start: vi.fn(async ({ url }: { url: string }) => ({ url }))
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => true,
    getPlatform: () => 'android'
  },
  registerPlugin: (name: string) =>
    new Proxy(
      {},
      {
        get: (_target, prop) =>
          (native as Record<PropertyKey, unknown>)[prop] ??
          (() =>
            Promise.reject(
              new Error(`"${name}.${String(prop)}()" is not implemented`)
            ))
      }
    )
}));

describe('system sign-in on the native app', () => {
  it('settles even though the plugin proxy answers every property', async () => {
    await expect(hasSystemSignIn('/native-auth/callback')).resolves.toBe(true);
    expect(native.capabilities).toHaveBeenCalledWith({
      callbackPath: '/native-auth/callback'
    });
  });

  it('starts the plugin and returns its result', async () => {
    const url = 'https://cankercore.com/native-auth/callback?token=t';
    await expect(
      systemSignIn(url, '/native-auth/callback')
    ).resolves.toEqual({ url });
  });
});
