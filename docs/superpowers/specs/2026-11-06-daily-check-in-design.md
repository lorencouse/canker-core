# Daily check-in — design

Date: 2026-11-06. Status: draft for owner review.

## Intent

Logging today is scattered: Today shows a mouth map, sore cards and a day-log
form, and users have to work out on their own what to update. The owner wants
logging to become a guided routine. A morning notification brings the user in.
The first time they open the app each day, a full-screen check-in walks them
through every active sore, one at a time, then any new sores, then food, sleep,
sickness and treatments. It ends on a short celebration. The data gets more
complete and more consistent, and complete data is what makes trigger insights
worth anything.

## Goals

- A **morning reminder** (native only) that sits alongside the existing evening
  reminder. The user can turn on either one or both.
- On **any open, web or native**, the check-in takes over the screen until
  today's check-in is finished or skipped.
- If the user leaves partway, the check-in **resumes where they left off** on
  the next open that day.
- **One active sore per screen**: pain, size, an optional note, an optional
  photo, and a "Healed" button. Moving on saves that sore's reading for today.
- After the existing sores, it asks **"Any new sores?"** "Yes" opens the mouth
  map to place the sore, then shows that sore's own step, then asks again.
  With no active sores, the check-in opens on this question.
- **Habit screens**, one short tap-only screen each: **Sleep** (hours and 1–5
  quality), **Food** (trigger foods), **Health & mood** (feeling ill, stress,
  period, bit cheek or lip, dental work, SLS toothpaste) and **Treatments**.
- Each habit screen has a **Today / Yesterday toggle**, because most of a
  morning check-in is about yesterday.
- **Sleep can be imported** from Apple Health (iOS) and Health Connect
  (Android) and prefills the Sleep screen. This ships in the **same release**.
- A **"Check in" button in the Today header** starts the check-in by hand. Once
  today's check-in is done it reads "Done ✓, edit" and reopens the check-in to
  amend it.
- The check-in ends on an **"All logged" screen** with Kanko and the streak,
  then lands on Today.

## Non-goals

- Uploading photos. Photos stay on the device and are never sent to the
  server.
- Server push notifications. Both reminders stay local, scheduled on the
  device.
- Removing Today's existing ways to edit sores and the day log. The check-in is
  the guided path, not the only one.
- Free-text food logging. Food stays a fixed checklist, because the counts
  only mean something when the values are fixed (see `utils/day-log.ts`).

## Anti-goals (failure even if it "works")

- Trapping the user. Skipping for the day must take one obvious tap, and a
  skipped check-in does not auto-start again that day.
- Starting the check-in again after it is done, or on every navigation within
  one session.
- Losing input. Each step saves as the user moves past it, so a closed app or
  dropped connection costs at most the screen they were on.
- Photos leaking off the device by any path: export, sync, analytics or logs.
- Third-party analytics or SDKs beyond what Health access needs. The project
  is first-party only by owner decision.

## Constraints from the project

- Next.js App Router with server actions, raw `pg` and `schema.sql` as the
  re-runnable source of truth. Data changes go in a dated file in
  `migrations/`, with a `pg_dump` taken first (see `AGENTS.md`).
- The native apps wrap the deployed site through Capacitor 7. Native-only
  features check `isNative()` (`utils/native.ts`) and degrade quietly on the
  web.
- One reading per sore per local day (`utils/readings.ts`, enforced again in
  `utils/sore-payload.ts`). A check-in step for a sore that already has a
  reading today opens prefilled and updates that reading.
- The UI rules in `AGENTS.md` and the layout conventions in `docs/MOBILE.md`
  apply: `dvh`, safe-area variables, 44px tap targets, one-line buttons, no
  em-dashes in copy, sentence-case labels, red only for the severity ramp.
- Brand and voice follow the Momentum direction and Kanko
  (`docs/superpowers/specs/2026-11-05-brand-overhaul-design.md`).
- Reuse what exists: `MouthMap` to place sores, `ReadingFields` for pain and
  size, `setSoreHealed`, `upsertSores` and `saveDayLog` in
  `utils/actions/soreActions.ts`, the reminder machinery in
  `utils/reminders.ts`, and `StreakBlock` and `utils/momentum.ts` for the
  finish screen.

## Decided by the owner

| Topic | Decision |
|---|---|
| Reminder | New morning reminder alongside the existing evening one. Each can be on or off. |
| Auto-start | Full screen. If closed partway, resumes at the same step on the next open that day. Skippable. |
| When it auto-starts | On any open, at any time of day, until today's check-in is finished or skipped. Web and native alike. |
| Sore step | Pain and size, Healed button, optional note, optional photo. |
| New sores | Asked after the existing sores. Yes means map, then its step, then ask again. |
| Photos | Device only, never uploaded. |
| Habit screens | Sleep, Food, Health & mood, Treatments. |
| Which day habits save to | Toggle on each screen. |
| Sleep import | Apple Health and Health Connect, in this release. |
| Manual start | Button in the Today header. |
| Finish | "All logged" screen with Kanko and the streak, then Today. |
| Rollout | Two phases. Phase 1 deploys the check-in to the web, which the current app versions pick up immediately, with photos and Health import hidden. Phase 2 is a new app version, and once it is installed those controls appear on their own. Each control checks that its plugin is actually present, not just `isNative()`. |
| Evening reminder | Finishing the check-in cancels that day's evening reminder. If the check-in isn't done, the evening reminder fires and opens the check-in. |
| Empty Food / Health answers | A "None today" chip has to be tapped to record a clean day. Continuing with nothing selected counts as *not answered*. It doesn't count toward the trigger-free streak and doesn't make the day look clean. |

