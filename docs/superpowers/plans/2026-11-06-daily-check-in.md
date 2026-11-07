# Daily Check-in Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A guided, full-screen daily check-in (sores one by one, new sores, sleep, food, health & mood, treatments, finish) that auto-starts until done or skipped, plus a morning reminder, device-only sore photos and Health sleep import.

**Architecture:** The check-in is a client overlay on Today, opened by auto-start, by the Today header button, or by `/today?checkin=1`. A pure step model (`utils/check-in/`) decides the order, the default days and when to auto-start. The screens are thin components over it. Done/skipped lives in a new `check_ins` table, while the resume step lives in `localStorage`. Habit data extends `day_logs` and is written through a partial-update action. Phase 1 (Tasks 1–9) ships on the web alone. Phase 2 (Tasks 10–11) adds native plugins, and each one stays hidden until `Capacitor.isPluginAvailable` reports it.

**Tech Stack:** Next.js 16 App Router with server actions, React 19, raw `pg`, Tailwind/shadcn, Vitest, Capacitor 7 (`@capacitor/local-notifications` is already installed; `@capacitor/camera`, `@capacitor/filesystem` and a Health plugin are new).

**Spec:** `docs/superpowers/specs/2026-11-06-daily-check-in-design.md`

## Global Constraints

- "Today" is the device's local day, `dayKey(new Date())` from `utils/readings.ts`. The server never computes "today" for the check-in.
- There is one reading per sore per local day (`utils/readings.ts`, `utils/sore-payload.ts`). A sore step for a sore already read today edits that reading.
- Schema changes go in `schema.sql` (re-runnable) and in a dated `migrations/2026-11-06-*.sql`. Take a `pg_dump` into `backups/` before applying either to production.
- Ownership: every action takes the user id from the session and scopes every write by `user_id`, following `utils/actions/soreActions.ts`.
- UI follows the `AGENTS.md` rules: one-line buttons, 44px touch targets (`coarse:`), `dvh`, `--safe-*`, no em-dashes in copy, sentence case, red only for `--sev-*`, Momentum/Kanko voice.
- No third-party analytics. Photos never leave the device.
- Native-only controls check `Capacitor.isPluginAvailable('<Plugin>')`, not just `isNative()`, so the current app versions show no broken controls.
- Exact copy:
  - Morning notification: title `Morning check-in`, body `How are your sores today? About a minute.`
  - Evening notification: title `Still time to check in`, body `Log today in about a minute.`
  - Both deep-link to `/today?checkin=1`.
  - Skip button: `Skip for today`. Per-step pass: `Not now`. Clean-day chip: `None today`.
  - Today header button: `Check in`, or `Done ✓, edit` once done.
  - Finish heading: `All logged`.
- Morning reminder: off by default, `08:00`. Evening reminder keeps its existing default `20:00`.
- Derived triggers: `stress >= 4` → `Stress`; `sleep_quality <= 2` or `sleep_hours < 6` → `Poor sleep`.

## Review Focus

1. **Closing the app mid-step and reopening it later that day** should resume at that step, not restart it, and never re-save a sore twice for the day. Covered by tests in Task 4 (resume) and Task 6.
2. **A check-in that started before midnight and resumed after it** should start fresh for the new day: a stale resume position must not apply to the new day. Covered by a test in Task 4.
3. **Logging a sore on Today after the check-in, or the check-in after Today's DayLogForm**, should keep the other path's data: `saveDayLog` must not wipe the sleep, stress or answered columns. Covered by a test in Task 2.
4. **Marking a sore healed in the check-in** should still save today's reading if one was entered, and the sore should vanish from tomorrow's steps. Covered by a test in Task 3.
5. **The current app version (no Camera or Health plugin) loading the new site** should show no photo or import control and no errors. Covered by tests in Tasks 10 and 11.

---

### Task 1: Schema, migration, types and queries

**Files:**
- Modify: `schema.sql` (the `day_logs` block, plus a new `check_ins` table after it)
- Create: `migrations/2026-11-06-daily-check-in.sql`
- Modify: `types.ts:49-55` (`DayLog`); add `CheckIn`
- Modify: `lib/queries.ts:100-108` (`getDayLogs`); add `getRecentCheckIns`

