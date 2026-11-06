/**
 * Re-applies the fixes the generated native projects need, which would
 * otherwise vanish every time `ios/` or `android/` is regenerated.
 *
 *   npm run cap:patch                 (also run by cap:add:*, cap:sync, cap:ios, cap:android)
 *
 * iOS (Xcode 27 / iOS 27):
 *   - deployment target 15.0 in the Podfile, every pod target and the app
 *     project, because Xcode 27 rejects 14.0;
 *   - a UIScene delegate and scene manifest, because iOS 27 traps at launch
 *     in an app without the scene lifecycle;
 *   - App.entitlements with Associated Domains (webcredentials: and
 *     applinks:cankercore.com) and CODE_SIGN_ENTITLEMENTS pointing at it, so
 *     iCloud Keychain offers the site's saved passwords in the app and the
 *     system sign-in's universal-link callback reaches only this app.
 * Android: the white Kanko notification small icon from resources/notification.
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
  ENTITLEMENTS_PATH,
  notificationIconCopies,
  patchAppDelegate,
  patchEntitlements,
  patchInfoPlist,
  patchPbxproj,
  patchPbxprojEntitlements,
  patchPodfile
} from '../utils/native-patches.mts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => path.relative(ROOT, p);

const has = (cmd) => spawnSync('sh', ['-c', `command -v ${cmd}`]).status === 0;

const patchFile = (file, patch) => {
  if (!existsSync(file)) throw new Error(`${rel(file)} is missing`);
  const { text, changed } = patch(readFileSync(file, 'utf8'));
  if (changed) writeFileSync(file, text);
  console.log(`${changed ? 'patched' : 'already patched'}  ${rel(file)}`);
  return changed;
};

const patchIos = () => {
  const app = path.join(ROOT, 'ios/App');
  const podChanged = patchFile(path.join(app, 'Podfile'), patchPodfile);
  const projChanged = patchFile(
    path.join(app, 'App.xcodeproj/project.pbxproj'),
    (text) => {
      const target = patchPbxproj(text);
      const signing = patchPbxprojEntitlements(target.text);
      return {
        text: signing.text,
        changed: target.changed || signing.changed
      };
    }
  );

  // The template has no entitlements file, so a missing one is created.
  const entitlements = path.join(app, ENTITLEMENTS_PATH);
  if (!existsSync(entitlements)) writeFileSync(entitlements, '');
  if (patchFile(entitlements, patchEntitlements) && has('plutil')) {
    execFileSync('plutil', ['-lint', entitlements], { stdio: 'inherit' });
  }
  patchFile(path.join(app, 'App/AppDelegate.swift'), patchAppDelegate);
  const plist = path.join(app, 'App/Info.plist');
  if (patchFile(plist, patchInfoPlist) && has('plutil')) {
    execFileSync('plutil', ['-lint', plist], { stdio: 'inherit' });
  }

  if (!podChanged && !projChanged) return;
  if (has('pod')) {
    console.log('running  pod install  (ios/App)');
    execFileSync('pod', ['install'], { cwd: app, stdio: 'inherit' });
  } else {
    console.log(
      'CocoaPods not found. Install it, then run:\n  cd ios/App && pod install'
    );
  }
};

const patchAndroid = () => {
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
