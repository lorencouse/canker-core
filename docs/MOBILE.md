# Canker Core on phones

Canker Core ships as one codebase in three forms: a responsive website, an
installable PWA, and native iOS/Android apps built with Capacitor. They are
the same pages — there is no separate mobile build, and no feature that
exists in one and not the others.

## How the native app is packaged

The native apps are a **shell around the hosted site**, not a bundled copy
of it.

This is a consequence of the stack, not a preference. The app uses server
components, server actions, a Next proxy (middleware), and a Better Auth session
backed by Postgres. `output: 'export'` supports none of those, so a static
Capacitor bundle would mean rewriting the entire data layer as a client that
talks to a separately deployed API. Wrapping the deployed app costs nothing
and loses nothing that a phone user would notice.

```
capacitor.config.ts
  server.url    → https://cankercore.com   (CAPACITOR_SERVER_URL to override)
  webDir        → native/shell             (shown when the network is down)
```

What follows from that:

- **The app needs a connection.** `native/shell/index.html` is what the user
  sees when it does not have one — `server.errorPath` points the webview at
  it, so it replaces the webview's own error page. It is served raw, without
  the Capacitor bridge, so nothing on that page can call a plugin; that is
  why the splash screen times out on its own rather than waiting to be
  dismissed by code that only exists on the server.
- **Deploys reach the app immediately**, with no store review. Only changes
  to the shell, the icons, or a plugin need a new binary.
- **Auth is the site's auth.** The session is an ordinary cookie on the
  deployed origin. Email and password forms work in the webview as they do
  in a browser, and iCloud Keychain offers the site's saved and suggested
  passwords there because the app claims `webcredentials:cankercore.com`
  (the entitlement below, answered by
  `public/.well-known/apple-app-site-association`).
- **OAuth on iOS 17.4+ runs in Apple's system sign-in sheet**
  (ASWebAuthenticationSession, the local plugin in `native/plugins/web-auth`),
  so it can use the Google or GitHub account, password or passkey already in
  Safari. The sheet has its own cookie jar, so `app/api/native-auth/*` hands
  the result back: `start` begins Better Auth's normal flow in the sheet
  (and copies the webview's first-touch cookie into it, so signups keep
  their attribution); `finish` deletes the sheet's session at once, holds
  its user as a five-minute pending handoff keyed by the flow cookie, and
  asks "Continue to the Canker Core app as <email>?", so Safari is never
  left signed in; only that page's same-origin, CSRF-checked POST spends the
  pending handoff on a single-use 60-second token; and `redeem` turns that
  token into a new session in the webview. The sheet returns only through
  the universal link `https://cankercore.com/native-auth/callback`, which
  iOS hands to this app alone (opened in a browser, that page shows a
  notice and never reads the token). There is no custom-scheme callback,
  since any app can claim a scheme, so older iOS keeps OAuth in the webview
  as browsers do. The provider callback is still
  `/api/auth/callback/<provider>`. `utils/native-auth.ts` describes the flow
  and its checks. The webview flows are why the providers are still listed
  in `server.allowNavigation`.
- **OAuth on Android runs in a Chrome Custom Tab** (the same plugin's
  Android side), so it can use the Google accounts and passkeys already in
  Chrome. It is the same server flow and the same confirmation; the tab
  returns through the App Link `https://cankercore.com/native-auth/callback`,
  claimed by an `android:autoVerify` intent-filter on `MainActivity` for
  exactly that path and verified against
  `public/.well-known/assetlinks.json`, so Android hands it to this app
  alone. Closing the tab is a cancelled sign-in. Without a Custom Tabs
  browser, or on Android 12+ before the link is verified, OAuth stays in the
  webview.

### Android App Link signing certificates

Android verifies the App Link only for an app signed by a certificate that
`public/.well-known/assetlinks.json` lists, as an uppercase colon-separated
SHA-256 fingerprint in `sha256_cert_fingerprints`. It lists the debug
keystore's certificate (`~/.android/debug.keystore` on the machine that
builds the test installs). When a release build exists, add its
certificate beside it; with Play App Signing that is the **app signing
key** from Play Console > Setup > App signing, not the upload key:

```bash
keytool -list -v -keystore <release.keystore> -alias <alias> | grep SHA256
```

Then deploy, and check the file and the device:

```bash
curl -sI https://cankercore.com/.well-known/assetlinks.json   # 200, application/json, no redirect
adb shell pm verify-app-links --re-verify com.cankercore.app  # Android 12+
adb shell pm get-app-links com.cankercore.app                 # cankercore.com: verified
```