**Interfaces:**
- Produces:
  - `DayLog` gains `sleep_hours: number | null`, `sleep_quality: number | null`, `sleep_source: 'manual' | 'apple_health' | 'health_connect' | null`, `stress: number | null`, `food_answered: boolean` and `health_answered: boolean`.
  - `interface CheckIn { day: string; status: 'done' | 'skipped' }`
  - `getRecentCheckIns(userId: string): Promise<CheckIn[]>` returns the last 3 days by `day`.

- [ ] **Step 1: Write the SQL.**
  - In `day_logs`, add columns with `alter table day_logs add column if not exists`:
    - `sleep_hours numeric(4,2) check (sleep_hours between 0 and 24)`
    - `sleep_quality smallint check (between 1 and 5)`
    - `sleep_source text check (in ('manual','apple_health','health_connect'))`
    - `stress smallint check (between 1 and 5)`
    - `food_answered boolean not null default false`
    - `health_answered boolean not null default false`
  - New table `check_ins (user_id text references "user" on delete cascade, day date, status text check (status in ('done','skipped')), updated_at timestamptz default now(), primary key (user_id, day))`.
  - The migration also runs `update day_logs set food_answered = true, health_answered = true` for all existing rows, so legacy logs keep counting toward streaks.
  - Write `schema.sql` as `alter ... if not exists` statements after the `create table`, so it stays re-runnable on existing databases.
- [ ] **Step 2: Apply locally and check.** Run `psql "$DATABASE_URL" -f migrations/2026-11-06-daily-check-in.sql` twice. Expected: no errors on the second run. `\d day_logs` shows the six columns.
- [ ] **Step 3: Extend the types and `getDayLogs`.** Select the new columns, casting `sleep_hours::float8`. Add `getRecentCheckIns`, which selects `to_char(day,'YYYY-MM-DD') as day, status`.
- [ ] **Step 4: Run `npx tsc --noEmit`.** Expected: any errors point only at `DayLog` object literals in tests and components. Fix those by spreading a new `emptyDayLog(day: string): DayLog` exported from `utils/day-log.ts`, which sets all new fields to null/false.
- [ ] **Step 5: Run `npm test`.** Expected: PASS. Then commit: `feat(check-in): schema for habit fields and check-in status`.

### Task 2: Shared trigger mapping, streak rule and safe `saveDayLog`

**Files:**
- Modify: `utils/day-log.ts`, `utils/momentum.ts:25-41`, `utils/insights.ts:61-82`, `utils/actions/soreActions.ts:223-258`, `components/today/DayLogForm.tsx`
- Test: `utils/day-log.test.ts` (new), `utils/momentum.test.ts`, `utils/insights.test.ts`

**Interfaces:**
- Produces, in `utils/day-log.ts`:
  - `FOOD_TRIGGERS`: Sharp or hard food, Spicy food, Acidic food, Citrus, Nuts, Chocolate, Coffee, Alcohol.
  - `HEALTH_TRIGGERS`: Feeling ill, Period, Bit my cheek or lip, Dental work, Toothpaste with SLS.
  - `TRIGGERS` stays the full list for `pickKnown`, legacy data included.
  - `effectiveTriggers(log: DayLog): string[]` returns the stored triggers plus the derived `Stress`/`Poor sleep`, de-duplicated, in `TRIGGERS` order.
  - `isAnsweredClean(log: DayLog | undefined): boolean` is true when `food_answered && health_answered && effectiveTriggers(log).length === 0`.
  - `emptyDayLog(day: string): DayLog` (from Task 1).

- [ ] **Step 1: Write failing tests.**
  - `effectiveTriggers({...emptyDayLog('2026-11-06'), stress: 4})` contains `'Stress'`.
  - With `stress: 3` it doesn't.
  - `sleep_quality: 2` gives `'Poor sleep'`, and so does `sleep_hours: 5.5`.
  - `sleep_hours: 6` with `sleep_quality: 3` gives nothing.
  - Legacy `triggers: ['Stress']` together with `stress: 5` yields `'Stress'` once.
  - `isAnsweredClean` is false when `health_answered` is false, even with empty triggers.
  - In `momentum.test.ts`: `triggerFreeStreak` does not count a day whose only data is sleep (flags false). It does count a day with both flags true and nothing ticked.
  - In `insights.test.ts`: `triggersBeforeSores` tallies a derived `Stress` from `stress: 5`.
