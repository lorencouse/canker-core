# Canker Core art direction — working draft

Nothing here is settled. This file exists so the first paid draws answer a
question instead of producing a pile of pictures: it fixes the parts that
follow from the product (the palette, what may never appear) and lists the
parts that have to be decided by looking (the illustration style, the
mascot, the mark).

The loop is house-finder's, which works: write the contract once, put the
competing wordings in `tools/style-lab/<experiment>.json`, draw a labelled
contact sheet, look, pick, then write the winner down as the contract every
later prompt is joined to.

    node tools/style-lab.mjs tools/style-lab/mascot.json --sheet-only   # free: prices the batch
    node tools/style-lab.mjs tools/style-lab/mascot.json                # draws the missing cells
    node tools/style-lab.mjs tools/style-lab/mascot.json --only flat    # one variant
    node tools/style-lab.mjs tools/style-lab/mascot.json --n 3          # three draws each

Then look at them properly, which is a separate step:

    npm run art:review          # tools/review-page.mjs --all --serve
    node tools/review-page.mjs tools/style-lab/mascot.json --only ink --serve

`_sheet.png` tiles an experiment and is right for a style question, where the
point is nine cells side by side. It is wrong for judging a drawing: a 520px
tile hides exactly the faults that matter — a stray gradient, an outline the
contract forbade, a rose used as skin. `art:review` writes
`data/style-lab/_review.html`, every cell full width against the app's own
dark chrome with the prompt that drew it, and serves it on 127.0.0.1:4123,
because Chrome will not open a `file://` URL through the extension. The
checkerboard behind each frame is there so a near-white ground has a visible
edge. Nothing is adopted until it has been seen on that page.

`_review.txt` records the exact cells the page showed. Anything that acts on
a review reads that file and never "whatever is in the folder": in
house-finder a second batch landing mid-review is how 36 unlooked-at frames
once got shipped. Approving a page approves what was on the page.

Cells are content-addressed by prompt hash under `data/style-lab/_cells`, so
retiling and carrying a variant forward unchanged cost nothing. Every billed
call lands on `tools/.art-ledger.json`. The model is Gemini's image model
("Nano Banana"), `gemini-3.1-flash-image`, on the AI Studio key in
`.env.local`; a 1K cell is about $0.067. **No batch is drawn without Loren
saying yes to that batch**, quoted from `--sheet-only`, never from a
per-frame multiplication.

## What the product already decides

Two rules come from `styles/main.css` and are not up for a vote.

**Red is data.** The `--sev-*` ramp encodes pain 1–10 and is the only
saturated red in the product. It follows that **no illustration contains red
at all** — not a scarf, not a ball, not a berry, not a heart. The moment red
is decorative, a severity dot stops meaning anything. This is the single
hardest rule to hold, because the model will reach for red the instant a
picture is about a sore, so every prompt says it out loud.

**Everything else is cool slate plus one teal.** The art shares the app's
chrome rather than sitting beside it in its own world.

| Colour | Hex | Bound to |
| --- | --- | --- |
| paper | `#f1f3f5` | the default background of a spot illustration |
| card white | `#ffffff` | the lightest thing in any frame |
| ink | `#0f151b` | the 2px outline on every object, the inverted panel bar, eyes, the darkest thing in any frame |
| deep teal | `#1b616a` | the one action colour; a character's body, one object |
| bright teal | `#59b8c5` | small accents, the dark-mode twin of deep teal |
| pale teal | `#e3f0f2` | large quiet fills, a face disc, a wall |
| muted slate | `#657281` | secondary objects |
| border slate | `#dbe0e6` | every shadow shape, hairlines |
| warm tooth | `#f8f6f1` | teeth, paper, anything that should read warm |
| sand shade | `#e6e1d6` | the shaded side of a warm shape |
| tissue rose | `#e9ddde` | mouth tissue, and only mouth tissue |
| deep rose | `#d7c6c8` | the shaded side of mouth tissue |

Nothing else appears. The rose pair is the mouth-map tissue from the app and
carries the same meaning here: it is not a skin tone and not a decoration.

Two more rules come from Chalk rather than from colour. **Elevation is a hard
`5px 5px 0` offset in ink**, never a soft blur: a blur says floating, an
offset says printed, and a record you keep is printed. Soft shadow is
reserved for the rare thing that genuinely hovers, which so far is nothing.
And **there is no skin colour in the token set**, which is a gap rather than
an answer — see the open question below.

**A third rule, from the subject matter.** The audience is in pain and
usually looking something up at 1am. Nothing gory: no blood, no raw flesh,
no clinical close-up of a wound, no grimace, nothing that would make someone
with a mouth full of ulcers flinch. Calm, plain, a little warm. The honest
depiction of an ulcer already exists in the product — the SVG diagrams in
`components/marketing/diagrams` — and that is where medical accuracy lives.
Illustration's job is the opposite: to make the rest of the page bearable.

Also, always: **no text, no letters, no numbers in the pixels**. Every sign,
screen, label and chart in a drawing is blank. Lettering is typeset later.

