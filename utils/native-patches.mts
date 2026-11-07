/**
 * Text patches for the generated Capacitor projects (`ios/`, `android/`).
 *
 * Those folders are produced by `cap add` and are untracked, so any fix made
 * by hand in Xcode vanishes on the next regeneration. scripts/patch-native.mjs
 * re-applies these after every `cap add` and `cap sync`.
 *
 * Every patch is idempotent: it recognises its own finished state and returns
 * the text unchanged. When neither the finished state nor the anchor it edits
 * is present, it throws, because a template change upstream would otherwise
 * turn the patch into a silent no-op and the build would break at launch.
 *
 * Kept free of non-erasable TypeScript so Node runs it directly from the .mjs
 * script, and free of I/O so vitest can drive it with fixture text.
 */

export type PatchResult = { text: string; changed: boolean };

export class PatchAnchorError extends Error {
  constructor(file: string, anchor: string) {
    super(
      `${file}: expected anchor not found (${anchor}). The Capacitor template ` +
        'has probably changed; update utils/native-patches.mts to match it.'
    );
    this.name = 'PatchAnchorError';
  }
}

/**
 * Why the app asks for the camera and the photo library, which iOS shows in
 * the permission prompt and refuses to open either without. Sore photos stay
 * in the app's own storage, so the copy says so.
 */
export const PHOTO_USAGE_STRINGS: Record<string, string> = {
  NSCameraUsageDescription:
    'Take a photo of a sore to see how it changes. Photos stay on this device and are never uploaded.',
  NSPhotoLibraryUsageDescription:
    'Pick a photo of a sore from your library. It is copied into the app on this device and never uploaded.'
};

const plistString = (key: string, value: string) =>
  `\t<key>${key}</key>\n\t<string>${value}</string>\n`;

/**
 * Sets the photo usage strings in the top-level dict: rewrites a key whose
 * text differs from PHOTO_USAGE_STRINGS (this file is the source of truth)
 * and adds a missing one before the closing tag.
 */
export function patchInfoPlistPhotoUsage(text: string): PatchResult {
  let out = text;
  const missing: string[] = [];
  for (const [key, value] of Object.entries(PHOTO_USAGE_STRINGS)) {
    const existing = new RegExp(
      `(<key>${key}</key>\\s*<string>)([^<]*)(</string>)`
    );
    const match = out.match(existing);
    if (!match) missing.push(key);
    else if (match[2] !== value) {
      out = out.replace(
        existing,
        (_all, open, _old, close) => `${open}${value}${close}`
      );
    }
  }
  if (missing.length) {
    const anchor = /\n<\/dict>\s*\n<\/plist>\s*$/;
    if (!anchor.test(out)) {
      throw new PatchAnchorError('Info.plist', 'closing </dict></plist>');
    }
    const added = missing
      .map((key) => plistString(key, PHOTO_USAGE_STRINGS[key]))
      .join('');
    out = out.replace(anchor, (tail) => `\n${added}${tail.slice(1)}`);
  }
  return { text: out, changed: out !== text };
}

/**
 * Associated Domains, so iOS trusts the app with cankercore.com: its saved
 * passwords (webcredentials: iCloud Keychain autofill and strong-password
 * suggestions in the sign-in forms) and the universal link the iOS system
 * sign-in returns through (applinks: /native-auth/callback, which only this
 * app can then receive). The other half is
 * public/.well-known/apple-app-site-association, which names this app
 * (team 4J28Z4QS4C) back.
 */
export const ENTITLEMENTS_PATH = 'App/App.entitlements';
export const ASSOCIATED_DOMAINS = [
  'webcredentials:cankercore.com',
  'applinks:cankercore.com'
];
const ASSOCIATED_DOMAINS_KEY =
  '<key>com.apple.developer.associated-domains</key>';

const domainStrings = (domains: string[]) =>
  domains.map((d) => `\t\t<string>${d}</string>\n`).join('');

const domainsBlock = (domains: string[]) =>
  `\t${ASSOCIATED_DOMAINS_KEY}\n\t<array>\n${domainStrings(domains)}\t</array>\n`;

/**
 * Writes or completes ios/App/App/App.entitlements. Empty input means the file
 * does not exist yet (the Capacitor template has none). An existing file
 * keeps everything it has; only missing domains are added.
 */