On Android 11 and older, `adb shell dumpsys package domain-preferred-apps`
shows the result, and verification runs once at install, so reinstall after
a change. Once release builds ship, consider dropping the debug fingerprint:
anyone holding that keystore could sign a build the link would trust.

## Building the native projects

The apps are on Capacitor 8, which needs Node 22+, Xcode 26+ (Xcode 27 here)
with CocoaPods, and Android Studio Otter (2025.2.1) or newer with JDK 21.

The `ios/` and `android/` directories are generated and untracked. Create
them once per machine:

```bash
npm run cap:add:ios        # needs Xcode and CocoaPods
npm run cap:add:android    # needs Android Studio
```

Each of those runs `npm run cap:patch` (`scripts/patch-native.mjs`) after
`cap add`, because the generated projects need fixes the Capacitor 8
templates lack, and anything edited by hand in `ios/` or `android/` is lost
on regeneration:

- **iOS:** `App/App.entitlements` with the Associated Domains entries
  `webcredentials:cankercore.com` and `applinks:cankercore.com`, referenced
  by `CODE_SIGN_ENTITLEMENTS`. Automatic signing enables the capability on
  the App ID. Also the `NSCameraUsageDescription` and
  `NSPhotoLibraryUsageDescription` strings in `Info.plist` for sore photos
  (below). The template already targets iOS 15.0 (Capacitor's Podfile hook
  lifts every pod to 15.0 too) and ships the `SceneDelegate` and scene
  manifest iOS 27 requires, so the script no longer patches those.
- **Android:** the sign-in App Link intent-filter on `MainActivity` (see
  above), the backup rules that keep sore photos out of Auto Backup (below),
  and the Kanko notification small icon copied from
  `resources/notification/` into `res/drawable-*/ic_stat_kanko.png`.

`cap:add:ios` asks for the CocoaPods template (`--packagemanager
CocoaPods`). Capacitor 8 otherwise generates a Swift Package Manager
project, which leaves out the local `native/plugins/web-auth` plugin
because it ships only a podspec; `cap:patch` refuses such a project.

Projects generated before Capacitor 8 do not upgrade in place. Delete and
regenerate both (`rm -rf ios android`, then the two commands above, then
`npm run cap:assets`). `cap:patch` refuses an `ios/` without the Capacitor 8
`SceneDelegate.swift`.

The script is idempotent, skips a platform whose folder is missing, and stops
with an error if a template no longer has the text it patches. The patches
live in `utils/native-patches.mts`; their tests also run them on the
templates inside the installed `@capacitor/cli`.

### Sore photos (`@capacitor/camera`, `@capacitor/filesystem`)

The check-in's sore step can take a photo, and the sore's detail shows
them. Photos never leave the phone: `utils/sore-photos.ts` writes each one as
`sore-photos/<reading id>.jpg` in the plugin's `Directory.LibraryNoCloud`,
with no upload, no database column and nothing in the CSV export. Deleting a
sore or the account in the app deletes its photos on that device; photos
taken on another phone are out of reach.

They are also kept out of backups, which would otherwise copy them to the
cloud or to a new phone. On iOS `LibraryNoCloud` is `Library/NoCloud`, which
the plugin marks excluded from iCloud and device backups. On Android it is
the ordinary files dir, which Auto Backup includes, so `cap:patch` writes
`res/xml/backup_rules.xml` and `res/xml/data_extraction_rules.xml` excluding
`sore-photos` from cloud backup and device transfer, and points
`<application>` at them (`android:fullBackupContent`,
`android:dataExtractionRules`).

These two plugins are native code, so they arrive only with a new app
binary. The controls check `photosSupported()`, which needs the native
platform **and** both plugins actually present (`Capacitor.isPluginAvailable`),
so an installed app built before the plugins were added, and the website,
show no photo control at all. Android needs no permission: the camera asks
for none without `saveToGallery`, and the files dir is app-private.