## Question 1 — the illustration style — ANSWERED: ink

Closed 2026-09-17 by the Chalk redesign rather than by the sheet. A UI built
out of 2px ink rules makes outline-free art read as a different hand, so
`flat` and `paper` are struck. Every variant now carries an ink outline. The
original three candidates are kept below because the reasoning still explains
why the model behaved as it did.


Written out in full in `tools/style-lab/mascot.json`; the short version:

- **flat** — hard-edged flat fills, one colour per shape, no outlines, no
  gradients, shadows as solid `#dbe0e6` shapes. Cheapest to keep consistent
  across a hundred pictures, and the model obeys it best.
- **ink** — flat fills under one even-weight `#0f151b` line with rounded
  ends. Closest to the SVG diagrams the site already ships, so mascot and
  diagram would read as one hand. Risk: even-weight lines are exactly what
  image models drift on.
- **paper** — matte fills with a fine paper grain, rounded slightly
  irregular forms, one soft shadow. Warmest, least clinical. Risk: grain
  fights WebP and a "soft" instruction invites gradients back in.

My read: **ink** is the one that would make this product look like itself,
because the diagrams are already the best thing on the site and the mascot
would join them rather than arrive from a different studio. **flat** is the
safe answer if the set is ever going to be large.

## Question 2 — the mascot (three candidates)

- **Pip**, the marker. The severity pin off the mouth map, given two eyes.
  Brand-native, no animal baggage, survives being shrunk to a favicon, and
  it is literally the object the user taps. Risk: a shape with a face is
  easy to draw badly and hard to make warm.
- **Nim**, an axolotl. The animal whose whole cultural meaning is
  regrowing tissue, which is the promise the product makes. Friendly,
  mouth-forward, memorable. Drawn in teal and warm tooth, never pink, so it
  stays off the severity ramp. Risk: needs explaining once.
- **Tuck**, a tortoise. Patience and daily logging; a sore takes 7–14 days
  and the app's whole ask is "come back tomorrow". Risk: generic.

My read: **Nim**. Healing is the story, and the mascot should carry it.

## Question 3 — the mark

The mark should be **hand-drawn SVG, not generated**. Image models cannot
hold a geometric mark across sizes and cannot letter, and this repo already
draws its own vector art. The lab is useful for sketching the idea, not for
producing the file. Three ideas worth sketching:

1. **The healing ring** — a ring whose pale centre and teal halo are the
   geometry of an aphthous ulcer seen from above (`stages.ts` already draws
   this honestly), with one gap in the ring that reads as a C. The gap
   closes as it heals, which gives loading and progress states a mark that
   animates for free.
2. **The core** — concentric rings with only the innermost filled: the
   thing at the centre, and a pin on a map, in the same shape.
3. **The arc** — the severity ramp as a short curve of dots stepping down,
   which is what a healed sore looks like in the history chart.

Ring first, and the wordmark set in the site's own type rather than drawn.

## First sheets, 2026-09-17 ($0.40 through the Batch API)

`data/style-lab/mascot-and-style/_sheet.png` and `mark-sketches/_sheet.png`.
What they settled and what they did not:

- **The palette held completely.** Nine mascot cells and three marks, no red
  anywhere, nothing off the list. The colour rule survives contact with the
  model, which was the thing most likely to fail.
- **`flat` did not come back flat.** Every cell arrived with an outline, a
  soft elliptical shadow and in places a gradient — the model collapsed all
  three style wordings toward one outlined, rounded house look. `ink` is the
  only variant that got what it asked for, and it got it because it asked for
  the thing the model already wants to draw. That is an argument *for* ink:
  the attractor state is the cheap style to hold across a hundred pictures.
  If flat is ever wanted, the contract needs hardening first, and the
  experiment rerun before any real set is drawn.
- **`tuck` broke the rose rule** in flat and paper, using tissue rose on the
  legs as a skin tone. Rose is mouth tissue and nothing else; a future
  contract has to say so where the model can see it.
- **Nim is the pick.** The axolotl is the only candidate that is both
  distinctive and on-message, and the ink cell is the best drawing on the
  sheet. Pip reads as a delivery-app location marker rather than anything to
  do with health; Tuck is charming and generic.
- **Of the marks, ring.** The model bit a square notch and let the centre
  overflow, but as SVG that is a stroked circle with a dash gap, and the gap
  closing is one line of animation. Core is a bullseye that reads as a target
  and sits too close to a severity dot; arc reads as a loading spinner and its
  small end dots vanish at favicon size.

Next, once approved: a Nim character sheet in ink — several views and a row
of expressions on one frame — which becomes the reference image every later
prompt carries, because this model holds a character far better from an image
than from words.

## Direction change, 2026-09-17: Canker Boy

The three-candidate sheet above is dead. Loren's answer to it was that none of
them shout canker sore, and that the mascot should be **Canker Boy**, an
evolution of the logo the project already had rather than a new invention.

