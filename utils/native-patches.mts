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

/**
 * Why the app asks to read Health (iOS shows this in the permission sheet and
 * refuses to ask without it). utils/health-sleep.ts requests no write types,
 * so HealthKit itself never asks for NSHealthUpdateUsageDescription; it is
 * declared anyway because App Store Connect's purpose-string check
 * (ITMS-90683) wants both keys on a HealthKit-linked binary. The copy says
 * truthfully that the app never writes.
 */
export const HEALTH_USAGE_STRINGS: Record<string, string> = {
  NSHealthShareUsageDescription:
    'Reads your sleep only when you tap Import from Health, to fill in hours asleep. Only the total hours are saved to your check-in.',
  NSHealthUpdateUsageDescription:
    'Canker Core never writes to Health. It only reads your sleep when you tap Import from Health.'
};

const plistString = (key: string, value: string) =>
  `\t<key>${key}</key>\n\t<string>${value}</string>\n`;

/**
 * A patch that sets usage strings in the top-level dict: rewrites a key whose
 * text differs from `strings` (this file is the source of truth) and adds a
 * missing one before the closing tag.
 */
const infoPlistUsagePatch =
  (strings: Record<string, string>) =>
  (text: string): PatchResult => {
    let out = text;
    const missing: string[] = [];
    for (const [key, value] of Object.entries(strings)) {
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
        .map((key) => plistString(key, strings[key]))
        .join('');
      out = out.replace(anchor, (tail) => `\n${added}${tail.slice(1)}`);
    }
    return { text: out, changed: out !== text };
  };

/** The camera and photo library usage strings (PHOTO_USAGE_STRINGS). */
export const patchInfoPlistPhotoUsage =
  infoPlistUsagePatch(PHOTO_USAGE_STRINGS);

/** The Health read usage string (HEALTH_USAGE_STRINGS). */
export const patchInfoPlistHealthUsage =
  infoPlistUsagePatch(HEALTH_USAGE_STRINGS);

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

/**
 * The HealthKit capability, as Xcode writes it when the capability is ticked:
 * the healthkit flag, and an empty access list (no clinical records). The
 * Health sleep import (utils/health-sleep.ts) cannot ask without it.
 */
export const HEALTHKIT_ENTITLEMENTS =
  '\t<key>com.apple.developer.healthkit</key>\n\t<true/>\n' +
  '\t<key>com.apple.developer.healthkit.access</key>\n\t<array/>\n';

/**
 * Adds HEALTHKIT_ENTITLEMENTS to App.entitlements (runs after
 * patchEntitlements, so the file exists). A healthkit key already set some
 * other way stops the run rather than being rewritten.
 */
export function patchEntitlementsHealthKit(text: string): PatchResult {
  if (text.includes(HEALTHKIT_ENTITLEMENTS)) return { text, changed: false };
  if (text.includes('<key>com.apple.developer.healthkit')) {
    throw new Error(
      'App.entitlements has HealthKit keys that scripts/patch-native.mjs did ' +
        'not write. Regenerate the iOS project (rm -rf ios && npm run cap:add:ios).'
    );
  }
  const anchor = /\n<\/dict>\s*\n<\/plist>\s*$/;
  if (!anchor.test(text)) {
    throw new PatchAnchorError('App.entitlements', 'closing </dict></plist>');
  }
  const out = text.replace(
    anchor,
    (tail) => `\n${HEALTHKIT_ENTITLEMENTS}${tail.slice(1)}`
  );
  return { text: out, changed: true };
}

/**
 * Sign in with Apple, as Xcode writes it when the capability is ticked. The
 * native Apple sheet (the web-auth plugin's `apple`) fails at once without
 * it, and a signed build fails to provision unless the App ID has the
 * capability too.
 */
export const APPLE_SIGNIN_ENTITLEMENTS =
  '\t<key>com.apple.developer.applesignin</key>\n\t<array>\n\t\t<string>Default</string>\n\t</array>\n';

/**
 * Adds APPLE_SIGNIN_ENTITLEMENTS to App.entitlements (runs after
 * patchEntitlements, so the file exists). An applesignin key already set some
 * other way stops the run rather than being rewritten.
 */
