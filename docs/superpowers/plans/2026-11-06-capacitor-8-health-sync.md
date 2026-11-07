# Capacitor 8 Upgrade and Health Sleep Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the native apps to Capacitor 8. Then add "Import from Health" to the check-in's Sleep screen, reading last night's sleep from Apple Health (iOS) and Health Connect (Android).

**Architecture:** Two tasks.
- Task 1 bumps every `@capacitor/*` package to 8.x and adapts the native patch layer (`utils/native-patches.mts`, `scripts/patch-native.mjs`) to the Capacitor 8 templates. App behaviour does not change.
- Task 2 is the deferred Task 11 of `docs/superpowers/plans/2026-11-06-daily-check-in.md`. It is built on Capacitor 8 with a Health plugin that reads sleep on both platforms.

**Tech Stack:** Capacitor 8.x (core/cli/ios/android 8.6, matching plugin 8.x releases), Next.js 16, Vitest. Health plugin: `@capgo/capacitor-health` 8.11.x or `@capacitor/health-fitness`, whichever the Task 2 implementer verifies reads sleep on both platforms.

**Spec:** `docs/superpowers/specs/2026-11-06-daily-check-in-design.md`. Health import is designer call 7 and the "Sleep import" decision. Phase 2 rollout applies.

## Global Constraints

- Every `@capacitor/*` package moves to the same 8.x line. `@capacitor/assets` moves to 4.x if it needs to for Capacitor 8. No package stays on 7.x.
- `ios/` and `android/` are generated and gitignored. Native changes go only through idempotent patches in `utils/native-patches.mts`, wired into `scripts/patch-native.mjs`, each with fixture tests. When a patch fails to find its anchor it throws `PatchAnchorError`.
- Patches are verified against the real Capacitor 8 templates shipped in `node_modules/@capacitor/cli/assets/`. Apply each patch twice: the first run patches, the second changes nothing.
- The iOS deployment target stays at whatever the Capacitor 8 template requires, and never below 15.0 (the Xcode 27 floor).
- Health import is read-only. It asks permission only when the user taps `Import from Health`, never up front. It prefills hours only; quality stays manual. It saves `sleep_source` as `apple_health` or `health_connect`. Editing the hours resets the source to `manual`. Refusal or no data shows a quiet inline line, `No sleep found for last night`, and no error toast.
- The Health control is gated on `Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('<Plugin>')`. A web fallback can make `isPluginAvailable` true on the website.
- Copy rules from `AGENTS.md`: sentence case, no em-dashes, one-line buttons, 44px touch targets.
- The privacy page says sleep is read only when the user taps import, and only total hours and the source are stored.
- The owner is the only user and production holds test data, so no backward-compatibility work for old app binaries is needed.

## Review Focus

1. **The website running inside a Capacitor 7 app binary still on the owner's phone.** It should not crash. Gating on `isPluginAvailable` keeps the Health control hidden, and the owner will reinstall.
2. **A night that crosses midnight, with naps and awake stretches.** Hours should count only asleep time inside the window, with no double counting. Covered by Task 2 tests.
3. **Health permission refused or revoked later.** The quiet inline line shows and nothing breaks. Covered by Task 2 tests.
4. **Running `cap:sync` twice on a fresh `cap add`.** The second run makes no changes and throws no errors. Covered by Task 1 template verification.
5. **Local notifications, camera, filesystem and keyboard APIs whose signatures changed in 8.x.** The existing calls must still type-check and the tests must pass. Covered by Task 1.

---

### Task 1: Upgrade Capacitor to 8

**Files:**
- Modify: `package.json`, `package-lock.json`
- Modify: `utils/native-patches.mts`, `scripts/patch-native.mjs`, `utils/native-patches.test.ts`, as the Capacitor 8 templates require
- Modify: any call site whose plugin API changed. Check `utils/reminders.ts`, `utils/sore-photos.ts`, `utils/native.ts`, `components/native/NativeBridge.tsx` and `capacitor.config.ts`.
- Modify: `docs/MOBILE.md` (versions, build prerequisites)

