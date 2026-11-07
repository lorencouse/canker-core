import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  APP_LINK_FILTER,
  APP_LINK_HOST,
  APP_LINK_PATH,
  NOTIFICATION_ICON_SIZES,
  BACKUP_ATTRIBUTES,
  BACKUP_RULES_XML,
  DATA_EXTRACTION_RULES_XML,
  PatchAnchorError,
  SORE_PHOTO_FOLDER,
  backupRuleFiles,
  patchAndroidBackupRules,
  notificationIconCopies,
  patchAndroidManifest,
  patchEntitlements,
  patchEntitlementsHealthKit,
  patchInfoPlistHealthUsage,
  patchInfoPlistPhotoUsage,
  PHOTO_USAGE_STRINGS,
  HEALTH_MIN_SDK,
  HEALTH_PRIVACY_POLICY_URL,
  HEALTH_READ_PERMISSION,
  HEALTH_USAGE_STRINGS,
  HEALTHKIT_ENTITLEMENTS,
  patchAndroidHealthPermissions,
  patchAndroidMinSdk,
  patchAndroidStrings,
  unwantedHealthPermissions,
  patchPbxprojEntitlements,
  type PatchResult
} from './native-patches.mjs';
import { NATIVE_AUTH_HTTPS_PATH } from './native-auth';

// Trimmed from what `cap add ios --packagemanager CocoaPods` (Capacitor 8)
// generates, scene manifest and its indentation included.
const INFO_PLIST = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>LSRequiresIPhoneOS</key>
	<true/>
	<key>UIApplicationSceneManifest</key>
	<dict>
		<key>UIApplicationSupportsMultipleScenes</key>
    <false/>
    <key>UISceneConfigurations</key>
    <dict>
      <key>UIWindowSceneSessionRoleApplication</key>
      <array>
        <dict>
            <key>UISceneConfigurationName</key>
            <string>Default Configuration</string>
            <key>UISceneDelegateClassName</key>
            <string>$(PRODUCT_MODULE_NAME).SceneDelegate</string>
            <key>UISceneStoryboardFile</key>
            <string>Main</string>
        </dict>
      </array>
    </dict>
	</dict>
	<key>UIMainStoryboardFile</key>
	<string>Main</string>
	<key>UIViewControllerBasedStatusBarAppearance</key>
	<true/>
</dict>
</plist>
`;

// The App target's two configurations, as `cap add ios` (Capacitor 8) writes them.
const TARGET_CONFIGS = `
		504EC3171FED79650016851F /* Debug */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = 1;
				INFOPLIST_FILE = App/Info.plist;
				IPHONEOS_DEPLOYMENT_TARGET = 15.0;
			};
			name = Debug;
		};
		504EC3181FED79650016851F /* Release */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = 1;
				INFOPLIST_FILE = App/Info.plist;
				IPHONEOS_DEPLOYMENT_TARGET = 15.0;
			};
			name = Release;
		};
`;

// What `cap add android` (Capacitor 8) generates, trimmed.
const ANDROID_MANIFEST = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode|navigation|density"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="\${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
        </provider>
    </application>

    <!-- Permissions -->

    <uses-permission android:name="android.permission.INTERNET" />
</manifest>
`;

// android/variables.gradle and res/values/strings.xml as `cap add android`
// (Capacitor 8) writes them.
const VARIABLES_GRADLE = `ext {
    minSdkVersion = 24
    compileSdkVersion = 36
    targetSdkVersion = 36
}`;

const STRINGS_XML = `<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">Canker Core</string>
    <string name="title_activity_main">Canker Core</string>
</resources>
`;

const ENTITLEMENTS = patchEntitlements('').text;

// Two of the library's permissions, enough to see the block's shape.
const REMOVE = [
  'android.permission.health.READ_STEPS',
  'android.permission.health.WRITE_SLEEP'
];
const patchHealthPermissions = (text: string) =>
  patchAndroidHealthPermissions(text, REMOVE);