## Calls made by the designer (owner can overturn)

These were not asked about. They are my calls.

1. **Morning reminder is off by default at 08:00**, the same as the evening
   reminder's opt-in. It is a second, independently scheduled local
   notification with its own id. Tapping it deep-links to Today and starts the
   check-in.
2. **Default day per habit screen.** Sleep defaults to *today*: the night that
   ended this morning belongs to the day you woke. Food and Health & mood
   default to *yesterday*. Treatments default to *today*. On the manual
   button, after midday, everything defaults to today.
3. **"Done" and "skipped" are stored on the server** per user per local day,
   so finishing on the phone stops the laptop from auto-starting too. The
   resume position (which step) is per device in `localStorage`, since it only
   matters on the device where the check-in was left.
4. **"Finished" means reaching the "All logged" screen.** Leaving midway is
   neither done nor skipped, so the check-in resumes.
5. **Habit data model.** `day_logs` gains `sleep_hours` (numeric, nullable),
   `sleep_quality` (1–5, nullable), `sleep_source`
   (`manual` | `apple_health` | `health_connect`, nullable) and `stress`
   (1–5, nullable). Food and Health & mood keep writing to the existing
   `triggers` array, with the screens splitting today's `TRIGGERS` list
   between them. A `stress` of 4 or higher counts as the "Stress" trigger in
   insights, so older tag data stays comparable.
6. **Photos are native only.** They are saved with the Capacitor
   Filesystem/Camera plugins in the app's private storage, keyed by reading id,
   and shown in that sore's history on the same device. On the web the photo
   control is hidden. Deleting a sore or the account deletes its photos on that
   device.
7. **Health import is read-only.** It asks only for sleep permission, the first
   time the user taps "Import from Health" on the Sleep screen, never up
   front. It takes total time asleep from the night ending this morning and
   prefills hours (`sleep_source` set to the provider). Quality stays manual.
   If permission is refused or there is no data, the screen stays manual with
   no error.
8. **Skip** is a text button on every screen ("Skip for today"). On a single
   step, a "Not now" just advances to the next step without saving that step.
9. **Sore order** is oldest first, the same as the user's list.
10. **Answered flags.** `day_logs` gains `food_answered` and
    `health_answered` (boolean, default false). They are set when the user
    picks at least one item or taps "None today" on that screen.
    `triggerFreeStreak` counts a day only when both are true and `triggers`
    is empty. Days logged before this change keep the current rule (row exists
    and `triggers` is empty), so existing streaks don't reset.
11. **Stress and poor sleep are derived when read, not written as tags.**
    The Health & mood screen replaces the Stress checkbox with the 1–5 scale.
    Insights and the streak treat `stress >= 4` as "Stress" and
    `sleep_quality <= 2` or `sleep_hours < 6` as "Poor sleep", alongside any
    legacy tags. Old data needs no migration. Today's `DayLogForm` uses the
    same shared mapping, so the two editing paths agree.
12. **Partial saves.** Check-in steps update only their own `day_logs`
    columns, so a new partial-update action sits beside `saveDayLog`, which
    rewrites the whole row. A row that ends up with no data at all is still
    deleted.
13. **Reminder wording and links.** Morning: "Morning check-in", "How are
    your sores today? About a minute." Evening, when the check-in isn't done:
    "Still time to check in", "Log today in about a minute." Both open
    `/today?checkin=1`. Finishing the check-in cancels and reschedules the
    evening notification for the next day.
14. **"Today"** is the user's local day, from the existing time-zone cookie,
    the same as readings.

## Left to the builder

- The choice of Health plugin (a maintained Capacitor 7 plugin that covers both
  HealthKit sleep analysis and Health Connect sleep sessions, or a thin custom
  plugin). Native permission strings, the HealthKit entitlement, the Health
  Connect manifest declarations, and the privacy page and store-listing
  wording for health data.
- Whether the check-in is a route (e.g. `/today/check-in`) or an overlay on
  Today, and the transitions between steps (respecting reduced motion).
- The exact split of `TRIGGERS` between Food and Health & mood, and whether any
  new values are needed to cover "sickness" beyond "Feeling ill".
- How the auto-start check reaches the client (likely the Today server
  component passes today's check-in state).
- Tests: at least the day-default logic, the auto-start decision, the resume
  position and the `day_logs` round-trip of the new fields.

## Open risks

- **App store review.** HealthKit needs a usage description and review notes.
  Health Connect needs Play Console health-permission declarations, which can
  take days. Phase 2 waits on both approvals, but phase 1 doesn't.
- **Native release.** Camera, Filesystem and Health plugins add native code,
  so a new app binary is required. The web deploy alone is not enough for
  photos or Health import (see `docs/MOBILE.md`, `docs/DEPLOYMENT.md`).