export function patchEntitlementsAppleSignIn(text: string): PatchResult {
  if (text.includes(APPLE_SIGNIN_ENTITLEMENTS)) return { text, changed: false };
  if (text.includes('<key>com.apple.developer.applesignin</key>')) {
    throw new Error(
      'App.entitlements has a Sign in with Apple key that scripts/patch-native.mjs ' +
        'did not write. Regenerate the iOS project (rm -rf ios && npm run cap:add:ios).'
    );
  }
  const anchor = /\n<\/dict>\s*\n<\/plist>\s*$/;
  if (!anchor.test(text)) {
    throw new PatchAnchorError('App.entitlements', 'closing </dict></plist>');
  }
  const out = text.replace(
    anchor,
    (tail) => `\n${APPLE_SIGNIN_ENTITLEMENTS}${tail.slice(1)}`
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

/**
 * The Capacitor 8 Android template raised compileSdkVersion to 36 (the
 * Capacitor 7 one had 35), which makes variables.gradle a reliable marker of
 * which template generated android/. Older projects stop the run: the other
 * patches assume the Capacitor 8 layout.
 */
export const ANDROID_MIN_COMPILE_SDK = 36;

export function assertCapacitor8Android(variablesGradle: string): void {
  const match = variablesGradle.match(
    /^[ \t]*compileSdkVersion[ \t]*=[ \t]*(\d+)\b/m
  );
  if (!match || Number(match[1]) < ANDROID_MIN_COMPILE_SDK) {
    throw new Error(
      `android/ predates Capacitor 8 (compileSdkVersion ${match?.[1] ?? 'not found'} in variables.gradle, ` +
        `expected ${ANDROID_MIN_COMPILE_SDK} or higher). ` +
        'Regenerate it: rm -rf android && npm run cap:add:android'
    );
  }
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

/**
 * Health Connect, for the sleep import (utils/health-sleep.ts). The app reads
 * sleep and nothing else, so it declares READ_SLEEP itself, and strips every
 * other health permission the @capgo/capacitor-health library manifest
 * merges in (it declares read and write for some twenty types). Google Play
 * makes an app justify each health permission it declares, so the merged
 * manifest has to carry only the one in use.
 *
 * The library manifest also brings its own privacy-policy rationale activity
 * (ACTION_SHOW_PERMISSIONS_RATIONALE, Android 13 and older), the
 * VIEW_PERMISSION_USAGE activity-alias (Android 14 and newer) and the
 * <queries> entry for com.google.android.apps.healthdata, so none of those
 * are added here; that activity shows HEALTH_PRIVACY_POLICY_URL.
 */
export const HEALTH_READ_PERMISSION = 'android.permission.health.READ_SLEEP';
export const HEALTH_PERMISSIONS_MARKER =
  '<!-- patch-native: health permissions -->';
const HEALTH_PERMISSIONS_END = '<!-- /patch-native: health permissions -->';
const TOOLS_NS = 'xmlns:tools="http://schemas.android.com/tools"';

/**
 * Every health permission a library manifest declares, other than READ_SLEEP.
 * A health permission another plugin needs must be filtered out of this list
 * too, or this patch strips it from the merged manifest.
 */
export function unwantedHealthPermissions(libraryManifest: string): string[] {
  const names: string[] =
    libraryManifest.match(
      /(?<=<uses-permission\s+android:name=")android\.permission\.health\.[^"]+/g
    ) ?? [];
  return names
    .filter((n, i) => n !== HEALTH_READ_PERMISSION && names.indexOf(n) === i)
    .sort();
}

export const healthPermissionsBlock = (remove: string[]) =>
  `    ${HEALTH_PERMISSIONS_MARKER}\n` +
  `    <uses-permission android:name="${HEALTH_READ_PERMISSION}" />\n` +
  remove
    .map(
      (name) =>
        `    <uses-permission android:name="${name}" tools:node="remove" />\n`
    )
    .join('') +
  `    ${HEALTH_PERMISSIONS_END}\n`;

/**
 * Writes the health permission block before </manifest>, replacing an earlier
 * one (the library's list can change between versions), and declares the
 * tools namespace the removals need.
 */
export function patchAndroidHealthPermissions(
  text: string,
  remove: string[]
): PatchResult {
  const block = healthPermissionsBlock(remove);
  let out = text;
  const open = out.match(/<manifest\b[^>]*>/);
  if (!open) throw new PatchAnchorError('AndroidManifest.xml', '<manifest …>');
  if (!open[0].includes(TOOLS_NS)) {
    out = out.replace(
      open[0],
      open[0].replace(/^<manifest\b/, `<manifest ${TOOLS_NS}`)
    );
  }

  const existing = new RegExp(
    `[ \\t]*${HEALTH_PERMISSIONS_MARKER}\\n[\\s\\S]*?${HEALTH_PERMISSIONS_END}\\n`
  );
  if (existing.test(out)) {
    out = out.replace(existing, () => block);
  } else {
    const anchor = /\n<\/manifest>\s*$/;
    if (!anchor.test(out)) {
      throw new PatchAnchorError('AndroidManifest.xml', 'closing </manifest>');
    }
    out = out.replace(anchor, (tail) => `\n${block}${tail.slice(1)}`);
  }
  return { text: out, changed: out !== text };
}

/**
 * Health Connect needs Android 8.0 (API 26), and the plugin's library
 * manifest says so, which fails the manifest merge against the Capacitor 8
 * template's minSdkVersion 24. Raised to 26 in android/variables.gradle; a
 * higher value is left alone.
 */
export const HEALTH_MIN_SDK = 26;

export function patchAndroidMinSdk(text: string): PatchResult {
  const anchor = /^([ \t]*minSdkVersion[ \t]*=[ \t]*)(\d+)\b/m;
  const match = text.match(anchor);
  if (!match) {
    throw new PatchAnchorError('variables.gradle', 'minSdkVersion = <n>');
  }
  if (Number(match[2]) >= HEALTH_MIN_SDK) return { text, changed: false };
  const out = text.replace(
    anchor,
    (_all, head: string) => `${head}${HEALTH_MIN_SDK}`
  );
  return { text: out, changed: true };
}

/**
 * What Health Connect shows when the person taps "Privacy policy" in its
 * permission sheet: the plugin's rationale activity loads this string
 * resource in a WebView (JavaScript off, which the server-rendered page does
 * not need).
 */
export const HEALTH_PRIVACY_POLICY_URL = 'https://cankercore.com/privacy';
const PRIVACY_STRING = `<string name="health_connect_privacy_policy_url">${HEALTH_PRIVACY_POLICY_URL}</string>`;

export function patchAndroidStrings(text: string): PatchResult {
  const existing =
    /<string name="health_connect_privacy_policy_url">[^<]*<\/string>/;
  if (existing.test(text)) {
    const out = text.replace(existing, PRIVACY_STRING);
    return { text: out, changed: out !== text };
  }
  const anchor = /\n<\/resources>\s*$/;
  if (!anchor.test(text)) {
    throw new PatchAnchorError('strings.xml', 'closing </resources>');
  }
  const out = text.replace(anchor, (tail) => `\n    ${PRIVACY_STRING}${tail}`);
  return { text: out, changed: true };
}

/**
 * The store version of the native apps. `native/version.json` holds the
 * marketing version (CFBundleShortVersionString, Android versionName), which
 * changes only on purpose: App Store Connect refuses a build for a version
 * train it has already approved, so it moves on after each approval. The
 * build number (CFBundleVersion, Android versionCode) is the commit count of
 * main, as the site's "v1.N" is, so every build cut from a newer main gets a
 * higher number with nothing to remember. Both stores insist the number only
 * rises, so `minBuildNumber` is a floor above the last upload: 1.0 (111)
 * on iOS, 1.0 (113) on Play.
 */
export type NativeVersion = { marketing: string; build: string };

export function parseNativeVersionFile(json: string): {
  marketing: string;
  minBuild: number;
} {
  const data = JSON.parse(json) as {
    marketingVersion?: unknown;
    minBuildNumber?: unknown;
  };
  const marketing = String(data.marketingVersion ?? '');
  // Apple: one to three period-separated integers.
  if (!/^\d+(\.\d+){0,2}$/.test(marketing)) {
    throw new Error(
      `native/version.json: marketingVersion "${marketing}" is not like 1.0 or 1.0.1`
    );
  }
  const minBuild = Number(data.minBuildNumber);
  if (!Number.isInteger(minBuild) || minBuild < 1) {
    throw new Error(
      'native/version.json: minBuildNumber must be a whole number'
    );
  }
  return { marketing, minBuild };
}

/**
 * The build number for this build. `override` (NATIVE_BUILD_NUMBER) wins, for
 * a store build cut off main; otherwise main's commit count from git, which is
 * undefined off origin/main or in a shallow clone. Undefined means a
 * development build, numbered 1 so it can never pass for a store build. A
 * store number at or below the floor is refused: the stores would refuse it
 * later, after a long archive.
 */
export function nativeBuildNumber(
  override: string | undefined,
  gitCount: string | undefined,
  minBuild: number
): { build: string; store: boolean } {
  const raw = override?.trim() || gitCount?.trim();
  if (!raw) return { build: '1', store: false };
  if (!/^[1-9]\d*$/.test(raw)) {
    throw new Error(`build number "${raw}" is not a positive whole number`);
  }
  if (Number(raw) < minBuild) {
    throw new Error(
      `build number ${raw} is below minBuildNumber ${minBuild} in ` +
        'native/version.json; the stores only take a number higher than the last upload'
    );
  }
  return { build: raw, store: true };
}

/**
 * Writes MARKETING_VERSION and CURRENT_PROJECT_VERSION into every
 * configuration of the App target that sets them (Debug and Release), so
 * Xcode, `xcodebuild archive` and the Info.plist's $(…) references all agree.
 */
export function patchPbxprojVersion(
  text: string,
  version: NativeVersion
): PatchResult {
  const settings: [RegExp, string][] = [
    [/^([ \t]*MARKETING_VERSION = )[^;]*;$/gm, version.marketing],
    [/^([ \t]*CURRENT_PROJECT_VERSION = )[^;]*;$/gm, version.build]
  ];
  let out = text;
  for (const [pattern, value] of settings) {
    if (!pattern.test(out)) {
      throw new PatchAnchorError('project.pbxproj', pattern.source);
    }
    out = out.replace(pattern, (_all, head: string) => `${head}${value};`);
  }
  return { text: out, changed: out !== text };
}

/** The same two numbers as Android's versionName and versionCode. */
export function patchAndroidVersion(
  text: string,
  version: NativeVersion
): PatchResult {
  const code = /^([ \t]*versionCode[ \t]+)\d+[ \t]*$/m;
  const name = /^([ \t]*versionName[ \t]+)"[^"]*"[ \t]*$/m;
  if (!code.test(text)) {
    throw new PatchAnchorError('app/build.gradle', 'versionCode <n>');
  }
  if (!name.test(text)) {
    throw new PatchAnchorError('app/build.gradle', 'versionName "<v>"');
  }
  const out = text
    .replace(code, (_all, head: string) => `${head}${version.build}`)
    .replace(name, (_all, head: string) => `${head}"${version.marketing}"`);
  return { text: out, changed: out !== text };
}

/**
 * The app's only cryptography is the system's HTTPS, which is exempt from
 * US export rules. Saying so in Info.plist stops App Store Connect asking the
 * export-compliance question on every build, which otherwise holds the build
 * out of TestFlight and review until someone answers it by hand.
 */
const ENCRYPTION_KEY = '<key>ITSAppUsesNonExemptEncryption</key>';
const ENCRYPTION_ENTRY = `\t${ENCRYPTION_KEY}\n\t<false/>\n`;

export function patchInfoPlistEncryption(text: string): PatchResult {
  if (text.includes(ENCRYPTION_KEY)) {
    if (new RegExp(`${ENCRYPTION_KEY}\\s*<false/>`).test(text)) {
      return { text, changed: false };
    }
    throw new Error(
      'Info.plist declares ITSAppUsesNonExemptEncryption as true. The app ' +
        'uses only system HTTPS; remove the key so scripts/patch-native.mjs can set it.'
    );
  }
  const anchor = /\n<\/dict>\s*\n<\/plist>\s*$/;
  if (!anchor.test(text)) {
    throw new PatchAnchorError('Info.plist', 'closing </dict></plist>');
  }
  const out = text.replace(
    anchor,
    (tail) => `\n${ENCRYPTION_ENTRY}${tail.slice(1)}`
  );
  return { text: out, changed: true };
}

/**
 * The app's privacy manifest, ios/App/App/PrivacyInfo.xcprivacy. Apple reads
 * it into the privacy report for the App Privacy label, and refuses uploads
 * whose code calls a "required reason" API without a declared reason.
 * Capacitor's own frameworks carry manifests for their own calls; this one
 * covers the app and the statically linked plugins: the filesystem plugin
 * reads file timestamps of the sore photos it stores (C617.1, files inside
 * the app's container), and the plugins' settings live in UserDefaults
 * (CA92.1, the app's own defaults).
 *
 * The collected data must match the App Privacy answers in docs/store: what
 * the server keeps for an account (email, name, user id), the sores and
 * readings and daily logs (health), and free-text notes (other user
 * content), plus where the account first arrived from (usage data, for
 * first-party analytics). All of it is linked to the account and none of it
 * is used for tracking; sore photos never leave the phone, so they are not
 * collected.
 */
export const PRIVACY_MANIFEST_PATH = 'App/PrivacyInfo.xcprivacy';

const collected = ([type, purpose]: [string, string]) =>
  '\t\t<dict>\n' +
  `\t\t\t<key>NSPrivacyCollectedDataType</key>\n\t\t\t<string>${type}</string>\n` +
  '\t\t\t<key>NSPrivacyCollectedDataTypeLinked</key>\n\t\t\t<true/>\n' +
  '\t\t\t<key>NSPrivacyCollectedDataTypeTracking</key>\n\t\t\t<false/>\n' +
  '\t\t\t<key>NSPrivacyCollectedDataTypePurposes</key>\n\t\t\t<array>\n' +
  `\t\t\t\t<string>NSPrivacyCollectedDataTypePurpose${purpose}</string>\n` +
  '\t\t\t</array>\n' +
  '\t\t</dict>\n';

const accessed = (category: string, reason: string) =>
  '\t\t<dict>\n' +
  `\t\t\t<key>NSPrivacyAccessedAPIType</key>\n\t\t\t<string>${category}</string>\n` +
  '\t\t\t<key>NSPrivacyAccessedAPITypeReasons</key>\n\t\t\t<array>\n' +
  `\t\t\t\t<string>${reason}</string>\n` +
  '\t\t\t</array>\n' +
  '\t\t</dict>\n';

export const COLLECTED_DATA_TYPES: [string, string][] = [
  ['NSPrivacyCollectedDataTypeEmailAddress', 'AppFunctionality'],
  ['NSPrivacyCollectedDataTypeName', 'AppFunctionality'],
  ['NSPrivacyCollectedDataTypeUserID', 'AppFunctionality'],
  ['NSPrivacyCollectedDataTypeHealth', 'AppFunctionality'],
  ['NSPrivacyCollectedDataTypeOtherUserContent', 'AppFunctionality'],
  // The first page visited and the referring site, kept with a new account
  // to credit signups to articles (utils/first-touch.ts). First-party only.
  ['NSPrivacyCollectedDataTypeOtherUsageData', 'Analytics']
];

export const PRIVACY_MANIFEST_XML =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n' +
  '<!-- Written by scripts/patch-native.mjs (utils/native-patches.mts). -->\n' +
  '<plist version="1.0">\n<dict>\n' +
  '\t<key>NSPrivacyTracking</key>\n\t<false/>\n' +
  '\t<key>NSPrivacyTrackingDomains</key>\n\t<array/>\n' +
  '\t<key>NSPrivacyCollectedDataTypes</key>\n\t<array>\n' +
  COLLECTED_DATA_TYPES.map(collected).join('') +
  '\t</array>\n' +
  '\t<key>NSPrivacyAccessedAPITypes</key>\n\t<array>\n' +
  accessed('NSPrivacyAccessedAPICategoryFileTimestamp', 'C617.1') +
  accessed('NSPrivacyAccessedAPICategoryUserDefaults', 'CA92.1') +
  '\t</array>\n' +
  '</dict>\n</plist>\n';

// Fixed object ids, so the patch recognises its own entries on a rerun.
const PRIVACY_FILE_REF = 'CC0A11E00000000000000001';
const PRIVACY_BUILD_FILE = 'CC0A11E00000000000000002';
const PRIVACY_LINES = {
  buildFile: `\t\t${PRIVACY_BUILD_FILE} /* PrivacyInfo.xcprivacy in Resources */ = {isa = PBXBuildFile; fileRef = ${PRIVACY_FILE_REF} /* PrivacyInfo.xcprivacy */; };\n`,
  fileRef: `\t\t${PRIVACY_FILE_REF} /* PrivacyInfo.xcprivacy */ = {isa = PBXFileReference; lastKnownFileType = text.xml; path = PrivacyInfo.xcprivacy; sourceTree = "<group>"; };\n`,
  groupChild: `\t\t\t\t${PRIVACY_FILE_REF} /* PrivacyInfo.xcprivacy */,\n`,
  resource: `\t\t\t\t${PRIVACY_BUILD_FILE} /* PrivacyInfo.xcprivacy in Resources */,\n`
};

/**
 * Adds PrivacyInfo.xcprivacy to the App group and the App target's Copy
 * Bundle Resources, as Xcode does when the file is dragged in. Without that
 * the file sits beside the sources and never reaches the app bundle.
 */
export function patchPbxprojPrivacyManifest(text: string): PatchResult {
  const lines = Object.values(PRIVACY_LINES);
  if (lines.every((line) => text.includes(line))) {
    return { text, changed: false };
  }
  if (text.includes('PrivacyInfo.xcprivacy')) {
    throw new Error(
      'project.pbxproj lists a PrivacyInfo.xcprivacy that scripts/patch-native.mjs ' +
        'did not add. Regenerate the iOS project (rm -rf ios && npm run cap:add:ios).'
    );
  }
  const anchors: [RegExp, string, string][] = [
    [
      /(\/\* Begin PBXBuildFile section \*\/\n)/,
      PRIVACY_LINES.buildFile,
      'PBXBuildFile section'
    ],
    [
      /(\/\* Begin PBXFileReference section \*\/\n)/,
      PRIVACY_LINES.fileRef,
      'PBXFileReference section'
    ],
    [
      /(\/\* App \*\/ = \{\n\t\t\tisa = PBXGroup;\n\t\t\tchildren = \(\n)/,
      PRIVACY_LINES.groupChild,
      'App PBXGroup children'
    ],
    [
      /(isa = PBXResourcesBuildPhase;\n\t\t\tbuildActionMask = \d+;\n\t\t\tfiles = \(\n)/,
      PRIVACY_LINES.resource,
      'PBXResourcesBuildPhase files'
    ]
  ];
  let out = text;
  for (const [anchor, line, name] of anchors) {
    if ((out.match(new RegExp(anchor.source, 'g')) ?? []).length !== 1) {
      throw new PatchAnchorError('project.pbxproj', name);
    }
    out = out.replace(anchor, (head) => head + line);
  }
  return { text: out, changed: true };
}

/**
 * Permissions plugins merge in that the app does not want. The local
 * notifications plugin declares SCHEDULE_EXACT_ALARM, which Google Play
 * restricts to alarm and calendar apps and Android 14 denies by default; the
 * daily reminders are scheduled inexact (utils/reminders.ts), so it goes.
 */
export const REMOVED_PERMISSIONS = ['android.permission.SCHEDULE_EXACT_ALARM'];
const REMOVED_MARKER = '<!-- patch-native: removed permissions -->';
const REMOVED_END = '<!-- /patch-native: removed permissions -->';

export const removedPermissionsBlock = () =>
  `    ${REMOVED_MARKER}\n` +
  REMOVED_PERMISSIONS.map(
    (name) =>
      `    <uses-permission android:name="${name}" tools:node="remove" />\n`
  ).join('') +
  `    ${REMOVED_END}\n`;

export function patchAndroidRemovedPermissions(text: string): PatchResult {
  const block = removedPermissionsBlock();
  let out = text;
  const open = out.match(/<manifest\b[^>]*>/);
  if (!open) throw new PatchAnchorError('AndroidManifest.xml', '<manifest …>');
  if (!open[0].includes(TOOLS_NS)) {
    out = out.replace(
      open[0],
      open[0].replace(/^<manifest\b/, `<manifest ${TOOLS_NS}`)
    );
  }
  const existing = new RegExp(
    `[ \\t]*${REMOVED_MARKER}\\n[\\s\\S]*?${REMOVED_END}\\n`
  );
  if (existing.test(out)) {
    out = out.replace(existing, () => block);
  } else {
    const anchor = /\n<\/manifest>\s*$/;
    if (!anchor.test(out)) {
      throw new PatchAnchorError('AndroidManifest.xml', 'closing </manifest>');
    }
    out = out.replace(anchor, (tail) => `\n${block}${tail.slice(1)}`);
  }
  return { text: out, changed: out !== text };
}
