# Google Play: Canker Core

Package `com.cankercore.app`, free, en-US, on the Kouzr, Inc. organization
developer account (so the 12-testers-for-14-days closed test does not apply;
internal testing can go straight to production review). Everything below is
derived from the code at the commit that added this file; re-check it when the
app collects something new.

## Store listing

**App name** (30 max, 28 used)

```
Canker Core: Canker Sore Log
```

**Short description** (80 max, 78 used)

```
Map your mouth sores, log size and pain each day, and see if they are healing.
```

**Full description** (4000 max)

```
Know whether it's healing. Canker sores all feel like they last forever. Canker Core is a private log for recurring mouth ulcers: mark where a sore is, log its size and pain each day, and find out whether it is actually shrinking, and whether anything you tried made a difference.

HOW IT WORKS
- Mark it: tap the spot on the mouth map (the front of the open mouth, the cheeks or the lips), then set how wide it is and how much it hurts
- Update it: come back and move the two sliders. Every reading is kept, not overwritten
- See it close: the history chart shows the size falling. If it is not falling, you will see that too

A ONE-MINUTE DAILY CHECK-IN
Tick the triggers and treatments of the day, add a note, and log your sleep and stress. A reminder can nudge you once a day, at a time you pick.

ONE PAIN SCALE, USED EVERYWHERE
Pain from 1 to 10 is the only thing that gets a colour, and the same ramp appears on the map, in the history chart and in every table, so a glance tells you how bad a day was.

SPOT YOUR PATTERNS
Insights show what came before your sores, how long they took to heal and how bad they got. Patterns, not proof: a repeat is worth watching.

MADE FOR YOUR PHONE
- Fill in last night's sleep from Health Connect with one tap (read only, and only when you tap)
- Take a photo of a sore to compare later. Photos stay on your phone and are never uploaded
- Sign in with Google in a tap, or with email, Apple or GitHub

PRIVATE BY DESIGN
Your sores are readable only by your own account. Records are not sold, shared with advertisers or used to train anything. Download everything as a CSV file, or delete your account and every reading in Settings.

Canker Core is a log, not a diagnosis. It has no opinion about treatments and does not diagnose anything. A mouth ulcer that has not started shrinking after two weeks, keeps coming back, or comes with fever or weight loss is worth taking to a doctor or dentist. Not medical advice.
```

- **App category:** Health & Fitness. (Not Medical: the app gives no medical
  information or treatment; it is a personal log.)
- **Tags:** pick the closest to "Health tracker" / "Symptom tracker" offered.
- **Contact:** email hello@cankercore.com, website https://cankercore.com.
  A phone number is optional; leave it empty unless the owner wants one.
- **Privacy policy:** https://cankercore.com/privacy

**Graphics** (all in `docs/store/play/`):

| Asset                                 | File                       | Spec                                           |
| ------------------------------------- | -------------------------- | ---------------------------------------------- |
| App icon                              | `play/icon-512.png`        | 512x512, 32-bit PNG, from `resources/icon.png` |
| Feature graphic                       | `play/feature-graphic.png` | 1024x500, no alpha                             |
| Phone screenshots                     | `play/phone-*.png`         | 1080x1920 (9:16)                               |
| 7-inch and 10-inch tablet screenshots | `play/tablet-*.png`        | 1600x2560 (10:16)                              |

The screens are the Android app itself (debug build on the emulator, with
its native Material navigation bar) signed in to a scratch backend with the
review account's demo history (`play/source/README.md`).

## App content (Policy > App content)

| Form                 | Answer                                                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Privacy policy       | https://cankercore.com/privacy                                                                                         |
| Ads                  | No ads                                                                                                                 |
| App access           | All or some functionality is restricted: review account below                                                          |
| Content rating       | IARC questionnaire below                                                                                               |
| Target audience      | 18 and over. Not designed for children; does not appeal to children                                                    |
| News app             | No                                                                                                                     |
| Government app       | No                                                                                                                     |
| Financial features   | None                                                                                                                   |
| Health apps          | Yes, see the declaration below                                                                                         |
| Health Connect       | READ_SLEEP only, see below                                                                                             |
| Data safety          | Below                                                                                                                  |
| Advertising ID       | Not used (no AD_ID permission in the merged manifest)                                                                  |
| Account deletion URL | https://cankercore.com/support (explains Settings > Delete account; the same works signed in on the website) |
| Exact alarms         | Not declared: `SCHEDULE_EXACT_ALARM` is stripped from the manifest and reminders are inexact                           |

### App access (review account)

```
Sign-in is required, since every record belongs to an account. On the sign-in screen choose "Password" and use the account above. The account already has a few sores and a month of check-ins, so the map, the history charts and Insights have something to show.

Native features to try: the bottom navigation bar, Today > Check in (the daily check-in), on the Sleep step "Import from Health" (Health Connect, read sleep only, asked when tapped), the camera on a sore's reading (photos stay on the phone), the daily reminder (Settings > Reminders), and the share sheet for Settings > Export data.
```