- [ ] **Step 2: Run `npx vitest run utils/day-log.test.ts utils/momentum.test.ts utils/insights.test.ts`.** Expected: FAIL.
- [ ] **Step 3: Implement the helpers.** Make `isTriggerFree` in momentum delegate to `isAnsweredClean`. Make `triggersBeforeSores` iterate `effectiveTriggers(log)`.
- [ ] **Step 4: Change `saveDayLog` so it writes only `triggers`, `treatments` and `note`, and sets both `*_answered = true`.** Saving the full form is an explicit answer. Delete the row only when it would hold no data in any column, using one SQL statement: upsert, then `delete ... where` every data column is empty or null. `DayLogForm` lists `FOOD_TRIGGERS` and `HEALTH_TRIGGERS` and no longer shows a Stress or Poor sleep checkbox. It keeps showing legacy ticked values that are not in those lists, so they can be unticked.
- [ ] **Step 5: Add a test for `saveDayLog` keeping the habit columns.** Mock `pool.query` the way the existing action tests do; if there are none, put the SQL in an exported `buildSaveDayLogSql()` and test that. Assert that the update clause never mentions `sleep_hours` or `stress`.
- [ ] **Step 6: Run `npm test`.** Expected: PASS. Then commit: `feat(check-in): derived stress and sleep triggers, answered-day streak`.

### Task 3: Check-in server actions

**Files:**
- Create: `utils/actions/checkInActions.ts`
- Create: `utils/check-in/patch.ts` (pure validation)
- Test: `utils/check-in/patch.test.ts`

**Interfaces:**
- Consumes: `DayLog` fields (Task 1), `FOOD_TRIGGERS`/`HEALTH_TRIGGERS`/`TREATMENTS`/`pickKnown` (Task 2), `upsertSores` and `setSoreHealed` from `soreActions.ts`, and `ActionResult`.
- Produces:
  - `type DayPatch = { sleep?: { hours: number | null; quality: number | null; source: DayLog['sleep_source'] }; food?: string[]; health?: { triggers: string[]; stress: number | null }; treatments?: string[] }`
  - `validatePatch(p: unknown): DayPatch | null` (pure)
  - `saveDayPatch(day: string, patch: DayPatch): Promise<ActionResult>`
    - `food` replaces only the FOOD_TRIGGERS subset of `triggers` and sets `food_answered = true`.
    - `health` replaces only the HEALTH_TRIGGERS subset, sets `stress`, and sets `health_answered = true`.
    - `sleep` sets the three sleep columns.
    - `treatments` replaces `treatments`.
    - All other columns stay untouched.
  - `setCheckInStatus(day: string, status: 'done' | 'skipped'): Promise<ActionResult>` upserts into `check_ins`. A `skipped` never overwrites a `done`.

- [ ] **Step 1: Write failing tests for `validatePatch`.**
  - Unknown trigger values are dropped.
  - `quality: 6` → null.
  - `hours: 25` → null.
  - `hours: 7.25` is kept.
  - `stress: 0` → null.
  - A non-object → null.
  - A food list containing `'Feeling ill'` drops it, because it is not food.
- [ ] **Step 2: Run `npx vitest run utils/check-in/patch.test.ts`.** Expected: FAIL.
- [ ] **Step 3: Implement `validatePatch`, then the two actions.**
  - Use a transaction: `select ... for update` the day's row, merge in TypeScript with the same subset-replace rule, then upsert.
  - Reject a malformed `day` exactly the way `saveDayLog` does.
  - Call `revalidatePath('/today')` and `revalidatePath('/insights')`.
- [ ] **Step 4: Export the merge as pure `mergeTriggers(existing: string[], subset: readonly string[], chosen: string[]): string[]`.** Test it: existing `['Spicy food','Period']`, subset FOOD, chosen `['Coffee']` → `['Coffee','Period']` in `TRIGGERS` order. Run tests. Expected: PASS.
- [ ] **Step 5: Commit.** Message: `feat(check-in): partial day save and check-in status actions`.

### Task 4: Step model, day defaults, auto-start and resume

**Files:**
- Create: `utils/check-in/steps.ts`, `utils/check-in/progress.ts`
- Test: `utils/check-in/steps.test.ts`, `utils/check-in/progress.test.ts`

