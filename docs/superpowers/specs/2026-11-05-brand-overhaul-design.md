# Canker Core brand overhaul: Momentum and Kanko

Decided with Loren on 2026-11-05. Approved artwork and the mockup page are in
[`assets/2026-11-05-kanko/`](assets/2026-11-05-kanko/); open `mockups.html`
there in a browser to see the six reference screens.

Marked **(builder's call)** or **(my call)** where a decision was not Loren's.
Everything unmarked is Loren's decision.

## Why

The current look is borrowed from fitness apps: Saira Semi Condensed in
uppercase, one teal, square corners, ink outlines, and hard offsets in the
art (the "Chalk" direction in `docs/ART-DIRECTION.md`). Loren's verdict is
that it feels vibe-coded and generic. The colours, the logo and the screens
don't add up to an original, cohesive brand.

The feeling the product should give is **agency**: _I'm doing something
about this, and it's working._ The user is building healthier habits and can
see the progress. It is not a clinic and not a pain diary that pities you.

Two references, each borrowed for one thing:

- **Duolingo** for momentum and personality: streaks, small celebrations,
  progress that visibly piles up, and a character you'd recognise without
  the logo.
- **Sleep trackers** (Oura, Rise, Sleep Cycle) for credibility: data that
  stays calm and readable on a bad day.

## Goals

1. One coherent brand across the app: colour, type, shape, a mascot and a
   voice that all say the same thing.
2. Progress is the hero on the Today screen: streaks of trigger-free days,
   sores healing, and wins that get celebrated.
3. A mascot, **Kanko**, who carries the personality: cheering on good days
   and quietly kind on bad ones.

## Non-goals

- No change to the data model, the logging flows' logic, or what is tracked.
- No new gamification mechanics beyond showing what the app already knows.
  The streak is "consecutive days logged with no trigger" from existing
  `day_logs`; how it's computed is the builder's call, but no new tables
  are needed for the look.
- Not the clinical/medical article pages' illustrations. The SVG diagrams in
  `components/marketing/diagrams` keep doing that job.

## Anti-goals (failure even if it technically works)

- **Clinical**: blue-and-white, sterile, dentist-office.
- **Generic**: shadcn defaults with a new accent colour bolted on.
- **Fitness/performance**: intensity, rings to close, "crush it" energy.
  This is about habits, not performance.
- **Childish**: Kanko is cute, but the app must still feel trustworthy to an
  adult in pain at 1am.
- **Joking at someone in pain**: no confetti, cheek, or puns on a bad-day or
  high-severity screen.

## Constraints that carry over (not up for a vote)

- **Red is data.** The `--sev-*` ramp is the only saturated red anywhere,
  in the UI and in every illustration. The brand colour is indigo partly
  because it sits far from that ramp.
- Everything in AGENTS.md "UI formatting rules" and `docs/MOBILE.md`:
  one-line buttons and chips, 44px tap targets, 16px inputs, no horizontal
  scroll at 320 to 430px, tabular numerals for figures, sentence case in
  source, no em-dashes in UI copy, `dvh`, `--safe-*`, `size="touch"`.
- Analytics stay first-party only; nothing here adds a third-party script
  (Google Fonts go through `next/font`, which self-hosts).
- Nothing gory in any illustration, and no text in the pixels.
- All paid image generation runs through the Gemini Batch API
  (`tools/style-lab.mjs` already defaults to batch), with Loren's go per
  batch.

## The visual system: "Momentum"

Bright, chunky and a bit game-like. Chosen over a warm journal look (too
generic) and a dark sleep-tracker look (too serious).

### Colour

| Role             | Hex       | Use                                                                                   |
| ---------------- | --------- | ------------------------------------------------------------------------------------- |
| Indigo (primary) | `#4B4BF0` | The action colour: primary buttons, the streak card, active tab, links                |
| Indigo deep      | `#2F2FB8` | The pressable bottom edge under indigo controls; pressed state                        |
| Sunflower        | `#FFD23F` | Wins only: the streak number, completed days, stars, celebration accents              |
| Sunflower deep   | `#D9A800` | The pressable edge under sunflower elements                                           |
| Ink              | `#16163F` | Body text, headings, the night background                                             |
| Ink soft         | `#4A4A78` | Secondary text                                                                        |
| Ground           | `#F1F1FD` | Light-mode page background (matches the art's background exactly, so Kanko blends in) |
| Line             | `#E2E3FA` | Borders, inactive day dots, the edge under ghost buttons                              |
| Lavender         | `#B9A7F2` | Comfort: the bad-day pillow, quiet secondary accents                                  |
| Card             | `#FFFFFF` | Cards on the light ground                                                             |

The existing `--sev-*` ramp stays exactly as it is. The mouth map is
redrawn as a soft toy to match Kanko: rounded shapes shaded by soft
gradients and one drop shadow, no outlines, one smooth tooth band per arch,
a smooth tongue, in a mauve and violet `--mm-*` palette (soft purples in
dark mode, a clearly mauve lip). Its regions and stored sore positions do
not move. Every pain level must stay perceptually distinct from every tissue
fill in both themes: CIEDE2000 of at least 12, and no less than the old
fills gave the same pair (`utils/contrast.test.ts` holds this).

**(builder's call)** Mapping these onto the existing HSL custom properties
in `styles/main.css` (`--primary`, `--background`, `--accent`, `--chart-*`
and so on) and checking every text pairing for 4.5:1. Sunflower is for
fills and numbers sitting on indigo or ink, never small text on white.

**Dark mode (my call, needs a look before it ships):** ground is the ink
`#16163F` family, as on the evening mockup (`#0f1033` there), with cards one
step lighter, indigo lifted for contrast, and sunflower unchanged. The
evening screen is the reference for how dark should feel.

### Type

- **Display: Bricolage Grotesque**, weights 600 and 800. Headings, the big
  streak number, numbers in general.
- **Body: Nunito**, weights 500 to 800. Everything else, including button
  labels (800).
- Both via `next/font/google`, replacing Saira Semi Condensed and Source
  Sans 3 in `app/layout.tsx`.
- Sentence case on screen. The current uppercase, tracked display treatment
  goes away; it's part of the fitness look.

**(builder's call, verify first)** Saira was chosen because large figures fit
on a phone without wrapping and it has tabular figures. Before committing,
check that Bricolage Grotesque sets a three-digit figure at the current
large sizes within a 320px screen, and supports tabular numerals
(`font-variant-numeric: tabular-nums`). If its numerals fall short, set
figures in Nunito and keep Bricolage for words. Don't silently lose
tabular alignment.

### Shape and depth

- **Rounded.** Cards about 16 to 20px radius, buttons 16px, chips and day
  dots fully round. This replaces `--radius: 0`.
- **The pressable edge.** Primary and secondary buttons, the streak card and
  completed day dots sit on a solid bottom edge (`0 5px 0` in the "deep"
  colour of their fill; ghost buttons use `--line`). Pressing moves the
  control down and shrinks the edge, so it feels like a physical key. This is
  the Duolingo-like signature; there are no soft blurred shadows except on
  things that truly float (dialogs, menus, tooltips).
- Ghost/secondary buttons: white fill, 2px `--line` border, `--line` edge.
- No ink outlines on panels or cards.

Reference values are in `mockups.html` (the `.btn3d`, `.streak`, `.day`,
`.sore` rules). **(builder's call)** exact tokens and Tailwind config.

## Kanko, the mascot

### Who Kanko is

A very round golden hamster, almost a ball, whose head and body are one soft
shape. Honey-apricot fur (`#F5B95A`), a cream belly and big cream cheek
pouches (`#FFF1D6`), black oval eyes with one white highlight, a tiny nose,
and soft pink blush. Kanko is a hamster because hamsters are all cheeks
(where most sores happen) and live for food (which is where most triggers
come from).

**The name:** "Kanker" was considered and rejected because it means cancer
in Dutch and Afrikaans and is a harsh Dutch slur.

**The signature move:** Kanko's cheeks puff up with wins, as if stuffing
them full. A bigger streak means fuller, prouder cheeks.

**Rules:** never shows teeth; never red; never jokes on a bad day; no text in
any image of Kanko. Props come only in indigo, lavender or sunflower.

**(my call)** The pink blush (`#F7A8D0`) is allowed. It is pale and reads as
a cheek, not as a severity colour or as mouth tissue. If it ever drifts
toward red in a drawing, that drawing is rejected.

### Style

- **Primary: soft 3D vinyl toy.** Smooth matte plastic, soft studio
  lighting, rounded chunky forms. Every in-app image uses this style.
- **Kept for later: flat with thick indigo outlines**
  (`kanko-outline-sheet-alt.webp`). Loren likes both. Likely uses are tiny
  sizes, stickers, or print, but nothing is built with it now.
- `kanko-character-sheet.webp` is the canonical reference. Every future
  image of Kanko sends it as a reference frame, because the model holds a
  character far better from an image than from words.

### Moods and where they're used

| Mood                              | Asset                       | Screen                                                     |
| --------------------------------- | --------------------------- | ---------------------------------------------------------- |
| Proud, cheeks full, confetti      | `kanko-proud-streak.webp`   | Today, on a streak                                         |
| Waving hello                      | `kanko-hello.webp`          | Welcome / first run (`components/onboarding`)              |
| Curious, peeking over a box       | `kanko-curious-empty.webp`  | Empty states (no sores yet, empty history)                 |
| Gentle, hugging a lavender pillow | `kanko-gentle-bad-day.webp` | After logging a high-severity reading or a new sore        |
| Sleepy, nightcap, moon            | `kanko-sleepy.webp`         | Settings / Reminders, beside the evening reminder          |
| Puffed-cheek face on indigo       | `kanko-app-icon.webp`       | App icon, PWA icons, notification icon                     |
| Pointing                          | `kanko-point.webp`          | Marketing home, how-it-works step 1                        |
| Holding a phone                   | `kanko-phone.webp`          | Marketing home, how-it-works step 2                        |
| Magnifying glass                  | `kanko-magnify.webp`        | Marketing home, how-it-works step 3                        |
| Reading                           | `kanko-reading.webp`        | Blog listing only (never inside an article)                |
| Lost, map in paw                  | `kanko-lost.webp`           | Not-found and error pages (`LostScreen`)                   |
| Medal                             | `kanko-medal.webp`          | Today, after marking a sore healed (replaces streak Kanko) |
| Envelope                          | `kanko-envelope.webp`       | Sign-in "Check your email" screens                         |
| Clipboard                         | `kanko-clipboard.webp`      | Settings / Profile                                         |
| Holding a cut cable               | `kanko-offline.webp`        | Native offline shell (`native/shell/index.html`)           |

Waving hello also sits beside the marketing home headline; plain front-facing
Kanko (neutral) is on About and the loading skeleton. All Kanko images are
decorative (`alt=""`, `aria-hidden`). `components/kanko/moods.ts` lists what
ships.

Loren chose the original gentle drawing (half-closed, calm eyes) over a
wide-eyed redraw. Don't "fix" it.

**(builder's call)** final placement and sizes, the threshold that counts
as a "bad day" (a reasonable start is a new sore or any reading of 6 or
higher), and how the 1K WebP masters are resized for `public/`. The app
icon still needs iOS/Android variants (maskable safe zone, no transparency
on iOS) cut from the master. If the face doesn't survive at 48px, ask for a
tighter crop in a new batch rather than shipping mush.

In light mode the shipped art has transparent backgrounds (cut out by
`tools/kanko-assets.mjs`), so it sits directly on the ground and no square
edge shows; no edge mask is used. Dark mode uses separate art drawn natively
on the dark ground (masters in `assets/2026-11-05-kanko/dark/`), which the
same script shifts so its ground matches the page (`#0f1033`), or the card
(`#191a48`) for curious Kanko, which sits inside cards. The masters carry a faint vignette, so
ground within a few levels of the target is then set to it exactly (and eased
a little further out), and the script fails if any keyed block drifts after
encoding.

## Voice

Warm, short, a little cheeky. The benchmark line is **"Three days strong.
Your mouth is thanking you."** It celebrates the person, talks plainly
about the body, and doesn't turn into a cartoon.

- **On wins** (streaks, a sore marked healed, a full week logged): playful,
  with Kanko celebrating.
- **On bad days** (pain logged, a new sore, high severity): quiet and steady.
  "Rough one today. Logged. That's the hard part done." No exclamation
  marks, no confetti, no jokes, and no health advice (see "Screen decisions").
- **Everyday** (empty states, reminders): friendly and brief, in Kanko's
  first person where it fits ("I'll keep track of it").
- Copy rules from AGENTS.md still apply: sentence case, no em-dashes.

The six mockups in `mockups.html` hold the reference copy for each screen.
They are illustrations of the look and voice, not literal layouts; where a
mockup and this section disagree, this section wins.

## Screen decisions

Loren's answers to the builder check:

- **Today: the streak block sits above the existing check-in.** Kanko, the
  headline, the streak card and the week dots go at the top; `DayLogForm`,
  `SoreCheckInCard`, save and "Log a sore" stay below, working exactly as
  now. Logging does not change.
- **Bad day: inline on Today, no tips.** After a save that counts as a bad
  day, Today swaps the streak block for gentle Kanko and the quiet copy in
  place. No new screen, no extra step, and no health advice: the "Might
  help" card in mockup 4 is dropped, so there is no medical copy to review.
- **Logo: Kanko's face plus the wordmark.** Kanko's puffed-cheek face beside
  "Canker Core" set in Bricolage Grotesque replaces the Canker Boy logo in
  the header, the marketing home page, share images and the favicon. A
  cleaner face crop may need one small image batch (Loren's go first).
- **Articles and blog: a quieter version, no Kanko.** Content and medical
  pages get the new colours and fonts, toned down (less sunflower, no
  celebration styling), and Kanko does not appear on them. The one exception
  is the blog listing page, which carries reading Kanko; articles never do. The SVG diagrams
  keep their job.

My calls, settled without Loren because they don't change what gets built:

- **Tab labels stay** Today / Map / Insights / Settings. The mockups' labels
  were shorthand.
- **Light and dark ship together**, and Loren reviews dark-mode screenshots
  before anything goes live.
- **An ordinary day** (no streak, not a bad day) shows plain front-facing
  Kanko cropped from the character sheet. A dedicated "everyday" pose can be
  drawn later as its own batch.
- **Welcome:** no new screen before sign-in. Kanko waving goes into the
  existing post-sign-in `/welcome` flow, and the sign-in page is restyled in
  the new look (it may carry Kanko too). Mockup 2's buttons are illustrative.
- **Evening reminder:** the notification keeps its fixed text; a live streak
  count in a notification would be a new feature. Mockup 5 shows how dark
  mode should feel, not a new night-only screen. Kanko's face becomes the
  notification icon where the platform allows it.

## Supersedes

- **`docs/ART-DIRECTION.md`**: the Chalk direction (square corners, ink
  outlines, hard offsets, teal) and **Canker Boy** as mascot are replaced
  by this document. The rules that carry over are listed above. The builder
  should update that file so it doesn't keep directing new art toward
  Canker Boy.
- `public/images/canker-core-logo-110.png` and
  `public/images/home/canker-core-banner-650.png` (the old Canker Boy art)
  are replaced wherever they appear.

## Left to the builder

- Token mapping, Tailwind config, and rewriting `components/ui/button.tsx`
  to the rounded, pressable style (keeping `button.test.ts` green and the
  one-line rule).
- Screen-by-screen rollout order across `(app)`, `(onboarding)` and
  `(marketing)`, and the streak calculation.
- Whether more Kanko poses are needed. New art goes through
  `tools/style-lab.mjs` in batch, with the character sheet as reference and
  Loren's go per batch.
- Checking contrast, reduced motion for any celebration animation, and the
  320px layout on every changed screen.

## How this was made

Two image batches (Gemini `gemini-3.1-flash-image`, Batch API, 1K) produced
the sheets and poses; about $0.74 across the whole session, including a
discarded redraw. The prompts' style and character blocks:

> **Style:** Soft 3D render of a collectible vinyl toy: smooth matte plastic
> surfaces, soft studio lighting, gentle ambient occlusion, rounded chunky
> forms, like a modern friendly 3D app mascot. No fur strands, no
> photorealism, clean and simple.
>
> **Character:** Same character as the attached reference images. Kanko is a
> golden hamster who is very round, almost a ball: head and body merge into
> one soft chubby shape, with tiny round ears, tiny paws and short stubby
> feet. Fur colour is honey-apricot #F5B95A on the back, head and ears, with
> a cream #FFF1D6 belly and two large cream #FFF1D6 cheek pouches that bulge
> out on both sides of the face. Face: two black oval eyes, each with one
> small white highlight, a tiny nose, a small simple mouth, and soft light
> pink #F7A8D0 blush on the cheeks. Kanko never shows teeth. Any prop or
> accent uses only electric indigo #4B4BF0, lavender #B9A7F2, sunflower
> yellow #FFD23F. No red anywhere. No text, no letters, no numbers, no
> labels, no logos, no watermark.