See `docs/store/review-account.md` for creating the account.

### Content rating (IARC)

Email hello@cankercore.com. Category: **All other app types**.

| Question                                                    | Answer                                                                                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Violence, blood, sexuality, nudity, profanity, crude humour | No                                                                                                           |
| Fear or horror                                              | No                                                                                                           |
| Controlled substances (drugs, alcohol, tobacco)             | No. The trigger list has "Alcohol" and "Coffee" as things a person can tick; nothing depicts or promotes use |
| Gambling, simulated gambling                                | No                                                                                                           |
| Users can interact or exchange content                      | No (every record is private to its account; no sharing between users)                                        |
| Shares the user's location with others                      | No                                                                                                           |
| Digital purchases                                           | No                                                                                                           |
| Unrestricted internet access                                | No (the webview only navigates to cankercore.com and the sign-in providers)                                  |
| Is this a news app                                          | No                                                                                                           |

Expected: Everyone / PEGI 3 / USK 0. Apple rated the same answers 12+
because it asks about medical information separately (see `app-store.md`).

### Health apps declaration

Feature: **Disease and condition management** (also tick "Symptom tracking"
or the nearest offered). Text for "Describe the health features":

```
Canker Core helps people track recurring mouth ulcers (canker sores): where each sore is on a mouth map, its size and pain each day until it heals, and a daily check-in of triggers, treatments, sleep and stress. Insights show how long sores took to heal and what came before them, labelled as patterns, not proof. It gives no diagnosis or treatment advice and says it is not medical advice. It reads sleep from Health Connect only when the user taps "Import from Health".
```

It is not a medical device and makes no regulated medical claims.

### Health Connect permissions (READ_SLEEP)

The merged release manifest declares exactly one health permission,
`android.permission.health.READ_SLEEP`. Justification:

```
Canker Core helps people track recurring mouth ulcers (canker sores) and the habits that may trigger them, including sleep. The app reads Health Connect sleep sessions (READ_SLEEP) only when the user taps "Import from Health" on the Sleep step of the daily check-in. It sums the time asleep for the night that ended that morning and pre-fills the "Hours asleep" field, which the user can edit. Only that total number of hours, and the fact that it came from Health Connect, is stored with the user's daily log so they can compare sleep with flare-ups. The app requests no other health permission, never writes to Health Connect, does not read in the background, and does not share or sell health data or use it for advertising. Privacy policy: https://cankercore.com/privacy
```

Play may also ask for a video of the permission flow: record Today > Check in

> continue to Sleep > Import from Health > the Health Connect sheet.

### Data safety

- Does the app collect or share any of the required user data types? **Yes**
- Is all user data encrypted in transit? **Yes** (HTTPS only; cleartext is off
  in the release build)
- Account creation: **Username and password** (email and password, email
  link), **OAuth** (Apple, Google, GitHub)
- Can users request deletion? **Yes**, in the app (Settings > Account > Delete
  account) and at https://cankercore.com/support
- Shared with third parties: **None.** Sign-in emails go through the mail
  provider as a service provider, which Play does not count as sharing.

| Category           | Data type                                                                         | Collected | Optional | Purposes                              |
| ------------------ | --------------------------------------------------------------------------------- | --------- | -------- | ------------------------------------- |
| Personal info      | Name                                                                              | Yes       | Yes      | App functionality, Account management |
| Personal info      | Email address                                                                     | Yes       | No       | App functionality, Account management |
| Personal info      | User IDs                                                                          | Yes       | No       | Account management                    |
| Health and fitness | Health info                                                                       | Yes       | No       | App functionality                     |
| App activity       | Other user-generated content (notes)                                              | Yes       | Yes      | App functionality                     |
| App activity       | App interactions (first page visited and referring site, kept with a new account) | Yes       | No       | Analytics                             |

None is processed ephemerally; all is linked to the account. Health info
covers the sores (position, size, pain), triggers and treatments (one trigger
is "Period"), sleep hours and quality, and stress.

Not collected: location, financial info, messages, photos and videos (sore
photos never leave the phone, and on-device processing is not collection),
audio, files, calendar, contacts, web browsing, installed apps, crash logs,
diagnostics, device or other IDs. There is no analytics, ads or crash SDK.

## Release

Internal testing first (no review), then production. See `README.md` for the
build and signing steps and what only the owner can press.

After Play App Signing is set up, add the **app signing key** SHA-256 from
Play Console > Test and release > App integrity to
`public/.well-known/assetlinks.json` beside the debug one, then deploy, so the
sign-in App Link verifies for Play installs (`docs/MOBILE.md`).