**Interfaces:**
- Produces:
  - `type Step = { kind: 'sore'; soreId: string } | { kind: 'new-sore-ask' } | { kind: 'sleep' } | { kind: 'food' } | { kind: 'health' } | { kind: 'treatments' } | { kind: 'finish' }`
  - `stepKey(s: Step): string` gives `sore:<id>` or the kind.
  - `buildSteps(sores: Sore[]): Step[]`:
    - Active sores (`healed_at === null`) come first, oldest `created_at` first.
    - Then `new-sore-ask`, then sleep, food, health, treatments, finish.
    - New sores added during the flow are inserted by the screen as `sore` steps right after `new-sore-ask` (see Task 6), and `new-sore-ask` is repeated after each one.
  - `defaultDay(kind: 'sleep' | 'food' | 'health' | 'treatments', now: Date, manual: boolean): 'today' | 'yesterday'`. Sleep and treatments → today. Food and health → yesterday. When `manual && now.getHours() >= 12`, every kind → today.
  - `shouldAutoStart(checkIns: CheckIn[], today: string): boolean` is true unless `today` has a row.
  - `readProgress(today: string): string | null` returns the stored `stepKey`, or null when the stored day ≠ today or storage throws.
  - `writeProgress(today: string, key: string): void` and `clearProgress(): void` use the localStorage key `canker-core:check-in` with value `{day, step}`.

- [ ] **Step 1: Write failing tests.**
  - `buildSteps` with sores A (created 11-01) and B (10-30, healed) → `[sore:A, new-sore-ask, sleep, food, health, treatments, finish]`.
  - With no active sores, the first step is `new-sore-ask`.
  - `defaultDay('food', 08:00, false)` → `'yesterday'`.
  - `defaultDay('food', 15:00, true)` → `'today'`.
  - `defaultDay('sleep', 08:00, false)` → `'today'`.
  - `shouldAutoStart([{day:'2026-11-06',status:'skipped'}], '2026-11-06')` → false.
  - `shouldAutoStart([{day:'2026-11-05',status:'done'}], '2026-11-06')` → true.
  - Progress written for `'2026-11-05'` reads back as null for `'2026-11-06'`.
  - A throwing `localStorage` (stub `getItem` to throw) yields null, not an exception.
- [ ] **Step 2: Run `npx vitest run utils/check-in`.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run `npx vitest run utils/check-in`.** Expected: PASS.
- [ ] **Step 5: Commit.** Message: `feat(check-in): step order, day defaults, auto-start and resume`.

### Task 5: Check-in shell and sore steps

**Files:**
- Create: `components/check-in/CheckInFlow.tsx` (overlay, step index, persistence, Skip), `components/check-in/SoreStep.tsx`, `components/check-in/NewSoreAsk.tsx`, `components/check-in/PlaceSore.tsx`
- Test: `components/check-in/CheckInFlow.test.tsx`. Use `@testing-library/react` if it is already a dev dependency. If not, test the pure `nextStepAfter(steps: Step[], current: string, event: 'next' | 'added-sore', newSoreId?: string): { steps: Step[]; current: string }` reducer in `utils/check-in/steps.ts` instead, and add it to Task 4's interfaces.

**Interfaces:**
- Consumes: everything in Task 4; `saveDayPatch` and `setCheckInStatus` (Task 3); `upsertSores` and `setSoreHealed`; `ReadingFields`, `MouthMap`, `withReading`, `newReading` and `hasReadingOn`; `SoreContext` if `ReadingFields` needs it.
- Produces: `<CheckInFlow sores={Sore[]} manual={boolean} onClose={(result: 'done' | 'skipped' | 'left') => void} />`. It renders full screen (`fixed inset-0`, `h-dvh`, safe-area padding) with `role="dialog"`, `aria-modal` and focus moved to the step heading on each step.

- [ ] **Step 1: Write the failing reducer test.**
  - After `added-sore` with id `N` at `new-sore-ask`, the next steps are `[sore:N, new-sore-ask, ...]` and current is `sore:N`.
  - `next` from `sore:N` lands on the second `new-sore-ask`.
  - Run `npx vitest run utils/check-in/steps.test.ts`. Expected: FAIL. Implement. Run it again. Expected: PASS.