Gradle 8.14 (the Capacitor 8 template's wrapper) needs JDK 21. If a newer
JDK, such as the one Android Studio bundles, fails the settings script with
"Unsupported class file major version", point `JAVA_HOME` at a JDK 21 (for
example Homebrew's `openjdk@21`):

```bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
```

Then, whenever `capacitor.config.ts` or a plugin changes:

```bash
npm run cap:ios            # sync + patch + open Xcode
npm run cap:android        # sync + patch + open Android Studio
```

To point a build at a local dev server instead of production — the usual way
to work on the native chrome — set the URL to your machine's LAN address, not
localhost, which inside the simulator means the simulator:

```bash
CAPACITOR_SERVER_URL=http://192.168.0.50:3100 npm run cap:sync
```

Icons and splash are generated from the Kanko art named in
`scripts/generate-app-icons.mjs`:

```bash
npm run cap:assets
```

That draws `resources/icon.png`, the two splash sources and the Android
notification icons in `resources/notification/`, then slices the icon and splash
into the sizes each platform wants. The slices land inside `ios/` and
`android/`, which are untracked — so this runs once per machine after
`cap:add:*`, and again whenever the master changes. Only `resources/`, the
web icons under `public/icons/` and the `app/icon.png` favicon are committed.

Run it before any build you intend to ship: without it both apps carry
Capacitor's default logo.

## The layout

Four shells, one per route group, all under the root layout:

| Group              | Chrome                | Where                          |
| ------------------ | --------------------- | ------------------------------ |
| `app/(marketing)`  | navbar + footer       | home, about, legal             |
| `app/(app)`        | top bar + bottom tabs | today, map, insights, settings |
| `app/(onboarding)` | none, just safe areas | the first-run flow             |
| `app/signin`       | wordmark only         | sign-in and password flows     |

The onboarding shell has no chrome on purpose: there is nowhere else to be
until the flow is done, and a tab bar over four empty screens is a poor first
impression. `app/(app)/layout.tsx` sends anyone whose `"onboardedAt"` is null
there before they reach a tab, which is why the check lives in a layout and
not in the proxy — the proxy runs on every request with only a cookie,
and this needs a column.

The signed-in app is the one with an app-shaped layout. Chrome is **fixed**
top and bottom with the content scrolling between them, because a sticky
header re-lays-out as the mobile address bar collapses, and it can be
scrolled away mid-gesture on the mouth map. `.app-scroll` supplies the
padding that keeps content clear of both bars.

Navigation is a bottom tab bar under `lg`, and the same four destinations
inline in the top bar from `lg` up. Sign out is in the top bar on desktop
and at the foot of Settings on a phone — it is an action, not a destination,
so it does not get a tab.

### The mouth map screen

One layout in CSS, two arrangements:

- **Phone** — title and "Mark a new sore", then the map, then the selected
  sore's detail inline under it (or the list of open sores when none is
  selected). It used to be a bottom sheet over a blurred map; inline, the
  detail can carry the course chart and still leave the map on screen.
- **Desktop** — the same pieces with the map on the left and the detail on
  the right, so the right half is never empty.

The editing session's undo snapshot lives in `SoreContext` rather than in a
component, because its controls are split across the screen: the add button
under the title, Cancel and Done under the map (floating over the tab bar
on a phone once a sore's reading is open, like Today's Save), the sore's
own actions in its detail.

## Conventions

Anything new should hold to these.

**Safe areas.** Read `--safe-top` / `--safe-bottom` / `--safe-left` /
`--safe-right`, or use `.safe-t` / `.safe-b` / `.safe-x`. Never call `env()`
directly — the variables are one place to adjust for a device the insets get
wrong. On Android, Capacitor 8's built-in SystemBars plugin owns edge-to-edge:
with `viewportFit: 'cover'` (set in `app/layout.tsx`) and Android System
WebView 140 or newer, `env()` reports the real insets; on an older WebView it
pads the app window and `env()` reads 0.

**Viewport units.** `dvh`, never `vh`. `vh` is the tallest the viewport ever
gets, which on a phone is the state with the address bar hidden.

**Touch targets.** Primary controls take `size="touch"` (48px, stepping down
to 40px on a pointer device). A control that must stay visually small gets
the `.tap-target` utility, which expands its hit area to 44px without
changing what is drawn.

**Coarse pointers, not narrow screens.** Size controls off
`@media (pointer: coarse)` (the `coarse:` Tailwind variant) where the
distinction matters. A small laptop
window is not a phone.

**Text selection.** Chrome is `user-select: none`; content elements opt back
in. Add `data-selectable` to anything new that a person might want to copy.

**Native APIs.** Go through `utils/native.ts`. Every helper there is a no-op
on the web, so nothing else has to branch on the platform. Links that leave
the app must use `openExternal` — the webview has no URL bar to get back
from github.com with.

**Keyboard.** Surfaces that a soft keyboard would cover pad themselves by
`--keyboard-h`, which `NativeBridge` maintains. On iOS the webview is not
resized. On Android, Capacitor 8's SystemBars plugin pads the app window by
the keyboard's height and offers no setting to stop that alone, so the
webview shrinks and `--keyboard-h` stays `0px` there to avoid lifting twice.
Viewport-fixed chrome would then ride up on top of the keyboard, so on
Android the tab bar and the floating Save and Done bars carry
`.keyboard-hides`, which hides them below `lg` while `data-keyboard="open"`
(both attributes are set by `NativeBridge`). Give any new fixed bottom chrome
the same class.