export function patchEntitlements(text: string): PatchResult {
  if (text.trim() === '') {
    const out =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n' +
      '<plist version="1.0">\n<dict>\n' +
      domainsBlock(ASSOCIATED_DOMAINS) +
      '</dict>\n</plist>\n';
    return { text: out, changed: true };
  }

  const missing = ASSOCIATED_DOMAINS.filter(
    (d) => !text.includes(`<string>${d}</string>`)
  );
  if (missing.length === 0) return { text, changed: false };

  if (text.includes(ASSOCIATED_DOMAINS_KEY)) {
    const array =
      /(<key>com\.apple\.developer\.associated-domains<\/key>\s*<array>\n)/;
    if (!array.test(text)) {
      throw new PatchAnchorError(
        'App.entitlements',
        'associated-domains <array>'
      );
    }
    const out = text.replace(array, (head) => head + domainStrings(missing));
    return { text: out, changed: true };
  }

  const anchor = /\n<\/dict>\s*\n<\/plist>\s*$/;
  if (!anchor.test(text)) {
    throw new PatchAnchorError('App.entitlements', 'closing </dict></plist>');
  }
  const out = text.replace(
    anchor,
    (tail) => `\n${domainsBlock(missing)}${tail.slice(1)}`
  );
  return { text: out, changed: true };
}

const ENTITLEMENTS_SETTING = `CODE_SIGN_ENTITLEMENTS = ${ENTITLEMENTS_PATH};`;

/**
 * Points the App target's Debug and Release configurations at the
 * entitlements file. Those are the two configurations that name the app's
 * Info.plist, so the setting goes on the line before each of them. A
 * different CODE_SIGN_ENTITLEMENTS is refused rather than overwritten.
 */
export function patchPbxprojEntitlements(text: string): PatchResult {
  const anchor = /^([ \t]*)INFOPLIST_FILE = App\/Info\.plist;$/gm;
  const anchors = text.match(anchor)?.length ?? 0;
  if (anchors === 0) {
    throw new PatchAnchorError(
      'project.pbxproj',
      'INFOPLIST_FILE = App/Info.plist;'
    );
  }
  const all = text.match(/CODE_SIGN_ENTITLEMENTS = [^;]*;/g) ?? [];
  if (all.some((setting) => setting !== ENTITLEMENTS_SETTING)) {
    throw new Error(
      'project.pbxproj already sets a CODE_SIGN_ENTITLEMENTS that ' +
        'scripts/patch-native.mjs did not write. Regenerate the iOS project ' +
        '(rm -rf ios && npm run cap:add:ios) so the script can apply its own.'
    );
  }
  if (all.length === anchors) return { text, changed: false };
  if (all.length !== 0) {
    throw new Error(
      `project.pbxproj has ${ENTITLEMENTS_SETTING} on only some of the ` +
        "app's configurations. Regenerate the iOS project " +
        '(rm -rf ios && npm run cap:add:ios).'
    );
  }
  const out = text.replace(
    anchor,
    (line, indent: string) => `${indent}${ENTITLEMENTS_SETTING}\n${line}`
  );
  return { text: out, changed: true };
}

/** Android notification small icon: densities and their pixel sizes. */
export const NOTIFICATION_ICON_NAME = 'ic_stat_kanko';

export const NOTIFICATION_ICON_SIZES = {
  mdpi: 24,
  hdpi: 36,
  xhdpi: 48,
  xxhdpi: 72,
  xxxhdpi: 96
} as const;

/** Committed source -> generated Android destination, relative paths. */
export function notificationIconCopies(): { from: string; to: string }[] {
  return Object.keys(NOTIFICATION_ICON_SIZES).map((density) => ({
    from: `resources/notification/drawable-${density}/${NOTIFICATION_ICON_NAME}.png`,
    to: `android/app/src/main/res/drawable-${density}/${NOTIFICATION_ICON_NAME}.png`
  }));
}

/**
 * The App Link the Android system sign-in returns through
 * (utils/native-auth.ts). Google and GitHub sign-in run in a Chrome Custom
 * Tab, which ends on https://cankercore.com/native-auth/callback. This filter
 * on MainActivity claims exactly that path, and android:autoVerify makes
 * Android check public/.well-known/assetlinks.json, so once verified the link
 * opens only this app. Exactly that path and no wider: Chrome keeps a
 * same-host navigation in the tab when the page it leaves opens in the same
 * apps, so a filter matching the whole site would strand the callback in the
 * tab (and pull ordinary links into the app).
 *
 * MainActivity must stay singleTask: the App Link then reaches the running
 * activity through onNewIntent, which also closes the Custom Tab above it.
 */
export const APP_LINK_HOST = 'cankercore.com';
export const APP_LINK_PATH = '/native-auth/callback';
export const APP_LINK_MARKER = '<!-- patch-native: sign-in app link -->';

export const APP_LINK_FILTER =
  `            ${APP_LINK_MARKER}\n` +
  '            <intent-filter android:autoVerify="true">\n' +
  '                <action android:name="android.intent.action.VIEW" />\n' +
  '                <category android:name="android.intent.category.DEFAULT" />\n' +
  '                <category android:name="android.intent.category.BROWSABLE" />\n' +
  `                <data android:scheme="https" android:host="${APP_LINK_HOST}" android:path="${APP_LINK_PATH}" />\n` +
  '            </intent-filter>\n';

