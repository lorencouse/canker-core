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

/** Xcode 27 refuses iOS 14; 15 is the lowest target it builds. */
export const IOS_DEPLOYMENT_TARGET = '15.0';

export class PatchAnchorError extends Error {
  constructor(file: string, anchor: string) {
    super(
      `${file}: expected anchor not found (${anchor}). The Capacitor template ` +
        'has probably changed; update utils/native-patches.mts to match it.'
    );
    this.name = 'PatchAnchorError';
  }
}

const below = (version: string, floor: string) =>
  parseFloat(version) < parseFloat(floor);

/** `platform :ios, '14.0'` -> 15.0, and pin every pod target to 15.0. */
export const POD_MARKER = '# patch-native: pod deployment target';

export function patchPodfile(text: string): PatchResult {
  let out = text;

  const platform = /^platform :ios, '([\d.]+)'/m;
  const match = out.match(platform);
  if (!match) throw new PatchAnchorError('Podfile', "platform :ios, '<x>'");
  if (below(match[1], IOS_DEPLOYMENT_TARGET)) {
    out = out.replace(platform, `platform :ios, '${IOS_DEPLOYMENT_TARGET}'`);
  }

  // Pods carry their own podspec minimum (14.0 for Capacitor 7), which Xcode
  // 27 rejects per target, so the app's target alone is not enough.
  if (!out.includes(POD_MARKER)) {
    const anchor =
      /^(post_install do \|installer\|\n\s*assertDeploymentTarget\(installer\)\n)/m;
    if (!anchor.test(out)) {
      throw new PatchAnchorError(
        'Podfile',
        'post_install do |installer| assertDeploymentTarget(installer)'
      );
    }
    out = out.replace(
      anchor,
      `$1  ${POD_MARKER}\n` +
        '  installer.pods_project.targets.each do |target|\n' +
        '    target.build_configurations.each do |config|\n' +
        `      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${IOS_DEPLOYMENT_TARGET}'\n` +
        '    end\n' +
        '  end\n'
    );
  }

  return { text: out, changed: out !== text };
}

/** Every `IPHONEOS_DEPLOYMENT_TARGET` under 15.0 in the app project -> 15.0. */
export function patchPbxproj(text: string): PatchResult {
  const setting = /IPHONEOS_DEPLOYMENT_TARGET = ([\d.]+);/g;
  if (!setting.test(text)) {
    throw new PatchAnchorError(
      'project.pbxproj',
      'IPHONEOS_DEPLOYMENT_TARGET = <x>;'
    );
  }
  const out = text.replace(setting, (whole, version: string) =>
    below(version, IOS_DEPLOYMENT_TARGET)
      ? `IPHONEOS_DEPLOYMENT_TARGET = ${IOS_DEPLOYMENT_TARGET};`
      : whole
  );
  return { text: out, changed: out !== text };
}

/**
 * iOS 27 traps at launch in an app that has not adopted the scene lifecycle,
 * and the Capacitor 7 template has not. The scene delegate forwards URL opens
 * and universal links to Capacitor, which the app delegate did before scenes
 * took them over — including the URL or activity that cold-launched the app,
 * which arrives in the connection options rather than a later callback.
 *
 * The block carries a versioned marker. An older version of this patch is
 * replaced in place; a SceneDelegate this script did not write is refused,
 * because merging into hand-written Swift is not safe to do blind.
 */
export const SCENE_DELEGATE_MARKER = '// patch-native: SceneDelegate v2';

/** First line of the v1 block, appended last in the file by earlier runs. */
const SCENE_DELEGATE_V1_START =
  '// Added by scripts/patch-native.mjs: iOS 27 requires the UIScene lifecycle.';

export const SCENE_DELEGATE_SWIFT = `
${SCENE_DELEGATE_MARKER}
// Added by scripts/patch-native.mjs: iOS 27 requires the UIScene lifecycle.
// Info.plist's UIApplicationSceneManifest names this class.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        if let url = connectionOptions.urlContexts.first?.url {
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: url, options: [:])
        }
        if let userActivity = connectionOptions.userActivities.first {
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
        }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        for context in URLContexts {
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: context.url, options: [:])
        }
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
    }

}
`;

export function patchAppDelegate(text: string): PatchResult {
  if (text.includes(SCENE_DELEGATE_MARKER)) return { text, changed: false };
  const v1 = text.indexOf(SCENE_DELEGATE_V1_START);
  if (v1 !== -1) {
    // v1 was appended last, so everything from its first line on is ours.
    const out = text.slice(0, v1).replace(/\s*$/, '\n') + SCENE_DELEGATE_SWIFT;
    return { text: out, changed: true };
  }
  if (/class SceneDelegate\b/.test(text)) {
    throw new Error(
      'AppDelegate.swift already has a SceneDelegate that scripts/patch-native.mjs ' +
        'did not write (probably a hand edit). Regenerate the iOS project ' +
        '(rm -rf ios && npm run cap:add:ios) so the script can apply its own.'
    );
  }
  if (!/class AppDelegate\b/.test(text) || !text.includes('import Capacitor')) {
    throw new PatchAnchorError(
      'AppDelegate.swift',
      'import Capacitor + class AppDelegate'
    );
  }
  const out = text.replace(/\s*$/, '\n') + SCENE_DELEGATE_SWIFT;
  return { text: out, changed: true };
}

export const SCENE_MANIFEST_KEY = '<key>UIApplicationSceneManifest</key>';

const SCENE_MANIFEST_PLIST = `	${SCENE_MANIFEST_KEY}
	<dict>
		<key>UIApplicationSupportsMultipleScenes</key>
		<false/>
		<key>UISceneConfigurations</key>
		<dict>
			<key>UIWindowSceneSessionRoleApplication</key>
			<array>
				<dict>
					<key>UISceneConfigurationName</key>
					<string>Default</string>
					<key>UISceneDelegateClassName</key>
					<string>$(PRODUCT_MODULE_NAME).SceneDelegate</string>
					<key>UISceneStoryboardFile</key>
					<string>Main</string>
				</dict>
			</array>
		</dict>
	</dict>
`;

/**
 * Adds the scene manifest as the last key of the top-level dict. A text edit
 * rather than PlistBuddy so it is testable without macOS; the script lints
 * the result with plutil where it exists.
 */
export function patchInfoPlist(text: string): PatchResult {
  if (text.includes(SCENE_MANIFEST_KEY)) return { text, changed: false };
  const anchor = /\n<\/dict>\s*\n<\/plist>\s*$/;
  if (!anchor.test(text)) {
    throw new PatchAnchorError('Info.plist', 'closing </dict></plist>');
  }
  const out = text.replace(
    anchor,
    (tail) => `\n${SCENE_MANIFEST_PLIST}${tail.slice(1)}`
  );
  return { text: out, changed: true };
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