- [ ] **Step 2: Build `SoreStep`.**
  - Show the sore's sigil, zone, day number and `ReadingFields` (pain, size), prefilled from today's reading if there is one, otherwise from the latest reading.
  - Add an optional note textarea.
  - `Next` saves via `upsertSores` with `withReading(sore, …)` (so it is one reading per day) and advances.
  - `Healed` saves the entered reading if the user changed anything, then calls `setSoreHealed`, then advances.
  - `Not now` advances without saving.
  - Leave a `photoSlot` prop (ReactNode) for Task 10.
- [ ] **Step 3: Build `NewSoreAsk` and `PlaceSore`.** The prompt is `Any new sores?` with `Yes` and `No`. `Yes` opens `MouthMap` in placement mode, reusing Today's add-sore path in `today-screen.tsx`. Placing saves the new sore with an initial reading of `DEFAULT_SIZE`/`DEFAULT_PAIN` and dispatches `added-sore`.
- [ ] **Step 4: Build `CheckInFlow`.**
  - On mount, resume from `readProgress(today)` when that key is in `steps`.
  - `writeProgress` on every step change.
  - `Skip for today` calls `setCheckInStatus(today,'skipped')`, `clearProgress()` and `onClose('skipped')`.
  - Reaching `finish` calls `setCheckInStatus(today,'done')` and `clearProgress()`.
  - A close (✕) keeps progress and calls `onClose('left')`.
  - Every failed action shows the existing toast and stays on the step.
- [ ] **Step 5: Run `npm test && npx tsc --noEmit && npm run lint`.** Expected: PASS. Then commit: `feat(check-in): flow shell with per-sore and new-sore steps`.

### Task 6: Habit screens and finish

**Files:**
- Create: `components/check-in/DayToggle.tsx`, `SleepStep.tsx`, `TagStep.tsx` (shared by food, health and treatments), `FinishStep.tsx`
- Modify: `components/check-in/CheckInFlow.tsx` (render them)
- Test: `utils/check-in/steps.test.ts` (add the `resolveDay` test)

**Interfaces:**
- Consumes: `defaultDay` (Task 4), `saveDayPatch` (Task 3), `FOOD_TRIGGERS`/`HEALTH_TRIGGERS`/`TREATMENTS`, `getDayLogs` data (passed as a `dayLogs: DayLog[]` prop added to `CheckInFlow`), `StreakBlock`, `triggerFreeStreak`, `Kanko`.
- Produces: `resolveDay(choice: 'today' | 'yesterday', now: Date): string` in `steps.ts`.

- [ ] **Step 1: Write and run the failing test.** `resolveDay('yesterday', new Date(2026,2,8,8))` → `'2026-03-07'` (across DST). Then implement it with `addDays` and `dayKey`, and run until it passes.
- [ ] **Step 2: Build `DayToggle`.** A segmented `Today` / `Yesterday` control. Its initial value comes from `defaultDay`. Switching it reloads that day's existing values from `dayLogs` so the screen prefills.
- [ ] **Step 3: Build `SleepStep`.**
  - Hours stepper, 0–14 in 0.5 steps, tabular numerals, start empty.
  - Quality: 1–5 buttons.
  - `Next` saves `sleep` with source `manual`, unless Task 11 filled it.
  - Leave an `importSlot` prop for Task 11.
- [ ] **Step 4: Build `TagStep`** as a chip grid over the given list, plus a `None today` chip that is exclusive with the others. With nothing selected, `Next` advances without saving (not answered). With chips or `None today`, it saves.
  - Food → `{food}`.
  - Health also shows a stress 1–5 row → `{health:{triggers, stress}}`.
  - Treatments → `{treatments}`. Treatments has no "answered" flag, so `None today` only clears.
  - Chips are single-line and wrap as a grid.
- [ ] **Step 5: Build `FinishStep`.** The heading is `All logged`, with the `proud` mood of `Kanko` and `StreakBlock` computed from the updated logs. `Done` closes the flow with `'done'`.
- [ ] **Step 6: Check by hand.** Run `PORT=3100 npm run dev` and do the whole flow at 375px wide in light and dark. Check there is no horizontal scroll, tap targets are 44px, and the readings and day log appear on Today afterwards. Then run `npm test`. Expected: PASS. Commit: `feat(check-in): sleep, food, health, treatments and finish screens`.

### Task 7: Today wiring — auto-start, header button, deep link