`public/images/canker-core-logo-110.png` and `home/canker-core-banner-650.png`
are the original: a mid-century American advertising mascot — peaked uniform
cap, brown suit, red tie, thumbs up, wide toothy grin, thick black outline,
flat yellow ground. The milkman, the service-station attendant, Mr. Clean.
Nothing like a health app, which is the point: every other site on this
subject is teal gradients and stock photos of somebody holding their jaw.

Settled so far:

- **A man, 25–35.** Not a boy, whatever the name says, and not the
  middle-aged read of the original banner.
- **The toothy smile stays.** It is the risk and the asset at once: a mouth
  brand whose mascot opens his mouth is either confident or oblivious, and
  Loren's call is confident.
- Three things in the original still have to change, because the product
  already decided them: the **red tie** (red is data), the **yellow ground**
  (not in the system), and the **detail density** (already mush at 110px,
  unreadable as a favicon).

**The UI he has to sit inside** is the Chalk redesign, landed 2026-09-17 in
the working tree (verified against `styles/main.css` and `tailwind.config.js`,
not taken on trust). What it means for the art:

- Ink is now `--rule` **#0f151b**, drawn at **2px**, and it is a real outline
  on every object, not just eyes and linework. `--border` stays a hairline for
  things that belong together. Two weights, never one.
- Elevation is `--drop`, a **hard 5px 5px 0 offset in ink**. There is no soft
  grey blur anywhere in the product, so there is none anywhere near him.
- `--radius` is **0**, and `rounded-worksheet` went to 0 as well. Nothing is a
  rounded rectangle except chips, which stay fully round. `.surface-instrument`
  is a 2px ink top rule with no box at all; `.surface-worksheet` is a 2px ink
  box with the hard offset. If he ever appears beside a surface, that is the
  construction.
- Display type is **Saira Semi Condensed**, uppercase labels tracked +0.12em,
  sitting under the figure they name. Any earlier reference in this file to
  Archivo is stale.
- The `--sev-*` ramp, the teal `--primary` and the `--mm-*` rose-greys are
  **unchanged**. Red is still data, so the tie is teal #1b616a, not red.

This also closes the flat/ink/paper question from the first sheet: a UI built
out of 2px ink rules would make flat art with no outline read as a different
hand. Ink wins, and every variant now carries an outline.

Still open: the mark (his face reduced, versus the cap alone — the cap is the
better silhouette and keeps continuity), and the illustration style, which is
now waiting on the fitness UI redesign in flight in another session so the
art sits inside that language rather than beside it.

One rule proposed and not yet ratified: **Canker Boy is app and marketing
furniture, not medical-page furniture.** A grinning mascot on "are canker
sores herpes?" reads as unserious to somebody who is frightened. The SVG
diagrams already carry the clinical pages, and carry them well.

## Canker Boy as he now stands, 2026-09-17

Settled over three sheets. The first drew him four ways and Loren picked
`sportlogo`; the second is testing how far he reduces.

- **A coach, early twenties.** Started at 25–35 and came back too
  middle-aged, so he is about 22: rounder face, softer jaw, no facial lines
  except eyes, eyebrows and smile.
- **Deep teal ball cap** with an ink brim and a blank front panel. This is the
  last of the original logo's equity and the only thing still saying coach.
- **Deep teal crew-neck t-shirt.** No collar, no tie, no whistle, nothing
  hanging at his neck. The tie went with the collar — a tie needs one — and
  the whistle was cut separately.
- **Sand shade #e6e1d6 skin, warm tooth #f8f6f1 teeth**, wide open confident
  smile.
- **Ink #0f151b outline**, flat fills, no gradient, no texture, no soft shadow.

**Why he has no skin token.** Every literal skin tone is warm, and the
palette was built to exclude warm saturated colour. Rather than spend the
system's first warm token on it, he is *printed in two inks*: sand face, teal
shirt and cap, ink line — a silk-screened patch, which is the same logic as
Chalk's hard offset saying printed rather than floating. This also fixed a
real bug: in v1 his #e6e1d6 face and #f8f6f1 shirt were near-identical and
his head and torso read as one cream mass. Stated plainly so nobody has to
rediscover it: cream skin still reads as a white man to most viewers, and the
print framing softens that rather than erasing it. If he ever needs to be a
person rather than a print, the honest fix is one desaturated warm token
(~#b8907a) and a deliberate choice — a one-mascot brand is always exactly one
person. Teal or ink skin was rejected: on a health product, a mascot whose
skin is an unusual colour reads as unwell.

**What the sheets taught about the model**, which matters more than any one
drawing: style wordings barely move it. Four style contracts converged into
one drawing, exactly as `flat` earlier came back outlined and shadowed. The
lever that works is a reference frame — hold the character with an image and
change one thing at a time with words — so from v2 on, the winning cell rides
along as `data/style-lab/refs/canker-boy-v1.jpg` and a subject prompt says
only what changed instead of redescribing him.

## What is not decided here

Where the art actually goes (blog headers, empty states, the mobile
onboarding, og:images), what sizes, and whether a picture is warranted per
page. That is a content question and belongs beside `docs/CONTENT-SEO.md`
once the style exists.
