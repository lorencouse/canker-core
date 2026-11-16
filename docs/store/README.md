# Store submission

What the App Store and Google Play need for Canker Core, and how to cut a
build for them.

- `app-store.md`: the App Store Connect record, the submitted listing, the
  age rating and App Privacy answers, and the readiness audit.
- `google-play.md`: the Play listing copy, App content forms (Data safety,
  content rating, health declarations) and graphics.
- `review-account.md`: the review account both stores sign in with.
- `play/`: Play icon, feature graphic and phone and tablet screenshots.

## Versions

`native/version.json` holds the marketing version (`1.0`), changed only on
purpose. The build number is the commit count of `main`, the same N as the
site's "v1.N", so a build cut from a newer main always numbers higher. Both
reach the generated projects through `npm run cap:patch` (run by
`cap:sync`, `cap:ios`, `cap:android` and `cap:add:*`), which prints
`version 1.0 (N)`.

- Off main, the build is numbered 1 so it can never pass for a store build.
  To cut a store build from somewhere else, set `NATIVE_BUILD_NUMBER`.
- `minBuildNumber` refuses anything at or below what the stores already have
  (1.0 (111) is in App Store Connect; 1.0 (113) was built for Play).
- App Store Connect refuses a build for a version it has already approved,
  so bump `marketingVersion` after each approval. Play only needs the build
  number to rise.

## iOS build and upload

From a clean, up-to-date `main` on the Mac (never on the server):

```bash
npm ci
npm run cap:sync                       # prints version 1.0 (N)
npm run cap:assets                     # only on a freshly generated ios/
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
xcodebuild -workspace ios/App/App.xcworkspace -scheme App \
  -configuration Release -destination generic/platform=iOS \
  -archivePath "$HOME/Library/Developer/Xcode/Archives/$(date +%F)/Canker Core 1.0 (N).xcarchive" \
  -allowProvisioningUpdates DEVELOPMENT_TEAM=4J28Z4QS4C archive
```

Upload with the owner's Admin App Store Connect API key (the `.p8` lives in
`~/.appstoreconnect/private_keys/`; an App Manager key cannot cloud-sign):

```bash
xcodebuild -exportArchive -archivePath "<the .xcarchive>" \
  -exportOptionsPlist <plist: method app-store-connect, destination upload, teamID 4J28Z4QS4C> \
  -exportPath <scratch dir> -allowProvisioningUpdates \
  -authenticationKeyPath <.p8> -authenticationKeyID <key id> \
  -authenticationKeyIssuerID <issuer id>
```

## Android build

```bash
npm ci
npm run cap:sync                       # prints version 1.0 (N)
npm run cap:assets                     # only on a freshly generated android/
cd android
JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
ANDROID_HOME=$HOME/Library/Android/sdk ./gradlew --no-daemon bundleRelease
```

The project has no signing config, so that bundle is unsigned. Sign it with
the upload key passed only as Gradle properties in the environment, never
written to a file in the repo or printed:
`ORG_GRADLE_PROJECT_android.injected.signing.store.file`, `.store.password`,
`.key.alias` and `.key.password`. Then
`jarsigner -verify app/build/outputs/bundle/release/app-release.aab` must
say "jar verified". With Play App Signing, Google holds the app signing key
and this key only uploads.

The release manifest should carry exactly these permissions: INTERNET,
POST_NOTIFICATIONS, RECEIVE_BOOT_COMPLETED, VIBRATE, WAKE_LOCK and
`health.READ_SLEEP` (check
`android/app/build/intermediates/merged_manifest/release/processReleaseMainManifest/AndroidManifest.xml`).
Target SDK 36, minimum 26.

## Who presses what

Never from an agent: Submit for Review, Send for review, Release, Start
rollout to production, pricing, agreements, tax, and the trader or other
legal declarations. Those are the owner's.