**Interfaces:**
- Produces: the same app behaviour on Capacitor 8. No exported function signatures change, unless a plugin API forces it; any such change is listed in the report.

- [ ] **Step 1: Read the Capacitor 8 migration notes and bump the packages.** Read the notes from `node_modules/@capacitor/cli` docs, its CHANGELOG, or `npx cap migrate --help`. Bump all `@capacitor/*` to their latest 8.x. Run `npm install`.
- [ ] **Step 2: Run `npx tsc --noEmit && npm test`.** Fix every break caused by plugin API changes, keeping behaviour identical. Expected: PASS.
- [ ] **Step 3: Unpack the Capacitor 8 iOS and Android templates from `node_modules/@capacitor/cli/assets/`.** Run `scripts/patch-native.mjs` against copies of them twice. Expected: the first run patches every file, and the second reports nothing changed. Update any patch whose anchor moved, and update its fixtures to the Capacitor 8 template text. Retire any patch Capacitor 8 makes unnecessary, such as an iOS target the template already sets, and say so in the report.
- [ ] **Step 4: Run `npm test && npx tsc --noEmit && npm run lint && npm run build`.** Expected: all pass. Update `docs/MOBILE.md`. Commit: `chore(native): upgrade Capacitor to 8`.

### Task 2: Health sleep import

The deferred Task 11 text in `docs/superpowers/plans/2026-11-06-daily-check-in.md` (Files, Interfaces and Steps 1–3 and 5) is this task's requirements, applied on Capacitor 8. That plan's Task 11 research table lists the candidate plugins.

**Interfaces:**
- Consumes: `components/check-in/SleepStep.tsx` `importSlot` prop. SleepStep already tracks `source`, and editing the hours resets it to `manual`.
- Produces:
  - `utils/health-sleep.ts`: `sleepImportSupported(): boolean`; `importLastNight(now: Date): Promise<{ hours: number; source: 'apple_health' | 'health_connect' } | null>`; `sumAsleepHours(segments: { start: Date; end: Date; stage: string }[], windowStart: Date, windowEnd: Date): number`.
  - `components/check-in/SleepImport.tsx`.

- [ ] **Step 1: Pick the plugin.** Unpack `@capgo/capacitor-health@8` and `@capacitor/health-fitness`. Choose the one that reads sleep segments with stages on both HealthKit and Health Connect and asks for read-only sleep permission. Record the choice and the evidence in the report. Install it.
- [ ] **Step 2: Write the tests.** They must fail first, then pass. Use the deferred Task 11 Step 1 list.
  - Overlap is not double-counted.
  - Awake and in-bed time is excluded.
  - Segments are clipped to the window.
  - 7h40m becomes 7.75.
  - Denied permission returns null.
  - The import is unsupported on web and when the plugin is missing.
- [ ] **Step 3: Implement `utils/health-sleep.ts` and `SleepImport`, and wire them into the Sleep screen's `importSlot`.**
- [ ] **Step 4: Add native patches with fixture tests, verified on the Capacitor 8 templates.**
  - iOS: the HealthKit entitlement or capability (entitlements file and `project.pbxproj` as needed) and `NSHealthShareUsageDescription`. The copy says the app reads sleep only when you ask and stores only the hours.
  - Android: `android.permission.health.READ_SLEEP`, the Health Connect privacy-policy activity alias or intent filter, and any `<queries>` entry the plugin requires.
- [ ] **Step 5: Update the privacy page and `docs/MOBILE.md`.** `docs/MOBILE.md` gets the plugin, permissions, App Store review notes and the Play Console health declaration text. Run `npm test && npx tsc --noEmit && npm run lint && npm run build`. Commit: `feat(native): import last night's sleep from Health`.
- [ ] **Step 6: List the on-device test steps for the owner in the report.** Cover iOS with Health sleep data and Android with Health Connect: refusal, no data, and a normal night.