const cases: [string, string, (text: string) => PatchResult][] = [
  ['Info.plist (photo usage)', INFO_PLIST, patchInfoPlistPhotoUsage],
  ['Info.plist (health usage)', INFO_PLIST, patchInfoPlistHealthUsage],
  ['App.entitlements (HealthKit)', ENTITLEMENTS, patchEntitlementsHealthKit],
  [
    'AndroidManifest.xml (health permissions)',
    ANDROID_MANIFEST,
    patchHealthPermissions
  ],
  ['variables.gradle (minSdk)', VARIABLES_GRADLE, patchAndroidMinSdk],
  ['strings.xml (privacy policy)', STRINGS_XML, patchAndroidStrings],
  ['project.pbxproj (entitlements)', TARGET_CONFIGS, patchPbxprojEntitlements],
  ['AndroidManifest.xml', ANDROID_MANIFEST, patchAndroidManifest],
  [
    'AndroidManifest.xml (backup rules)',
    ANDROID_MANIFEST,
    patchAndroidBackupRules
  ]
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

describe('patchInfoPlistPhotoUsage', () => {
  it('adds both usage strings inside the top-level dict', () => {
    const { text } = patchInfoPlistPhotoUsage(INFO_PLIST);
    for (const [key, value] of Object.entries(PHOTO_USAGE_STRINGS)) {
      expect(text).toContain(`<key>${key}</key>\n\t<string>${value}</string>`);
    }
    expect(text).toMatch(/<\/string>\n<\/dict>\n<\/plist>\n$/);
  });

  it('says photos stay on the device', () => {
    for (const value of Object.values(PHOTO_USAGE_STRINGS)) {
      expect(value).toMatch(/never uploaded/);
      expect(value).not.toMatch(/[<>&\u2014]/);
    }
  });

  it('rewrites a usage string that differs, leaving the rest alone', () => {
    const stale = INFO_PLIST.replace(
      '</dict>\n</plist>',
      '\t<key>NSCameraUsageDescription</key>\n\t<string>Old copy</string>\n</dict>\n</plist>'
    );
    const { text, changed } = patchInfoPlistPhotoUsage(stale);
    expect(changed).toBe(true);
    expect(text).not.toContain('Old copy');
    expect(text.match(/NSCameraUsageDescription/g)).toHaveLength(1);
    expect(text).toContain(PHOTO_USAGE_STRINGS.NSPhotoLibraryUsageDescription);
  });

  it("leaves the template's scene manifest as it is", () => {
    const { text } = patchInfoPlistPhotoUsage(INFO_PLIST);
    const manifest = (plist: string) =>
      plist.slice(
        plist.indexOf('<key>UIApplicationSceneManifest</key>'),
        plist.indexOf('<key>UIMainStoryboardFile</key>')
      );
    expect(manifest(text)).toBe(manifest(INFO_PLIST));
    expect(text.match(/<dict>/g)?.length).toBe(text.match(/<\/dict>/g)?.length);
  });
});

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

describe('patchInfoPlistHealthUsage', () => {
  it('says sleep is read only on request and only hours are kept', () => {
    const { text } = patchInfoPlistHealthUsage(INFO_PLIST);
    const copy = HEALTH_USAGE_STRINGS.NSHealthShareUsageDescription;
    expect(text).toContain(
      `<key>NSHealthShareUsageDescription</key>\n\t<string>${copy}</string>`
    );
    expect(copy).toMatch(/only when you tap Import from Health/);
    expect(copy).toMatch(/Only the total hours are saved/);
  });

  it('asks to read only, so declares no update (write) string', () => {
    const { text } = patchInfoPlistHealthUsage(INFO_PLIST);
    expect(text).not.toContain('NSHealthUpdateUsageDescription');
  });

  it('composes with the photo strings', () => {
    const photo = patchInfoPlistPhotoUsage(INFO_PLIST).text;
    const both = patchInfoPlistHealthUsage(photo).text;
    for (const key of [
      ...Object.keys(PHOTO_USAGE_STRINGS),
      ...Object.keys(HEALTH_USAGE_STRINGS)
    ]) {
      expect(both.match(new RegExp(`<key>${key}</key>`, 'g'))).toHaveLength(1);
    }
    expect(patchInfoPlistPhotoUsage(both).changed).toBe(false);
  });
});

describe('patchEntitlementsHealthKit', () => {
  it('adds the HealthKit capability beside the associated domains', () => {
    const { text } = patchEntitlementsHealthKit(ENTITLEMENTS);
    expect(text).toContain(
      '<key>com.apple.developer.healthkit</key>\n\t<true/>'
    );
    expect(text).toContain(
      '<key>com.apple.developer.healthkit.access</key>\n\t<array/>'
    );
    expect(text).toContain('<key>com.apple.developer.associated-domains</key>');
    expect(text).toMatch(/<\/dict>\n<\/plist>\n$/);
    expect(patchEntitlements(text).changed).toBe(false);
  });

  it('refuses HealthKit keys it did not write', () => {
    const other = ENTITLEMENTS.replace(
      '</dict>',
      '\t<key>com.apple.developer.healthkit</key>\n\t<false/>\n</dict>'
    );
    expect(() => patchEntitlementsHealthKit(other)).toThrow(/Regenerate/);
  });
});

describe('patchAndroidHealthPermissions', () => {
  it('declares READ_SLEEP and removes the rest', () => {
    const { text } = patchHealthPermissions(ANDROID_MANIFEST);
    expect(text).toContain(
      `<uses-permission android:name="${HEALTH_READ_PERMISSION}" />`
    );
    for (const name of REMOVE) {
      expect(text).toContain(
        `<uses-permission android:name="${name}" tools:node="remove" />`
      );
    }
    expect(text).toMatch(
      /^<manifest xmlns:tools="http:\/\/schemas\.android\.com\/tools" xmlns:android=/m
    );
    expect(text).toMatch(/<\/manifest>\n$/);
  });

  it('rewrites its own block when the library list changes', () => {
    const first = patchHealthPermissions(ANDROID_MANIFEST).text;
    const next = patchAndroidHealthPermissions(first, [REMOVE[0]]);
    expect(next.changed).toBe(true);
    expect(next.text).not.toContain(REMOVE[1]);
    expect(next.text.match(/patch-native: health permissions/g)).toHaveLength(
      2
    );
    expect(next.text.match(/xmlns:tools=/g)).toHaveLength(1);
  });

  it('composes with the app link and backup patches', () => {
    const linked = patchAndroidBackupRules(
      patchAndroidManifest(ANDROID_MANIFEST).text
    ).text;
    const { text } = patchHealthPermissions(linked);
    expect(text).toContain(APP_LINK_FILTER);
    expect(patchAndroidManifest(text).changed).toBe(false);
    expect(patchAndroidBackupRules(text).changed).toBe(false);
  });
});

describe('unwantedHealthPermissions', () => {
  it('lists every health permission except READ_SLEEP, once', () => {
    const manifest = `<manifest>
    <uses-permission android:name="android.permission.health.READ_STEPS" />
    <uses-permission android:name="android.permission.health.READ_SLEEP" />
    <uses-permission android:name="android.permission.health.WRITE_SLEEP" />
    <uses-permission android:name="android.permission.health.READ_STEPS" />
    <uses-permission android:name="android.permission.INTERNET" />
</manifest>`;
    expect(unwantedHealthPermissions(manifest)).toEqual([
      'android.permission.health.READ_STEPS',
      'android.permission.health.WRITE_SLEEP'
    ]);
  });
});

describe('patchAndroidMinSdk', () => {
  it('raises the template minimum to what Health Connect needs', () => {
    const { text } = patchAndroidMinSdk(VARIABLES_GRADLE);
    expect(text).toContain(`minSdkVersion = ${HEALTH_MIN_SDK}\n`);
    expect(text).toContain('compileSdkVersion = 36');
  });

  it('leaves a higher minimum alone', () => {
    const higher = VARIABLES_GRADLE.replace('= 24', '= 28');
    expect(patchAndroidMinSdk(higher)).toEqual({
      text: higher,
      changed: false
    });
  });
});

describe('patchAndroidStrings', () => {
  it('points the Health Connect privacy policy at the privacy page', () => {
    const { text } = patchAndroidStrings(STRINGS_XML);
    expect(text).toContain(
      `    <string name="health_connect_privacy_policy_url">${HEALTH_PRIVACY_POLICY_URL}</string>\n</resources>\n`
    );
    expect(text).toContain('<string name="app_name">Canker Core</string>');
  });

  it('rewrites a different URL', () => {
    const old = patchAndroidStrings(STRINGS_XML).text.replace(
      HEALTH_PRIVACY_POLICY_URL,
      'https://example.com'
    );
    const { text, changed } = patchAndroidStrings(old);
    expect(changed).toBe(true);
    expect(text).toContain(HEALTH_PRIVACY_POLICY_URL);
    expect(text).not.toContain('example.com');
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

describe('patchAndroidManifest', () => {
  const activity = (text: string) =>
    text.slice(text.indexOf('<activity'), text.indexOf('</activity>'));

  it('claims exactly the sign-in callback, verified, on MainActivity', () => {
    const { text } = patchAndroidManifest(ANDROID_MANIFEST);
    const main = activity(text);
    expect(main).toContain('<intent-filter android:autoVerify="true">');
    expect(main).toContain(
      `<data android:scheme="https" android:host="${APP_LINK_HOST}" android:path="${APP_LINK_PATH}" />`
    );
    // The launcher filter is untouched, and nothing went outside the activity.
    expect(main).toContain('android.intent.category.LAUNCHER');
    expect(text.replace(APP_LINK_FILTER, '')).not.toContain('autoVerify');
    expect(text.match(/autoVerify/g)).toHaveLength(1);
  });

  it('matches the path the server redirects to, and nothing wider', () => {
    expect(APP_LINK_PATH).toBe(NATIVE_AUTH_HTTPS_PATH);
    expect(APP_LINK_FILTER).not.toMatch(/pathPrefix|pathPattern|scheme="http"/);
    // A custom scheme would let any app claim the callback.
    expect(APP_LINK_FILTER.match(/android:scheme="([^"]+)"/g)).toEqual([
      'android:scheme="https"'
    ]);
  });

  it('refuses a MainActivity that is no longer singleTask', () => {
    expect(() =>
      patchAndroidManifest(
        ANDROID_MANIFEST.replace(' android:launchMode="singleTask"', '')
      )
    ).toThrow(PatchAnchorError);
  });

  it('refuses a sign-in link it did not write and says to regenerate', () => {
    const { text } = patchAndroidManifest(ANDROID_MANIFEST);
    const edited = text.replace(
      `android:path="${APP_LINK_PATH}"`,
      'android:pathPrefix="/"'
    );
    expect(() => patchAndroidManifest(edited)).toThrow(/Regenerate/);
  });
});

describe('patchAndroidBackupRules', () => {
  it('points <application> at both rule files', () => {
    const { text } = patchAndroidBackupRules(ANDROID_MANIFEST);
    const tag = text.match(/<application\b[^>]*>/)![0];
    for (const [name, value] of Object.entries(BACKUP_ATTRIBUTES)) {
      expect(tag).toContain(`${name}="${value}"`);
    }
    expect(tag).toContain('android:theme="@style/AppTheme"');
  });

  it("keeps the template's allowBackup", () => {
    const first = patchAndroidBackupRules(ANDROID_MANIFEST);
    expect(first.text).toContain('android:allowBackup="true"');
    expect(patchAndroidBackupRules(first.text).changed).toBe(false);
  });

  it('composes with the app link patch', () => {
    const both = patchAndroidBackupRules(
      patchAndroidManifest(ANDROID_MANIFEST).text
    ).text;
    expect(patchAndroidManifest(both).changed).toBe(false);
    expect(patchAndroidBackupRules(both).changed).toBe(false);
  });

  it('stops rather than replace a different rule set', () => {
    const other = ANDROID_MANIFEST.replace(
      '<application\n',
      '<application\n        android:fullBackupContent="@xml/theirs"\n'
    );
    expect(() => patchAndroidBackupRules(other)).toThrow(/@xml\/theirs/);
  });
});

describe('backup rule files', () => {
  const exclude = `<exclude domain="file" path="${SORE_PHOTO_FOLDER}" />`;

  it('excludes the folder sore-photos.ts writes to', () => {
    const source = readFileSync(
      fileURLToPath(new URL('./sore-photos.ts', import.meta.url)),
      'utf8'
    );
    expect(source).toContain(`const FOLDER = '${SORE_PHOTO_FOLDER}';`);
  });

  it('excludes the photos from full backup', () => {
    expect(BACKUP_RULES_XML).toMatch(
      new RegExp(
        `<full-backup-content>\\s*${exclude}\\s*</full-backup-content>`
      )
    );
  });

  it('excludes the photos from cloud backup and device transfer', () => {
    for (const section of ['cloud-backup', 'device-transfer']) {
      expect(DATA_EXTRACTION_RULES_XML).toMatch(
        new RegExp(`<${section}>\\s*${exclude}\\s*</${section}>`)
      );
    }
  });

  it('lands where the manifest attributes point', () => {
    const paths = backupRuleFiles().map((f) => f.path);
    for (const value of Object.values(BACKUP_ATTRIBUTES)) {
      const name = value.replace('@xml/', '');
      expect(paths).toContain(`android/app/src/main/res/xml/${name}.xml`);
    }
  });
});

/*
 * The fixtures above are trimmed; these run the same patches on the
 * templates `cap add` actually unpacks, from the installed @capacitor/cli.
 * They also pin why the iOS deployment-target and scene-lifecycle patches
 * were retired: the Capacitor 8 template already does both.
 */
describe('the installed Capacitor templates', () => {
  const assets = fileURLToPath(
    new URL('../node_modules/@capacitor/cli/assets/', import.meta.url)
  );
  let dir: string;
  const unpack = (archive: string, into: string) => {
    const dest = path.join(dir, into);
    mkdirSync(dest);
    execFileSync('tar', ['-xzf', path.join(assets, archive), '-C', dest]);
    return (file: string) => readFileSync(path.join(dest, file), 'utf8');
  };
  let ios: (file: string) => string;
  let android: (file: string) => string;

  beforeAll(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'cap-templates-'));
    ios = unpack('ios-pods-template.tar.gz', 'ios');
    android = unpack('android-template.tar.gz', 'android');
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  const twice = (text: string, patches: ((t: string) => PatchResult)[]) => {
    const run = (input: string) =>
      patches.reduce(
        (acc, patch) => {
          const next = patch(acc.text);
          return { text: next.text, changed: acc.changed || next.changed };
        },
        { text: input, changed: false }
      );
    const first = run(text);
    expect(first.changed).toBe(true);
    expect(run(first.text)).toEqual({ text: first.text, changed: false });
  };

  // The Health plugin's own library manifest, as installed.
  const healthLibrary = () =>
    readFileSync(
      fileURLToPath(
        new URL(
          '../node_modules/@capgo/capacitor-health/android/src/main/AndroidManifest.xml',
          import.meta.url
        )
      ),
      'utf8'
    );

  it('patches the iOS project once', () => {
    twice(ios('App/App.xcodeproj/project.pbxproj'), [patchPbxprojEntitlements]);
    twice(ios('App/App/Info.plist'), [
      patchInfoPlistPhotoUsage,
      patchInfoPlistHealthUsage
    ]);
    twice('', [patchEntitlements, patchEntitlementsHealthKit]);
  });

  it('patches the Android project once', () => {
    const remove = unwantedHealthPermissions(healthLibrary());
    twice(android('app/src/main/AndroidManifest.xml'), [
      patchAndroidManifest,
      patchAndroidBackupRules,
      (text) => patchAndroidHealthPermissions(text, remove)
    ]);
    twice(android('variables.gradle'), [patchAndroidMinSdk]);
    twice(android('app/src/main/res/values/strings.xml'), [
      patchAndroidStrings
    ]);
  });

  it('strips every health permission the plugin declares except READ_SLEEP', () => {
    const library = healthLibrary();
    const remove = unwantedHealthPermissions(library);
    expect(library).toContain(HEALTH_READ_PERMISSION);
    expect(remove).not.toContain(HEALTH_READ_PERMISSION);
    // Every declared health permission but one goes, digits and all.
    const declared = new Set(
      library.match(/android\.permission\.health\.[A-Z0-9_]+/g)
    );
    expect(remove).toHaveLength(declared.size - 1);
    expect(remove).toContain('android.permission.health.WRITE_SLEEP');
    expect(remove).toContain('android.permission.health.READ_VO2_MAX');
  });

  it("relies on the plugin's own rationale activity, alias and queries", () => {
    const library = healthLibrary();
    expect(library).toContain(
      'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE'
    );
    expect(library).toMatch(
      /<activity-alias[\s\S]*android\.intent\.action\.VIEW_PERMISSION_USAGE[\s\S]*android\.intent\.category\.HEALTH_PERMISSIONS/
    );
    expect(library).toContain(
      '<package android:name="com.google.android.apps.healthdata" />'
    );
  });

  it('starts Android below the minimum Health Connect needs', () => {
    expect(android('variables.gradle')).toMatch(/minSdkVersion = 24\b/);
  });

  it('already targets iOS 15.0 everywhere', () => {
    expect(ios('App/Podfile')).toMatch(/^platform :ios, '15\.0'$/m);
    const targets = ios('App/App.xcodeproj/project.pbxproj').match(
      /IPHONEOS_DEPLOYMENT_TARGET = ([\d.]+);/g
    );
    expect(targets?.length).toBeGreaterThan(0);
    for (const target of targets!) expect(target).toContain('= 15.0;');
    // Pods: the template's post_install calls this, which lifts any pod
    // below 15.0 (the local web-auth podspec included).
    const helpers = readFileSync(
      fileURLToPath(
        new URL(
          '../node_modules/@capacitor/ios/scripts/pods_helpers.rb',
          import.meta.url
        )
      ),
      'utf8'
    );
    expect(helpers).toContain(
      "config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.0'"
    );
    expect(ios('App/Podfile')).toMatch(
      /post_install do \|installer\|\n\s*assertDeploymentTarget\(installer\)/
    );
  });

  it('already has the UIScene lifecycle iOS 27 requires', () => {
    expect(ios('App/App/SceneDelegate.swift')).toContain(
      'SceneDelegateProxy.shared'
    );
    expect(ios('App/App/AppDelegate.swift')).toContain(
      'config.delegateClass = SceneDelegate.self'
    );
    expect(ios('App/App/Info.plist')).toContain(
      '<string>$(PRODUCT_MODULE_NAME).SceneDelegate</string>'
    );
  });
});
