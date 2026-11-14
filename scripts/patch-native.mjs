/**
 * Re-applies the fixes the generated native projects need, which would
 * otherwise vanish every time `ios/` or `android/` is regenerated.
 *
 *   npm run cap:patch                 (also run by cap:add:*, cap:sync, cap:ios, cap:android)
 *
 * iOS (the Capacitor 8 CocoaPods template, which already targets iOS 15.0
 * and ships the UIScene lifecycle that iOS 27 requires):
 *   - App.entitlements with Associated Domains (webcredentials: and
 *     applinks:cankercore.com) and CODE_SIGN_ENTITLEMENTS pointing at it, so
 *     iCloud Keychain offers the site's saved passwords in the app and the
 *     system sign-in's universal-link callback reaches only this app;
 *   - camera and photo library usage strings in Info.plist, which iOS needs
 *     before it lets the sore photo control open either;
 *   - the HealthKit capability in App.entitlements and the Health read usage
 *     string (NSHealthShareUsageDescription, plus NSHealthUpdateUsageDescription for
 *     App Store Connect's purpose-string check) for the sleep import.
 * Android:
 *   - an autoVerify App Link intent-filter on MainActivity for
 *     https://cankercore.com/native-auth/callback, so the system sign-in's
 *     Custom Tab returns to this app (public/.well-known/assetlinks.json is
 *     the other half);
 *   - the white Kanko notification small icon from resources/notification.
 *   - backup rules that keep the sore-photos folder out of Auto Backup and
 *     device transfer (res/xml/backup_rules.xml, data_extraction_rules.xml,
 *     referenced from <application>), because the filesystem plugin's
 *     LibraryNoCloud is the ordinary, backed-up files dir on Android;
 *   - Health Connect for the sleep import: READ_SLEEP declared, every other
 *     health permission the @capgo/capacitor-health library merges in
 *     removed (read from its installed manifest), minSdkVersion raised to 26,
 *     and the privacy-policy URL its rationale screen shows.
 *
 * Safe to run repeatedly. A platform whose folder is missing is skipped; a
 * file whose expected anchor is missing stops the run with an error.
 * The patches themselves live in utils/native-patches.mts.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  backupRuleFiles,
  ENTITLEMENTS_PATH,
  notificationIconCopies,
  assertCapacitor8Android,
  patchAndroidBackupRules,
  patchAndroidHealthPermissions,
  patchAndroidManifest,
  patchAndroidMinSdk,
  patchAndroidStrings,
  patchEntitlements,
  patchEntitlementsHealthKit,
  patchEntitlementsAppleSignIn,
  patchInfoPlistHealthUsage,
  patchInfoPlistPhotoUsage,
  patchPbxprojEntitlements,
  unwantedHealthPermissions
} from '../utils/native-patches.mts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => path.relative(ROOT, p);

const has = (cmd) => spawnSync('sh', ['-c', `command -v ${cmd}`]).status === 0;

/** Runs patches in order on one text, changed if any of them changed it. */
const compose =
  (...patches) =>
  (input) =>
    patches.reduce(
      (acc, patch) => {
        const next = patch(acc.text);
        return { text: next.text, changed: acc.changed || next.changed };
      },
      { text: input, changed: false }
    );

const patchFile = (file, patch) => {
  if (!existsSync(file)) throw new Error(`${rel(file)} is missing`);
  const { text, changed } = patch(readFileSync(file, 'utf8'));
  if (changed) writeFileSync(file, text);
  console.log(`${changed ? 'patched' : 'already patched'}  ${rel(file)}`);
  return changed;
};

