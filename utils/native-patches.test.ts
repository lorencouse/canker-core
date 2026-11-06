import { describe, expect, it } from 'vitest';
import {
  NOTIFICATION_ICON_SIZES,
  PatchAnchorError,
  notificationIconCopies,
  patchAppDelegate,
  patchEntitlements,
  patchInfoPlist,
  patchPbxproj,
  patchPbxprojEntitlements,
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
  ['Info.plist', INFO_PLIST, patchInfoPlist],
  ['project.pbxproj (entitlements)', PBXPROJ, patchPbxprojEntitlements]
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

// The App target's two configurations, as `cap add ios` writes them.
const TARGET_CONFIGS = `
		504EC3171FED79650016851F /* Debug */ = {
			buildSettings = {
				CODE_SIGN_STYLE = Automatic;
				INFOPLIST_FILE = App/Info.plist;
				IPHONEOS_DEPLOYMENT_TARGET = 14.0;
			};
		};
		504EC3181FED79650016851F /* Release */ = {
			buildSettings = {
				CODE_SIGN_STYLE = Automatic;
				INFOPLIST_FILE = App/Info.plist;
				IPHONEOS_DEPLOYMENT_TARGET = 14.0;
			};
		};
`;

describe('patchPbxprojEntitlements', () => {
  it('points Debug and Release at App.entitlements', () => {
    const { text } = patchPbxprojEntitlements(TARGET_CONFIGS);
    expect(
      text.match(
        /\t\t\t\tCODE_SIGN_ENTITLEMENTS = App\/App\.entitlements;\n\t\t\t\tINFOPLIST_FILE/g
      )
    ).toHaveLength(2);
    expect(patchPbxprojEntitlements(text).changed).toBe(false);
  });

  it('composes with the deployment-target patch in either order', () => {
    const a = patchPbxprojEntitlements(patchPbxproj(TARGET_CONFIGS).text).text;
    const b = patchPbxproj(patchPbxprojEntitlements(TARGET_CONFIGS).text).text;
    expect(a).toBe(b);
  });

  it('refuses an entitlements file it did not set', () => {
    const other = TARGET_CONFIGS.replace(
      'CODE_SIGN_STYLE = Automatic;',
      'CODE_SIGN_ENTITLEMENTS = App/Other.entitlements;'
    );
    expect(() => patchPbxprojEntitlements(other)).toThrow(/did not write/);
  });

  it('refuses a half-applied state', () => {
    const half = TARGET_CONFIGS.replace(
      'CODE_SIGN_STYLE = Automatic;',
      'CODE_SIGN_ENTITLEMENTS = App/App.entitlements;'
    );
    expect(() => patchPbxprojEntitlements(half)).toThrow(/only some/);
  });
});

describe('patchEntitlements', () => {
  const DOMAIN = '<string>webcredentials:cankercore.com</string>';
  const APPLINKS = '<string>applinks:cankercore.com</string>';

  it('claims both the passwords and the sign-in universal link', () => {
    const { text } = patchEntitlements('');
    expect(text).toContain(DOMAIN);
    expect(text).toContain(APPLINKS);
  });

  it('adds applinks to a file an earlier version wrote, once', () => {
    const earlier = `<plist version="1.0">
<dict>
	<key>com.apple.developer.associated-domains</key>
	<array>
		${DOMAIN}
	</array>
</dict>
</plist>
`;
    const upgraded = patchEntitlements(earlier);
    expect(upgraded.changed).toBe(true);
    expect(upgraded.text.match(/<string>/g)).toHaveLength(2);
    expect(upgraded.text).toContain(APPLINKS);
    expect(patchEntitlements(upgraded.text).changed).toBe(false);
  });

  it('creates the file when there is none, once', () => {
    const first = patchEntitlements('');
    expect(first.changed).toBe(true);
    expect(first.text).toContain(
      '<key>com.apple.developer.associated-domains</key>'
    );
    expect(first.text).toContain(DOMAIN);
    expect(first.text).toMatch(/<\/dict>\n<\/plist>\n$/);
    expect(patchEntitlements(first.text)).toEqual({
      text: first.text,
      changed: false
    });
  });

  it('adds the key to an existing file and keeps what it had', () => {
    const existing = `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
<dict>
	<key>aps-environment</key>
	<string>development</string>
</dict>
</plist>
`;
    const { text, changed } = patchEntitlements(existing);
    expect(changed).toBe(true);
    expect(text).toContain('<key>aps-environment</key>');
    expect(text).toContain(DOMAIN);
    expect(text.match(/<dict>/g)?.length).toBe(text.match(/<\/dict>/g)?.length);
    expect(patchEntitlements(text).changed).toBe(false);
  });

  it('adds the domain to an existing associated-domains array', () => {
    const existing = `<plist version="1.0">
<dict>
	<key>com.apple.developer.associated-domains</key>
	<array>
		<string>applinks:example.com</string>
	</array>
</dict>
</plist>
`;
    const { text } = patchEntitlements(existing);
    expect(text).toContain('<string>applinks:example.com</string>');
    expect(text).toContain(DOMAIN);
    expect(text.match(/associated-domains/g)).toHaveLength(1);
  });

  it('throws when an existing file has no closing dict', () => {
    expect(() => patchEntitlements('<plist>')).toThrow(PatchAnchorError);
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
