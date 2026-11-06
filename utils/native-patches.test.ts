import { describe, expect, it } from 'vitest';
import {
  NOTIFICATION_ICON_SIZES,
  PatchAnchorError,
  notificationIconCopies,
  patchAppDelegate,
  patchInfoPlist,
  patchPbxproj,
  patchPodfile,
  type PatchResult
} from './native-patches.mjs';

// Trimmed from what `cap add ios` (Capacitor 7) generates.
const PODFILE = `require_relative '../../node_modules/@capacitor/ios/scripts/pods_helpers'

platform :ios, '14.0'
use_frameworks!

target 'App' do
  capacitor_pods
end

post_install do |installer|
  assertDeploymentTarget(installer)
end
`;

const PBXPROJ = `
				INFOPLIST_FILE = App/Info.plist;
				IPHONEOS_DEPLOYMENT_TARGET = 14.0;
				SDKROOT = iphoneos;
				IPHONEOS_DEPLOYMENT_TARGET = 14.0;
`;

const APP_DELEGATE = `import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

}
`;

const INFO_PLIST = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>UIMainStoryboardFile</key>
	<string>Main</string>
	<key>UIViewControllerBasedStatusBarAppearance</key>
	<true/>
</dict>
</plist>
`;

const cases: [string, string, (text: string) => PatchResult][] = [
  ['Podfile', PODFILE, patchPodfile],
  ['project.pbxproj', PBXPROJ, patchPbxproj],
  ['AppDelegate.swift', APP_DELEGATE, patchAppDelegate],
  ['Info.plist', INFO_PLIST, patchInfoPlist]
];

describe.each(cases)('%s patch', (_name, fixture, patch) => {
  it('changes the template once and is a no-op the second time', () => {
    const first = patch(fixture);
    expect(first.changed).toBe(true);
    const second = patch(first.text);
    expect(second).toEqual({ text: first.text, changed: false });
  });

  it('throws rather than silently skipping when its anchor is gone', () => {
    expect(() => patch('// an unrecognisable template\n')).toThrow(
      PatchAnchorError
    );
  });
});

describe('patchPodfile', () => {
  it('raises the platform and pins every pod target to 15.0', () => {
    const { text } = patchPodfile(PODFILE);
    expect(text).toContain("platform :ios, '15.0'");
    expect(text).toContain(
      "config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.0'"
    );
    // Inside post_install, after Capacitor's own assertion.
    expect(text.indexOf('assertDeploymentTarget')).toBeLessThan(
      text.indexOf('pods_project.targets')
    );
    expect(text.trimEnd().endsWith('end')).toBe(true);
  });

  it('leaves a newer platform alone', () => {
    const newer = PODFILE.replace("'14.0'", "'16.0'");
    expect(patchPodfile(newer).text).toContain("platform :ios, '16.0'");
  });

  it('throws when post_install has changed shape', () => {
    const changed = PODFILE.replace('assertDeploymentTarget', 'somethingElse');
    expect(() => patchPodfile(changed)).toThrow(/post_install/);
  });
});

describe('patchPbxproj', () => {
  it('raises every target under 15.0 and keeps higher ones', () => {
    const mixed = PBXPROJ + '\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 17.0;\n';
    const { text } = patchPbxproj(mixed);
    expect(text).not.toContain('= 14.0;');
    expect(text.match(/= 15\.0;/g)).toHaveLength(2);
    expect(text).toContain('IPHONEOS_DEPLOYMENT_TARGET = 17.0;');
  });
});

describe('patchAppDelegate', () => {
  it('appends a scene delegate that forwards to Capacitor', () => {
    const { text } = patchAppDelegate(APP_DELEGATE);
    expect(text.startsWith(APP_DELEGATE.trimEnd())).toBe(true);
    expect(text).toContain(
      'class SceneDelegate: UIResponder, UIWindowSceneDelegate'
    );
    expect(text).toContain('openURLContexts');
    expect(text).toContain('continue userActivity');
    expect(text).toContain('willConnectTo');
    expect(text).toContain('connectionOptions.urlContexts.first?.url');
    expect(text).toContain('connectionOptions.userActivities.first');
    expect(text.match(/ApplicationDelegateProxy\.shared/g)).toHaveLength(4);
    expect(text.match(/class SceneDelegate\b/g)).toHaveLength(1);
  });

  it('upgrades the v1 block written by an earlier run', () => {
    const v1 = `${APP_DELEGATE}
// Added by scripts/patch-native.mjs: iOS 27 requires the UIScene lifecycle.
// Info.plist's UIApplicationSceneManifest names this class.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    }

}
`;
    const upgraded = patchAppDelegate(v1);
    expect(upgraded.changed).toBe(true);
    expect(upgraded.text).toBe(patchAppDelegate(APP_DELEGATE).text);
    expect(patchAppDelegate(upgraded.text).changed).toBe(false);
  });

  it('refuses a hand-written SceneDelegate and says to regenerate', () => {
    const hand = `${APP_DELEGATE}
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?
}
`;
    expect(() => patchAppDelegate(hand)).toThrow(/Regenerate the iOS project/);
  });
});

describe('patchInfoPlist', () => {
  it('adds the scene manifest inside the top-level dict', () => {
    const { text } = patchInfoPlist(INFO_PLIST);
    expect(text).toContain(
      '<string>$(PRODUCT_MODULE_NAME).SceneDelegate</string>'
    );
    expect(text).toMatch(
      /<key>UIApplicationSupportsMultipleScenes<\/key>\s*<false\/>/
    );
    expect(text).toMatch(/<\/dict>\n<\/dict>\n<\/plist>\n$/);
    expect(text.match(/<dict>/g)?.length).toBe(text.match(/<\/dict>/g)?.length);
  });
});

describe('notificationIconCopies', () => {
  it('maps each committed density into the Android res tree', () => {
    const copies = notificationIconCopies();
    expect(copies).toHaveLength(Object.keys(NOTIFICATION_ICON_SIZES).length);
    expect(copies[0]).toEqual({
      from: 'resources/notification/drawable-mdpi/ic_stat_kanko.png',
      to: 'android/app/src/main/res/drawable-mdpi/ic_stat_kanko.png'
    });
  });
});