const patchIos = () => {
  const app = path.join(ROOT, 'ios/App');
  // Capacitor 8 defaults `cap add ios` to Swift Package Manager, which
  // leaves out native/plugins/web-auth (it ships only a podspec), so system
  // sign-in would silently vanish from the app.
  if (existsSync(path.join(app, 'CapApp-SPM'))) {
    throw new Error(
      'ios/ is a Swift Package Manager project, which drops the web-auth ' +
        'plugin. Regenerate it with CocoaPods: rm -rf ios && npm run cap:add:ios'
    );
  }
  // A project from the Capacitor 7 template has no scene lifecycle of its
  // own; these patches no longer add one.
  if (!existsSync(path.join(app, 'App/SceneDelegate.swift'))) {
    throw new Error(
      'ios/ predates Capacitor 8 (no App/SceneDelegate.swift). ' +
        'Regenerate it: rm -rf ios && npm run cap:add:ios'
    );
  }

  patchFile(
    path.join(app, 'App.xcodeproj/project.pbxproj'),
    patchPbxprojEntitlements
  );

  // The template has no entitlements file, so a missing one is created.
  const entitlements = path.join(app, ENTITLEMENTS_PATH);
  if (!existsSync(entitlements)) writeFileSync(entitlements, '');
  if (
    patchFile(
      entitlements,
      compose(
        patchEntitlements,
        patchEntitlementsHealthKit,
        patchEntitlementsAppleSignIn
      )
    ) &&
    has('plutil')
  ) {
    execFileSync('plutil', ['-lint', entitlements], { stdio: 'inherit' });
  }
  const plist = path.join(app, 'App/Info.plist');
  if (
    patchFile(
      plist,
      compose(patchInfoPlistPhotoUsage, patchInfoPlistHealthUsage)
    ) &&
    has('plutil')
  ) {
    execFileSync('plutil', ['-lint', plist], { stdio: 'inherit' });
  }
};

const HEALTH_LIBRARY_MANIFEST = path.join(
  ROOT,
  'node_modules/@capgo/capacitor-health/android/src/main/AndroidManifest.xml'
);

const patchAndroid = () => {
  const variables = path.join(ROOT, 'android/variables.gradle');
  if (!existsSync(variables)) throw new Error(`${rel(variables)} is missing`);
  assertCapacitor8Android(readFileSync(variables, 'utf8'));
  if (!existsSync(HEALTH_LIBRARY_MANIFEST)) {
    throw new Error(
      `${rel(HEALTH_LIBRARY_MANIFEST)} is missing; run npm install`
    );
  }
  const remove = unwantedHealthPermissions(
    readFileSync(HEALTH_LIBRARY_MANIFEST, 'utf8')
  );
  patchFile(
    path.join(ROOT, 'android/app/src/main/AndroidManifest.xml'),
    compose(patchAndroidManifest, patchAndroidBackupRules, (text) =>
      patchAndroidHealthPermissions(text, remove)
    )
  );
  patchFile(path.join(ROOT, 'android/variables.gradle'), patchAndroidMinSdk);
  patchFile(
    path.join(ROOT, 'android/app/src/main/res/values/strings.xml'),
    patchAndroidStrings
  );
  for (const { path: file, text } of backupRuleFiles()) {
    const dest = path.join(ROOT, file);
    if (existsSync(dest) && readFileSync(dest, 'utf8') === text) {
      console.log(`already written  ${file}`);
      continue;
    }
    mkdirSync(path.dirname(dest), { recursive: true });
    writeFileSync(dest, text);
    console.log(`wrote  ${file}`);
  }
  const res = path.join(ROOT, 'android/app/src/main/res');
  if (!existsSync(res)) throw new Error(`${rel(res)} is missing`);
  for (const { from, to } of notificationIconCopies()) {
    const src = path.join(ROOT, from);
    const dest = path.join(ROOT, to);
    if (!existsSync(src)) {
      throw new Error(
        `${from} is missing; run node scripts/generate-app-icons.mjs`
      );
    }
    if (existsSync(dest) && readFileSync(dest).equals(readFileSync(src))) {
      console.log(`already copied  ${to}`);
      continue;
    }
    mkdirSync(path.dirname(dest), { recursive: true });
    copyFileSync(src, dest);
    console.log(`copied  ${to}`);
  }
};

const platforms = [
  ['ios', patchIos],
  ['android', patchAndroid]
];
try {
  for (const [dir, run] of platforms) {
    if (!existsSync(path.join(ROOT, dir))) {
      console.log(`skipped  ${dir}/ (not generated)`);
      continue;
    }
    run();
  }
} catch (error) {
  console.error(`patch-native failed: ${error.message}`);
  process.exit(1);
}
