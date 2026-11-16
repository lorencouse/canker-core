# App Store: Canker Core

App Store Connect app **6834584957**, bundle `com.cankercore.app`, SKU
`cankercore-ios`, team 4J28Z4QS4C (Kouzr, Inc.). Universal (iPhone and iPad),
iOS 15.0 and later.

## State on 2026-11-16

- Version **1.0**, build **1.0 (111)** attached, **Waiting for Review** since
  2026-11-13, release **manual** (the owner presses Release after approval).
- Builds 110 and 111 are uploaded and valid. Both declare no non-exempt
  encryption.
- Do not change this version while it is in review. Anything below marked
  "next build" waits for version 1.0.1 or 1.1.

## Listing as submitted

| Field              | Value                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| Name               | Canker Core                                                                                       |
| Subtitle           | Track mouth sores as they heal                                                                    |
| Categories         | Health & Fitness, Medical                                                                         |
| Promotional text   | Mark where a sore is, log its size and pain each day, and see whether it is actually shrinking.   |
| Keywords           | canker sore,mouth ulcer,ulcer tracker,symptom log,pain diary,aphthous,oral health,healing,tracker |
| Support URL        | https://cankercore.com/support                                                                    |
| Marketing URL      | https://cankercore.com                                                                            |
| Privacy policy URL | https://cankercore.com/privacy                                                                    |
| Copyright          | 2026 Canker Core                                                                                  |
| Screenshots        | 4 iPhone at 1320x2868 (6.9-inch), 4 iPad at 2064x2752 (13-inch): Today, map, sore, Insights       |

The description (1,679 characters) ends with "Canker Core is a log, not a
diagnosis … Not medical advice." and the privacy and terms links. The live
copy is the source; read it back with the App Store Connect API rather than
keeping a second copy here.

All four URLs answered 200 on 2026-11-16.

## Age rating answers (submitted, rated 12+)

Health or wellness topics: yes. Medical or treatment information: infrequent
or mild. Everything else (violence, sexual content, profanity, horror,
alcohol/tobacco/drugs, gambling, contests, loot boxes, guns, mature themes)
none or no. No user-generated content, messaging, social media, advertising,
parental controls or unrestricted web access.

## App Privacy (the label)

The label cannot be read through the API; check it in App Store Connect >
App Privacy against this list, derived from `schema.sql` and the app code.
None of it is used for tracking, and all of it is linked to the user.

| Apple data type                  | What it is                                                                                    | Purpose           |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ----------------- |
| Contact info: Email address      | sign-in                                                                                       | App functionality |
| Contact info: Name               | profile name, or the name an OAuth provider shares                                            | App functionality |
| Health & Fitness: Health         | sores (place, size, pain), triggers, treatments, sleep, stress, and the HealthKit sleep total | App functionality |
| User content: Other user content | notes on readings and days                                                                    | App functionality |
| Identifiers: User ID             | the account id                                                                                | App functionality |
| Usage data: Other usage data     | first page visited and referring site, saved with a new account                               | Analytics         |

Not collected: photos (sore photos stay on the device), location, contacts,
browsing history, purchases, diagnostics, device ids. The new
`PrivacyInfo.xcprivacy` (next build) declares the same list.

## Review notes (as submitted)

They describe the app, point to the demo account, explain the HealthKit
sleep read (Today > Check in > Sleep > Import from Health), on-device
photos, Sign in with Apple, and "Account deletion: Settings > Account >
Delete account". This PR moves Delete account under the Account group so the
app matches that path once the site is deployed.

## Readiness audit (2026-11-16, build 111 and the live site)

| #   | Guideline                 | Result            | Evidence and action                                                                                                                                                                                                                                                                                                      |
| --- | ------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | 2.1 demo account          | **FAIL**          | `appreview@cankercore.com` is in Sign-In Information but does not exist in production. Owner creates it now: `review-account.md`.                                                                                                                                                                                        |
| 2   | 4.2 minimum functionality | Pass, some risk   | Native: UITabBar (Liquid Glass), HealthKit sleep import, camera and photo picker, local notifications, haptics, share sheet, action sheets, Sign in with Apple sheet, system sign-in sheet, offline screen. All named in the review notes. A cold launch goes to Today (signed in) or sign-in, never the marketing page. |
| 3   | 1.4.1 health claims       | Pass              | No diagnosis, cure or treatment claims. Insights label findings "Pattern, not proof". This PR adds "A log, not medical advice" inside the app (Settings, Insights) and softens the one causal sentence about recurring spots.                                                                                            |
| 4   | 5.1.1(v) account deletion | Pass              | Settings > Delete account deletes everything and revokes the Apple grant (`lib/apple.ts`).                                                                                                                                                                                                                               |
| 5   | 4.8 Sign in with Apple    | Pass              | Live sign-in shows Continue with Apple first, then Google and GitHub; native Apple sheet in the app.                                                                                                                                                                                                                     |
| 6   | 5.1.1(i) privacy policy   | Pass after deploy | Live page omitted Apple sign-in, provider tokens, session IP and device; fixed in this PR. Settings now links Privacy, Terms and Help.                                                                                                                                                                                   |
| 7   | HealthKit (2.5.1, 5.1.3)  | Pass              | Read-only sleep, asked on tap; usage strings present; entitlement with empty access list; no write types. Label must include Health (row above).                                                                                                                                                                         |
| 8   | Privacy manifest          | Next build        | Build 111 has only Capacitor's own manifests and processed without a warning. The next build adds the app's `PrivacyInfo.xcprivacy` (file timestamps C617.1, UserDefaults CA92.1, collected data, no tracking).                                                                                                          |
| 9   | Push permission timing    | Pass              | Asked at the end of the welcome flow behind a switch, from Today's reminder offer, or Settings; never at launch.                                                                                                                                                                                                         |
| 10  | Offline                   | Pass              | `native/shell/index.html`: "Canker Core is offline" with Try again; the splash times out on its own.                                                                                                                                                                                                                     |
| 11  | iPad                      | Pass              | Universal, all orientations; screenshots show the iPad layout; the rail and native tab bar follow `docs/MOBILE.md`.                                                                                                                                                                                                      |
| 12  | Export compliance         | Pass              | Builds report no non-exempt encryption; the next build also carries `ITSAppUsesNonExemptEncryption = false`.                                                                                                                                                                                                             |
| 13  | Categories                | Low risk          | Medical as the second category invites closer 1.4.1 reading; consider dropping it in the next version.                                                                                                                                                                                                                   |

## Next build (1.0.1 or 1.1)

Cut it only after 1.0 is approved, or if review rejects 1.0 for something
that needs a new binary.

1. Bump `marketingVersion` in `native/version.json` past the approved one.
2. From an up-to-date `main`: `npm ci`, then regenerate (`docs/MOBILE.md`) or
   `npm run cap:sync`, which prints `version <marketing> (<build>)`; the build
   number is main's commit count and must be above 111.
3. Archive with Xcode's Release configuration and upload with the App Store
   Connect API key (see `README.md`).