**Files:**
- Modify: `app/(app)/today/page.tsx` (fetch `getRecentCheckIns`), `app/(app)/today/today-screen.tsx` (header button, overlay mount)

**Interfaces:**
- Consumes: `getRecentCheckIns` (Task 1), `shouldAutoStart` and `readProgress` (Task 4), `CheckInFlow` (Tasks 5–6).

- [ ] **Step 1: Pass `checkIns` to `TodayScreen`.** After mount, compute `today = dayKey(new Date())`. Open the flow when `useSearchParams().get('checkin') === '1'` (manual), or when `shouldAutoStart(checkIns, today)` holds and the flow hasn't been closed with `'left'` in this page session (keep that in a `useRef`).
  - A `'left'` close reopens on the next app open. "Open" means the next full load or the next `App` `resume` event from `@capacitor/app` on native. Not on route changes.
  - Remove `checkin` from the URL with `router.replace('/today')` after opening.
- [ ] **Step 2: Add the header button.**
  - It reads `Check in` with `size="touch"`, or `Done ✓, edit` once today's status is `done`.
  - It opens the flow with `manual`.
  - On close with `done`, update the local `checkIns` so the label changes without a reload.
- [ ] **Step 3: Check by hand.**
  - A fresh day auto-opens. `Skip for today` and then a reload doesn't reopen.
  - Leaving at the food step and reloading resumes at food.
  - `/today?checkin=1` opens even when done.
  - Signed in on two browsers: finishing in one stops auto-start in the other on its next load.
- [ ] **Step 4: Run `npm test && npx tsc --noEmit && npm run lint`.** Then commit: `feat(check-in): auto-start on Today and a manual check-in button`.

### Task 8: Morning and evening reminders

**Files:**
- Modify: `utils/reminders.ts`, `app/(app)/profile/notifications/reminder-form.tsx`, `app/(app)/profile/notifications/page.tsx`, `components/native/NativeBridge.tsx` (call the new sync)
- Modify: `components/check-in/CheckInFlow.tsx` (call `deferEveningReminder` on done)
- Test: `utils/reminders.test.ts` (new)

**Interfaces:**
- Produces:
  - `type ReminderSlot = 'morning' | 'evening'`
  - `readReminder(slot): ReminderPref`, `applyReminder(slot, pref): Promise<boolean>`, `syncReminders(): Promise<void>`
  - `deferEveningReminder(): Promise<void>` cancels today's evening notification and schedules it again starting tomorrow.
  - Storage keys: the existing `canker-core:reminder` stays the evening one, so existing users keep their setting. Morning uses `canker-core:reminder-morning`.
  - Notification ids: evening `1` (unchanged), morning `2`.
  - Defaults: evening `{enabled:false,time:'20:00'}`, morning `{enabled:false,time:'08:00'}`.

- [ ] **Step 1: Write failing tests with `@capacitor/local-notifications` mocked through `vi.mock`, and `isNative` mocked to true.**
  - `applyReminder('morning',{enabled:true,time:'08:00'})` schedules id 2 with the exact morning copy and `extra.path === '/today?checkin=1'`.
  - Evening uses id 1, the evening copy and the same path.
  - `readReminder('evening')` reads an existing `canker-core:reminder` value.
  - `deferEveningReminder()` with evening enabled at `20:00` cancels id 1 and schedules id 1 with `schedule.at` set to tomorrow 20:00 local. After it fires once, `syncReminders()` on the next launch puts the repeating schedule back. With evening disabled it does nothing.
- [ ] **Step 2: Run `npx vitest run utils/reminders.test.ts`.** Expected: FAIL.
- [ ] **Step 3: Implement.** Keep `remindersSupported()` and the permission fallback. `syncReminders()` re-applies both slots. Replace the `syncReminder` caller in `NativeBridge`.
- [ ] **Step 4: Change the settings page.** It shows two rows, `Morning check-in` and `Evening nudge`, each with a switch and a time. On the web it keeps the existing "only in the app" notice.
- [ ] **Step 5: Run the tests.** Expected: PASS. Then commit: `feat(reminders): morning check-in reminder; evening skips once checked in`.

### Task 9: Phase 1 release check

