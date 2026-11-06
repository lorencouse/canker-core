# Brand Overhaul (Momentum + Kanko) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the teal/square "Chalk" look with the Momentum system (indigo, sunflower wins, rounded pressable controls, Bricolage Grotesque + Nunito) and bring in Kanko the hamster on Today, welcome, sign-in, empty states, the logo and the app icons.

**Architecture:** The palette lives in the HSL custom properties in `styles/main.css`, so most of the reskin is a token swap that every component inherits. New behaviour is small and pure: a `utils/momentum.ts` module computes the trigger-free streak, the week dots and today's mood from data Today already loads, and a `StreakBlock` component renders it above the unchanged check-in. Kanko is a set of static WebP files behind one `<Kanko mood>` component.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind 3.4, shadcn/ui, vitest (node env, `.test.ts` only), `next/font/google`, sharp (icon generation), Capacitor 7.

**Spec:** `docs/superpowers/specs/2026-11-05-brand-overhaul-design.md`. Reference screens: `docs/superpowers/specs/assets/2026-11-05-kanko/mockups.html` (open in a browser; its `.btn3d`, `.streak`, `.day` rules are the reference values).

## Global Constraints

- Red is data: the `--sev-*` ramp and `--mm-*` tissue tokens are not changed, and no new red appears anywhere, including the logo (the old mark's red dot goes).
- Palette (light): indigo `#4B4BF0`, indigo deep `#2F2FB8`, sunflower `#FFD23F`, sunflower deep `#D9A800`, ink `#16163F`, ink soft `#4A4A78`, ground `#F1F1FD`, line `#E2E3FA`, lavender `#B9A7F2`, card `#FFFFFF`. Dark ground is the ink family (`#0f1033` as on the evening mockup), cards one step lighter, indigo lifted for contrast, sunflower unchanged.
- Sunflower is a fill or a figure on indigo/ink, never small text on white.
- Type: Bricolage Grotesque 600/800 for display, Nunito 500–800 for body and button labels (800). Sentence case everywhere; the uppercase tracked label style goes.
- Radius: cards 16–20px, buttons 16px, chips and day dots fully round. Pressable edge `0 5px 0 <deep colour>`; pressed moves down and shrinks the edge. No soft shadows except dialogs, menus, tooltips.
- AGENTS.md UI rules hold: one-line buttons (`button.test.ts` stays green), 44px tap targets, 16px inputs, no horizontal scroll 320–430px, tabular numerals for figures, no em-dashes in UI copy, `dvh`, `--safe-*`, `size="touch"` on primary controls.
- Kanko never appears on blog or article pages (`app/(marketing)/blog/**`), and bad-day states carry no health advice, no exclamation marks, no confetti.
- Copy is fixed by the spec: proud headline `<N> days strong.` + `Your mouth is thanking you.`; bad day `Rough one today.` + `Logged. That's the hard part done.`
- Any new image generation goes through `tools/style-lab.mjs` (batch is its default) and needs Loren's go for that batch. Do not draw anything without it.
- No new third-party scripts; fonts only through `next/font`.
- Product-facing work: it ships through the no-mistakes pipeline.

## Review Focus

1. **Today not logged yet**: at 9am, before today's check-in, yesterday's streak must still show, not drop to zero. (Task 3 test `keeps yesterday's streak before today is logged`.)
2. **Dragging a pain slider to 8 without saving** must not flip Today into the bad-day state; only a save does. (Task 4 step: mood comes from `savedSores`.)
3. **A long streak** (120 days) on a 320px phone: the figure fits on one line and the headline doesn't overflow. (Task 3 test for digits past ten; Task 4 manual 320px check.)
4. **Dark mode contrast** of every text pair after the swap, which nobody looks at until Loren's review. (Task 1 contrast test covers both themes.)
5. **A brand-new user** with no logs and no sores sees neutral Kanko and the existing first-sore invitation, not a "0 days strong" card. (Task 3 test `zero streak is neutral`; Task 4 renders no streak card at zero.)

---

### Task 1: Tokens, fonts and the contrast guard

**Files:**

- Create: `utils/contrast.ts`, `utils/contrast.test.ts`
- Modify: `styles/main.css` (`:root` and `.dark` blocks, `.label`, `.mouth-map-label`, surface comments), `tailwind.config.js` (`fontFamily` comments, `colors`, `borderRadius`, `boxShadow`), `app/layout.tsx` (fonts, `viewport.themeColor`), `app/manifest.ts` (`background_color`, `theme_color`)

**Interfaces:**

- Produces: CSS custom properties `--win`, `--win-edge`, `--primary-edge`, `--comfort` (HSL triplets, both themes); Tailwind colours `win`, `win-edge`, `primary-edge`, `comfort`; Tailwind shadows `press` (`0 5px 0 hsl(var(--primary-edge))`), `press-win` (`0 5px 0 hsl(var(--win-edge))`), `press-line` (`0 4px 0 hsl(var(--border))`); radius tokens `worksheet: 1.25rem`, `cell: 0.75rem`, `--radius: 1rem`.
- Produces: `contrastRatio(a: string, b: string): number` taking two HSL triplet strings as written in main.css (`"240 84% 62%"`), and `readTokens(css: string, scope: ':root' | '.dark'): Record<string, string>`.

- [ ] **Step 1: Write the failing test** `utils/contrast.test.ts`: reads `styles/main.css` with `fs`, and for each scope asserts `contrastRatio` ≥ 4.5 for `foreground/background`, `foreground/card`, `muted-foreground/background`, `muted-foreground/card`, `primary-foreground/primary`, `accent-foreground/accent`. Also asserts `--primary` in `:root` equals `240 84% 62%` (the `#4B4BF0` triplet) and `--sev-7` is unchanged (`0 73% 55%`).
- [ ] **Step 2: Run** `npx vitest run utils/contrast.test.ts`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement** `utils/contrast.ts` (WCAG relative luminance from HSL; `readTokens` is a regex over the scope's block).
- [ ] **Step 4: Swap the tokens** in both scopes to the Global Constraints palette (convert hex to HSL triplets; keep every `--sev-*`, `--mm-*`, `--chart-1..4` line byte-identical; `--chart-5` becomes indigo). Retire `--rule`/`--drop` usage notes that describe Chalk; keep `--control` at ≥3:1. `.label` becomes `font-family: var(--font-sans); font-weight: 700; font-size: 0.8125rem;` with no `text-transform` or tracking; `.mouth-map-label` drops uppercase and tracking.
- [ ] **Step 5: Swap fonts** in `app/layout.tsx` to `Bricolage_Grotesque` (weights 600, 800, `--font-display`) and `Nunito` (500–800, `--font-sans`); rewrite the comment block to say why (display face for words and figures, rounded body face). `themeColor` light `#F1F1FD`, dark `#0f1033`; manifest `background_color`/`theme_color` `#16163F`.
- [ ] **Step 6: Run** `npx vitest run`. Expected: all PASS. Adjust dark-mode triplets until the contrast test passes; do not lower thresholds.
- [ ] **Step 7: Numeral check (manual, blocking).** `PORT=3100 npm run dev`, open `/insights` and `/today` at 320px width. Confirm a three-digit `.tabular` figure at `text-figure` sits on one line and that digits align in a column (tabular figures active). If Bricolage fails either, set `.tabular` and `text-figure` to `font-sans` and note it in the commit message.
- [ ] **Step 8: Commit** `feat(ui): swap to the Momentum palette and Bricolage/Nunito type`.

### Task 2: Rounded, pressable buttons

**Files:**

- Modify: `components/ui/button.tsx`, `components/ui/button.test.ts`

**Interfaces:**

- Consumes: Task 1 shadows `press`, `press-line`, colours `primary-edge`.
- Produces: unchanged `Button`/`buttonVariants` API (same variant and size names).

- [ ] **Step 1: Add failing tests** to `button.test.ts`: every variant/size contains `rounded-2xl`, `active:translate-y-[3px]` and `active:shadow-none`, and none contains `uppercase`; `default` contains `shadow-press`; `outline`, `destructive` and `overlay` contain `shadow-press-line`. Existing tests stay as they are.
- [ ] **Step 2: Run** `npx vitest run components/ui/button.test.ts`. Expected: new tests FAIL.
- [ ] **Step 3: Rewrite the base and variant classes**: `font-sans font-extrabold` (no `font-display uppercase tracking`), `rounded-2xl`, `transition-[transform,box-shadow,background-color]`, pressed moves down and drops the edge; `default` = indigo fill + `shadow-press`; `outline`/`destructive`/`overlay` = card fill, 2px `border` line, `shadow-press-line`; `secondary`/`ghost`/`link` keep no edge. Keep `whitespace-nowrap max-w-full [&>span]:truncate` and every `tap-target`. Update the doc comment (no longer "square, condensed, uppercase").
- [ ] **Step 4: Run** `npx vitest run`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(ui): rounded pressable buttons`.

### Task 3: Streak, week and mood logic

**Files:**

- Create: `utils/momentum.ts`, `utils/momentum.test.ts`

**Interfaces:**

- Consumes: `DayLog`, `Sore` from `@/types`; `dayKey`, `isSameLocalDay` from `@/utils/readings`.
- Produces:

  - `BAD_DAY_PAIN = 6`
  - `triggerFreeStreak(logs: DayLog[], today: string): number` — consecutive local days, each with a `DayLog` whose `triggers` is empty. Counting starts at `today` if today has a log, otherwise at the day before (an unlogged today doesn't break it). A logged day with any trigger, or a missing day, ends it.
  - `isBadDay(sores: Sore[], now: Date): boolean` — a sore with `created_at` on today's local date, or any reading recorded today with `pain >= BAD_DAY_PAIN`.
  - `type Mood = 'proud' | 'gentle' | 'neutral'`
  - `todayMood(sores: Sore[], logs: DayLog[], now: Date): Mood` — `gentle` if `isBadDay`, else `proud` if the streak ≥ 1, else `neutral`.
  - `type WeekDot = { day: string; initial: string; won: boolean }`
  - `weekDots(logs: DayLog[], today: string): WeekDot[]` — the 7 local days ending today, oldest first; `won` = a log exists with no triggers; `initial` = first letter of the short weekday in the user's locale.
  - `streakHeadline(n: number): string` — `One day strong.` … `Ten days strong.` in words for 1–10, digits above (`12 days strong.`).

- [ ] **Step 1: Write failing tests** in `utils/momentum.test.ts` (fixed `now`, `today` strings, no real clock):
  - `counts consecutive trigger-free logged days`: logs for 11-03, 11-04, 11-05 all `triggers: []`, today `2026-11-05` → `3`.
  - `keeps yesterday's streak before today is logged`: logs 11-03, 11-04 empty-trigger, none for 11-05 → `2`.
  - `a trigger ends the streak`: 11-03 empty, 11-04 `['Citrus']`, 11-05 empty → `1`.
  - `a missing day ends the streak`: 11-02 and 11-05 only → `1`.
  - `zero streak is neutral`: no logs, no sores → `triggerFreeStreak` `0`, `todayMood` `'neutral'`.
  - `pain at the threshold is a bad day`: a reading today with pain 6 → `isBadDay` true; pain 5 → false; pain 9 recorded yesterday → false.
  - `a sore created today is a bad day` regardless of pain.
  - `bad day beats a streak`: 5-day streak plus a pain-7 reading today → `'gentle'`.
  - `week dots`: 7 entries ending today, oldest first, `won` matches the logs above.
  - `headline words then digits`: `streakHeadline(3)` → `Three days strong.`, `streakHeadline(1)` → `One day strong.`, `streakHeadline(120)` → `120 days strong.`
- [ ] **Step 2: Run** `npx vitest run utils/momentum.test.ts`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement** `utils/momentum.ts`. Walk days backwards from the start day using local `Date` arithmetic and `dayKey`, never by subtracting milliseconds across a DST change.
- [ ] **Step 4: Run** `npx vitest run`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(today): compute the trigger-free streak and today's mood`.

### Task 4: Kanko assets, `<Kanko>`, and the Today streak block

**Files:**

- Create: `tools/kanko-assets.mjs`, `public/images/kanko/*.webp` (generated), `components/kanko/Kanko.tsx`, `components/kanko/moods.ts`, `components/kanko/moods.test.ts`, `components/today/StreakBlock.tsx`
- Modify: `app/(app)/today/today-screen.tsx` (header and empty-state block), `styles/main.css` (`.kanko-fade`), `package.json` (`sharp` devDependency, `"art:kanko": "node tools/kanko-assets.mjs"`)

**Interfaces:**

- Consumes: Task 3 `todayMood`, `triggerFreeStreak`, `weekDots`, `streakHeadline`, `Mood`.
- Produces: `type KankoMood = 'proud' | 'hello' | 'curious' | 'gentle' | 'neutral'`; `KANKO: Record<KankoMood, { src: string; width: number; height: number }>` in `moods.ts`; `<Kanko mood: KankoMood; size: number; className?: string; priority?: boolean />` rendering a decorative `next/image` (`alt=""`, `aria-hidden`) with the `.kanko-fade` mask; `<StreakBlock sores logs now />`.

- [ ] **Step 1: Write the asset script** `tools/kanko-assets.mjs`: reads the masters in `docs/superpowers/specs/assets/2026-11-05-kanko/`, writes 640×640 WebP q85 to `public/images/kanko/kanko-{proud,hello,curious,gentle}.webp`, and `kanko-neutral.webp` cropped from the character sheet's front view (top-left quarter; tune the extract box by eye, keep the feet and ears). Run it with `npm run art:kanko`.
- [ ] **Step 2: Write failing test** `components/kanko/moods.test.ts`: every `KANKO` entry's `src` exists under `public/`, all five moods are present, and none of the files is over 120 KB.
- [ ] **Step 3: Run** `npx vitest run components/kanko/moods.test.ts`. Expected: FAIL.
- [ ] **Step 4: Implement** `moods.ts` and `Kanko.tsx`. `.kanko-fade` in main.css: the 8% four-edge linear mask from `mockups.html` (`.ph:not(.night) .hero`), with `-webkit-` prefix and `mask-composite: intersect`.
- [ ] **Step 5: Implement `StreakBlock`**: date line, `<Kanko>` (mood `proud`, `gentle`, or `neutral`), headline and line (proud: `streakHeadline(n)` / `Your mouth is thanking you.`; gentle: `Rough one today.` / `Logged. That's the hard part done.`; neutral: the existing `answerLine` headline and note, passed in as props), then, only when mood is `proud`, the indigo streak card (`n` in sunflower, `trigger-free days`) and the seven week dots (sunflower with `shadow-press-win` when won). The streak figure uses `.tabular` and `whitespace-nowrap`.
- [ ] **Step 6: Wire Today**: replace the `<header>` in `today-screen.tsx` with `<StreakBlock>`. Add `const [savedSores, setSavedSores] = useState(initialSores)` and `const [savedLogs, setSavedLogs] = useState(dayLogs)`; inside `save()`, after success, set `savedSores` to the current `sores` and `savedLogs` to `dayLogs` with today's entry replaced by (or appended with) the current `log`. `StreakBlock` receives `savedSores` and `savedLogs`, never the unsaved state. The check-in, cards, day log and Save bar below are untouched. In the `open.length === 0` block, add `<Kanko mood="curious" size={120} />` above the paragraph.
- [ ] **Step 7: Run** `npx vitest run && npm run lint`. Expected: PASS, no lint errors.
- [ ] **Step 8: Manual check** at 320px and 390px, light and dark, `/today` in three states: no logs (neutral, no streak card), a 3-day streak (proud card, dots), and after saving a pain-7 reading (gentle, no card). Drag a slider to 8 without saving: Kanko must not change. A 3-digit streak fits on one line.
- [ ] **Step 9: Commit** `feat(today): Kanko and the streak block above the check-in`.

### Task 5: Welcome and sign-in

**Files:**

- Modify: `components/onboarding/WelcomeFlow.tsx` (the `place` step's intro), `app/signin/layout.tsx`

**Interfaces:**

- Consumes: Task 4 `<Kanko>`; Task 6 `<Logo>` (if Task 6 has landed, otherwise leave the existing import).

- [ ] **Step 1:** Add `<Kanko mood="hello" size={160} priority />` above the first step's heading in `WelcomeFlow`, with the line `Hi, I'm Kanko. Let's work out what sets your mouth sores off, one day at a time.` as the intro copy for that step (keep the step's existing instructions below it). No change to the steps, writes or skipping.
- [ ] **Step 2:** In `app/signin/layout.tsx`, add `<Kanko mood="hello" size={120} />` centred above the card on screens taller than 640px (`hidden [@media(min-height:640px)]:block`), so it never pushes the form under a phone keyboard.
- [ ] **Step 3: Run** `npx vitest run && npm run lint`, then check `/signin` and `/welcome` at 320px with the keyboard-height variable set (iOS simulator or devtools). Expected: form fully visible.
- [ ] **Step 4: Commit** `feat(onboarding): Kanko on welcome and sign-in`.

### Task 6: Logo, icons and share card

**Files:**

- Modify: `components/icons/Logo.tsx`, `scripts/generate-app-icons.mjs` (rewrite on sharp), `app/opengraph-image.tsx`, `package.json` (`cap:assets` background colours `#4B4BF0`), `app/layout.tsx` (`icons`)
- Create: `public/images/kanko/kanko-face.webp`, `app/icon.png` (generated)
- Delete: `public/favicon.ico` (replaced by `app/icon.png`), `public/images/canker-core-logo-110.png`, `public/images/home/canker-core-banner-650.png` after confirming with `grep -r` that nothing references them

**Interfaces:**

- Produces: `<Logo size?: number; wordmark?: boolean; className?: string />` — Kanko's face (`kanko-face.webp`, round-cropped) and, when `wordmark`, `Canker Core` in `font-display font-extrabold`. Keeps `role="img"`/`aria-label="Canker Core"` on the face when there's no wordmark.

- [ ] **Step 1:** Extend `tools/kanko-assets.mjs` to write `kanko-face.webp` (256×256, centred crop of the app-icon master's face) and run it.
- [ ] **Step 2:** Rewrite `scripts/generate-app-icons.mjs` with sharp from the app-icon master: `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (face scaled into the 80% safe zone on solid `#4B4BF0`), `apple-touch-icon.png` (180, no transparency), `app/icon.png` (64), `resources/icon.png` (1024), `resources/splash.png` and `splash-dark.png` (2732, face at 20% width centred on `#16163F`). Keep the header comment explaining what each file is for.
- [ ] **Step 3: Legibility check (manual, blocking):** view `icon-192.png` at 48px and `app/icon.png` at 16px. If the face is mush at 48px, stop and report to Loren: a tighter-crop batch needs Loren's go. Do not draw it yourself.
- [ ] **Step 4:** Update `Logo.tsx` and every call site (`AppTopBar`, `Navlinks`, `Footer`, `signin/layout.tsx`) to pass `wordmark` where the text "Canker Core" currently sits beside it, and delete the now-duplicate text span.
- [ ] **Step 5:** Restyle `opengraph-image.tsx`: ground `#4B4BF0`, wordmark in white, the face image read with `fs.readFile` into a data URL, headline in white, the severity strip kept as is (it is data).
- [ ] **Step 6: Run** `npx vitest run && npm run lint && npm run build`. Expected: PASS and a clean build; `/opengraph-image` renders.
- [ ] **Step 7: Commit** `feat(brand): Kanko logo, app icons and share card`.

### Task 7: Articles stay quiet, docs corrected, and Loren's review

**Files:**

- Modify: `docs/ART-DIRECTION.md` (a superseded banner at the top pointing to the spec; leave the history below it), `AGENTS.md` (Conventions: the sentence "Everything else is cool slate plus one teal action colour" is now wrong; correct it to indigo with sunflower for wins, and nothing else)
- Create: `docs/superpowers/review/2026-11-05-brand/` screenshots (gitignored if large; otherwise committed)

- [ ] **Step 1:** `grep -rn "Kanko\|kanko" app/\(marketing\)/blog` returns nothing, and no blog/article component uses `win`/`shadow-press-win`. Fix anything that does.
- [ ] **Step 2:** Make the two doc corrections above. Do not add new sections to AGENTS.md.
- [ ] **Step 3:** Run `npx vitest run && npm run lint && npm run build`. Expected: PASS.
- [ ] **Step 4:** Take 390px screenshots, light and dark, of `/today` (neutral, proud, gentle), `/welcome`, `/signin`, `/my-sores`, `/insights`, the home page and one blog article. Put them on one review page and show Loren. **Dark mode does not ship until Loren approves these.**
- [ ] **Step 5: Commit** `docs: point art direction at the Momentum spec`, then hand the branch to the no-mistakes pipeline.