const MAIN_ACTIVITY =
  /(<activity\b[^>]*\bandroid:name="\.MainActivity"[^>]*>)([\s\S]*?)(\n[ \t]*<\/activity>)/;

/** Adds the sign-in App Link intent-filter to MainActivity, once. */
export function patchAndroidManifest(text: string): PatchResult {
  if (text.includes(APP_LINK_MARKER)) {
    if (text.includes(APP_LINK_FILTER)) return { text, changed: false };
    throw new Error(
      'AndroidManifest.xml has a sign-in app link that differs from the one ' +
        'scripts/patch-native.mjs writes. Regenerate the Android project ' +
        '(rm -rf android && npm run cap:add:android).'
    );
  }

  const match = text.match(MAIN_ACTIVITY);
  if (!match) {
    throw new PatchAnchorError(
      'AndroidManifest.xml',
      '<activity android:name=".MainActivity"> … </activity>'
    );
  }
  if (!/\bandroid:launchMode="singleTask"/.test(match[1])) {
    throw new PatchAnchorError(
      'AndroidManifest.xml',
      'MainActivity android:launchMode="singleTask"'
    );
  }
  const out = text.replace(
    MAIN_ACTIVITY,
    (_all, open: string, body: string, close: string) =>
      `${open}${body.replace(/\n+$/, '\n')}\n${APP_LINK_FILTER.slice(0, -1)}${close}`
  );
  return { text: out, changed: true };
}

/**
 * Sore photos must never leave the phone, but on Android the filesystem
 * plugin's LibraryNoCloud is the app's files dir (the same as Data), which
 * Auto Backup copies to Google Drive and to a new phone. These rules exclude
 * the photo folder from both. utils/sore-photos.ts writes to this folder.
 */
export const SORE_PHOTO_FOLDER = 'sore-photos';

export const BACKUP_RULES_PATH =
  'android/app/src/main/res/xml/backup_rules.xml';
export const DATA_EXTRACTION_RULES_PATH =
  'android/app/src/main/res/xml/data_extraction_rules.xml';

const PHOTO_EXCLUDE = `<exclude domain="file" path="${SORE_PHOTO_FOLDER}" />`;

/** Android 11 and older: android:fullBackupContent. */
export const BACKUP_RULES_XML = `<?xml version="1.0" encoding="utf-8"?>
<!-- Written by scripts/patch-native.mjs: sore photos stay on the device. -->
<full-backup-content>
    ${PHOTO_EXCLUDE}
</full-backup-content>
`;

/** Android 12 and newer: android:dataExtractionRules, cloud and transfer. */
export const DATA_EXTRACTION_RULES_XML = `<?xml version="1.0" encoding="utf-8"?>
<!-- Written by scripts/patch-native.mjs: sore photos stay on the device. -->
<data-extraction-rules>
    <cloud-backup>
        ${PHOTO_EXCLUDE}
    </cloud-backup>
    <device-transfer>
        ${PHOTO_EXCLUDE}
    </device-transfer>
</data-extraction-rules>
`;

export function backupRuleFiles(): { path: string; text: string }[] {
  return [
    { path: BACKUP_RULES_PATH, text: BACKUP_RULES_XML },
    { path: DATA_EXTRACTION_RULES_PATH, text: DATA_EXTRACTION_RULES_XML }
  ];
}

export const BACKUP_ATTRIBUTES: Record<string, string> = {
  'android:fullBackupContent': '@xml/backup_rules',
  'android:dataExtractionRules': '@xml/data_extraction_rules'
};

/**
 * Points <application> at the backup rule files. An attribute already
 * naming something else is someone else's rule set, so it stops the run
 * rather than being replaced.
 */
export function patchAndroidBackupRules(text: string): PatchResult {
  const match = text.match(/<application\b[^>]*>/);
  if (!match) {
    throw new PatchAnchorError('AndroidManifest.xml', '<application …>');
  }
  let tag = match[0];
  for (const [name, value] of Object.entries(BACKUP_ATTRIBUTES)) {
    const current = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
    if (current) {
      if (current[1] === value) continue;
      throw new Error(
        `AndroidManifest.xml sets ${name}="${current[1]}", not "${value}". ` +
          'Remove it or merge its rules into the files scripts/patch-native.mjs writes.'
      );
    }
    tag = tag.replace(
      /^<application\b/,
      `<application\n        ${name}="${value}"`
    );
  }
  if (tag === match[0]) return { text, changed: false };
  return { text: text.replace(match[0], tag), changed: true };
}