- [ ] **Step 1: Run `npm test && npx tsc --noEmit && npm run lint && npm run build`.** Expected: all pass.
- [ ] **Step 2: Apply the migration to production.** Take a `pg_dump` first (`AGENTS.md`), then run the migration against container `zp1hiabzhkgj4kwo2r9qa0qi`.
- [ ] **Step 3: Deploy following `docs/DEPLOYMENT.md`.** This uses the owner's standing deploy procedure. Then open the current native app on iOS and check the check-in appears with no photo or import controls.

### Task 10: Device-only sore photos (phase 2)

**Files:**
- Modify: `package.json` (add `@capacitor/camera`, `@capacitor/filesystem` at Capacitor 7 versions), `ios/App/App/Info.plist` (`NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`), `android/app/src/main/AndroidManifest.xml` if the plugin docs require it
- Create: `utils/sore-photos.ts`, `components/check-in/PhotoControl.tsx`
- Modify: `components/check-in/SoreStep.tsx` (`photoSlot`), the sore history view in `components/SoreDetails.tsx`, the sore delete path (delete its photos), `docs/MOBILE.md` (plugins list), the privacy page (`app/(marketing)/privacy/page.tsx`: photos stay on the device)
- Test: `utils/sore-photos.test.ts`

**Interfaces:**
- Produces:
  - `photosSupported(): boolean` is `Capacitor.isPluginAvailable('Camera') && Capacitor.isPluginAvailable('Filesystem')`.
  - `takePhoto(readingId: string): Promise<string | null>` saves to `Directory.Data` at `sore-photos/<readingId>.jpg` and returns a displayable URI via `Capacitor.convertFileSrc`.
  - `photoFor(readingId: string): Promise<string | null>`
  - `deletePhotosFor(readingIds: string[]): Promise<void>`

- [ ] **Step 1: Write failing tests with both plugins mocked.**
  - `photosSupported()` is false when `isPluginAvailable('Camera')` is false (the current app version).
  - `takePhoto` writes to path `sore-photos/r1.jpg` in `Directory.Data`.
  - A cancelled camera returns null without throwing.
  - `deletePhotosFor(['r1','r2'])` deletes both and ignores not-found errors.
- [ ] **Step 2: Run `npx vitest run utils/sore-photos.test.ts`.** Expected: FAIL. Then implement and run until it passes.
- [ ] **Step 3: Wire it up.**
  - `PhotoControl` renders nothing unless `photosSupported()`.
  - In `SoreStep`, add it with the reading id of today's reading.
  - Show thumbnails in sore history when `photoFor` returns one.
  - Call `deletePhotosFor` when a sore is deleted.
  - Confirm `utils/csv.ts` export and the data export route never read photos.
- [ ] **Step 4: Run `npx cap sync`, build the iOS app (see the iOS build gotchas memory: iOS 15 target and SceneDelegate patches) and test on a device.** Take a photo, kill the app, reopen it, and check the photo is still in history. Airplane mode makes no difference. Then commit: `feat(native): device-only photos on sore check-ins`.

### Task 11: Health sleep import (phase 2)

