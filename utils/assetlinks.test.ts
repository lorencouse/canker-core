import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// public/.well-known/assetlinks.json is what Android fetches to verify the
// sign-in App Link (utils/native-patches.mts). A malformed file fails
// verification silently on the device, so its shape is checked here.
const file = fileURLToPath(
  new URL('../public/.well-known/assetlinks.json', import.meta.url)
);
const statements = JSON.parse(readFileSync(file, 'utf8')) as {
  relation: string[];
  target: {
    namespace: string;
    package_name: string;
    sha256_cert_fingerprints: string[];
  };
}[];

/** The debug keystore's certificate, which signs the current test installs. */
const DEBUG_FINGERPRINT =
  '94:0D:2D:34:03:06:C7:74:53:3A:99:BF:AC:F1:09:9B:89:FE:12:68:5C:45:25:99:CE:8A:52:B8:B9:10:46:7E';

describe('assetlinks.json', () => {
  it('delegates links only to the Canker Core Android app', () => {
    expect(statements).toHaveLength(1);
    const [{ relation, target }] = statements;
    expect(relation).toEqual(['delegate_permission/common.handle_all_urls']);
    expect(target.namespace).toBe('android_app');
    expect(target.package_name).toBe('com.cankercore.app');
  });

  it('lists well-formed, distinct SHA-256 certificate fingerprints', () => {
    const prints = statements[0].target.sha256_cert_fingerprints;
    expect(prints.length).toBeGreaterThan(0);
    expect(new Set(prints).size).toBe(prints.length);
    for (const print of prints)
      expect(print).toMatch(/^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/);
    expect(prints).toContain(DEBUG_FINGERPRINT);
  });
});