> **Deferred** to a Capacitor 8 follow-up project by owner decision on
> 2026-11-06. No Capacitor 7 plugin reads sleep on both HealthKit and Health
> Connect; `@capgo/capacitor-health` 8.2+ and `@capacitor/health-fitness` need
> Capacitor 8. No code was written for this task; the steps below are kept as
> the plan for that project.
>
> Plugin research (npm registry and unpacked tarballs, 2026-11-06; project on
> `@capacitor/core` ^7.6.9):
>
> | Package | Cap-7-compatible version | Peer dep | Sleep support in that version |
> |---|---|---|---|
> | `@capgo/capacitor-health` | 7.2.15 (last 7.x) | core >=7.0.0 | None (no `sleep` in definitions, iOS or Android source). Sleep (`HealthDataType 'sleep'`, `SleepState inBed/asleep/awake/rem/deep/light`, stage segments) first appears between 8.2.0 and 8.2.10; every 8.x needs core >=8.0.0 (latest 8.11.14). |
> | `@capacitor/health-fitness` (official, Ionic) | none | core >=8.0.0 for every version incl. 1.0.x | n/a |
> | `capacitor-health` (mley) | 7.1.0 | core >=7.0.0 | None (also none in 8.4.0) |
> | `@flomentumsolutions/capacitor-health-extended` | 0.1.0 (only 7.x-compatible release) | core >=7.0.0 | None on either platform; it only reuses `READ_SLEEP` as the mindfulness permission. 0.3.1+ needs core >=8, latest needs >=9 beta. |
> | `@kiwi-health/capacitor-health-connect` 0.0.43 | yes | core ^7.0.0 | Android only: `SleepSession` record with `stages`. No iOS. |
> | `@devmaxime/capacitor-health-connect` 1.1.0 | yes | core >=7.0.0 | Android only (not inspected further). |
> | `@perfood/capacitor-healthkit` 1.3.2 | no | core ^4.0.0 (last publish 2025-02; 2.0.0-alpha.2 from 2023) | iOS only: `sleepAnalysis` with `sleepState`. Peer conflict with core 7; Capacitor-4-era native code. |
> | `capacitor-healthkit` 0.2.1 | - | - | iOS only, last published 2022. |
> | `sahha-capacitor` | - | - | Commercial SDK (paid backend), not a fit for first-party-only analytics. |
> | `@capawesome-team/capacitor-health` | - | - | Sponsorware, not on public npm. |
>
> Options considered: (1) upgrade to Capacitor 8 and use `@capgo/capacitor-health`
> 8.11.x (sleep with stages on both platforms) or `@capacitor/health-fitness`
> 1.0.x, a separate upgrade touching every `@capacitor/*` plugin and the native
> patches; (2) two plugins, kiwi-health for Android plus the unmaintained,
> core-^4 `@perfood/capacitor-healthkit` for iOS; (3) a thin local plugin
> (Swift `HKSampleQuery` on `sleepAnalysis`, Kotlin `SleepSessionRecord`); (4)
> Android-only with kiwi-health for now. Option 1 was chosen, as its own project.

**Files:**
- Modify: `package.json` (a Health plugin supporting Capacitor 7, HealthKit sleep analysis and Health Connect sleep sessions; verify a maintained one such as `@capgo/capacitor-health`, or write a thin local plugin if none reads sleep on both), the iOS HealthKit entitlement and `NSHealthShareUsageDescription`, the Android Health Connect permission `android.permission.health.READ_SLEEP` plus the privacy-policy activity alias the Health Connect docs require, `docs/MOBILE.md`, the privacy page (sleep is read only on request and stored as hours with its source)
- Create: `utils/health-sleep.ts`, `components/check-in/SleepImport.tsx`
- Modify: `components/check-in/SleepStep.tsx` (`importSlot`)
- Test: `utils/health-sleep.test.ts`

**Interfaces:**
- Produces:
  - `sleepImportSupported(): boolean` uses `Capacitor.isPluginAvailable('<PluginName>')`.
  - `importLastNight(now: Date): Promise<{ hours: number; source: 'apple_health' | 'health_connect' } | null>` requests read-sleep permission on first call and sums asleep segments (excluding in-bed/awake) that end between 18:00 the previous day and `now`. It rounds to 0.25h and returns null on refusal or no data.
  - `sumAsleepHours(segments: { start: Date; end: Date; stage: string }[], windowStart: Date, windowEnd: Date): number` is pure.

- [ ] **Step 1: Write failing tests for `sumAsleepHours`.**
  - Overlapping segments are not double-counted.
  - `awake`/`inBed` stages are excluded.
  - A segment crossing `windowStart` is clipped.
  - 7h40m rounds to 7.75.
  - `importLastNight` returns null when the mocked permission is denied.
  - `sleepImportSupported()` is false when the plugin isn't available.
- [ ] **Step 2: Run `npx vitest run utils/health-sleep.test.ts`.** Expected: FAIL. Then implement and run until it passes.
- [ ] **Step 3: Build `SleepImport`.** Show `Import from Health` only when `sleepImportSupported()`. Fill the hours and set the source that `SleepStep` saves. The user can still edit the hours, which resets the source to `manual`. No data or a refusal shows a quiet inline line ("No sleep found for last night") with no error toast.
- [ ] **Step 4: Run `npx cap sync` and test on an iOS device with Health sleep data, and on an Android device or emulator with Health Connect.** Then commit: `feat(native): import last night's sleep from Health`.
- [ ] **Step 5: Prepare the store submissions.** Write the App Store review notes and the Play Console health-permission declaration text into `docs/MOBILE.md`. Submission itself is the owner's action.
