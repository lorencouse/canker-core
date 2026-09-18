# Content, SEO and AEO — the plan for organic signups

Goal: people who search about a mouth ulcer land on Canker Core, and enough of
them create an account and log a first reading that the site compounds.

Constraints this plan is built around, because they decide everything else:

- **One person writes it, and there is no clinician on the byline.** So we do
  not compete for treatment and diagnosis queries. Mayo, Cleveland Clinic,
  NHS and Healthline own those, they are Your-Money-or-Your-Life queries where
  Google explicitly weighs author credentials, and a solo site making
  treatment claims is both unrankable and a liability.
- **The product is free.** A lead is an account plus a first reading. Anything
  that gets a visit but not a reading is a vanity number.
- **`cankercore.com` is live as of 2026-09-17**, but the sslip staging host
  still serves the same site. Until that redirects, the two hosts are
  competing copies of each other.

## The strategic bet

We cannot out-authority a medical publisher on _what a canker sore is_. We can
own a space none of them want, which is **the course of one sore over time**.
Every big health page answers "what is it and what do I do". Almost nobody
answers "it is day 9, is this normal, is mine actually shrinking". That is the
question a person with an active ulcer types at 11pm, it is the question the
product exists to answer, and the searcher is by definition mid-episode — the
only moment when starting a tracking log makes sense.

The keyword data below bears this out exactly: the treatment and causes head
terms are locked up by medical publishers at KD 48–64, while the whole
duration-and-healing space sits at KD 18–35 with a SERP whose tenth result has
no backlinks at all.

Two assets follow from that, and they are the whole moat:

1. **Interactive answers embedded in the articles** — a timeline estimator, the
   stage diagrams, the mouth map — usable without an account. Not standalone
   tool pages: nobody searches for the tools, they search for the questions.
2. **First-party aggregate data.** Once there are a few hundred sores in
   `readings`, we can publish the median days-to-heal, the size curve by day,
   the distribution of sites in the mouth. Nobody else has that. It is the one
   thing on this site a Mayo Clinic page might link to, and the one thing an
   answer engine has no substitute for.

## Phase 0 — technical foundations

`cankercore.com` went live on 2026-09-17, and as of 2026-09-18 the Phase 0
build is deployed and verified live: `/robots.txt` and `/sitemap.xml` both
answer 200 on the canonical domain, the sitemap carries `cankercore.com` URLs,
and all four Phase 1 articles are served. `/llms.txt` is still a 404.

| #   | Task                                                                                                                                                                                                                                                                               | Status                                                           |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | `cankercore.com` serving over TLS                                                                                                                                                                                                                                                  | **done**                                                         |
| 2   | `canker.46.224.227.119.sslip.io` no longer serves the site — 404 over HTTP, 503 over TLS as of 2026-09-18, so the duplicate host is gone. A 301 to the canonical domain would be tidier if that host is ever routed again                                                          | **done, by the host going away**                                 |
| 3   | `NEXT_PUBLIC_SITE_URL` must be `https://cankercore.com` in the _build_, not just the runtime env. The prerendered pages bake absolute URLs from it; the documented build command passed an empty string                                                                            | **done** — the live sitemap carries canonical URLs               |
| 4   | `robots.txt` — allows all, disallows the session-gated paths, names the answer-engine crawlers explicitly, points at the sitemap                                                                                                                                                   | `app/robots.ts`                                                  |
| 5   | `sitemap.xml` — the four public pages, ready to take articles                                                                                                                                                                                                                      | `app/sitemap.ts`                                                 |
| 6   | Canonical URLs on every public page, plus Open Graph and Twitter cards                                                                                                                                                                                                             | `app/layout.tsx`, marketing pages                                |
| 7   | Generated share card, 1200×630                                                                                                                                                                                                                                                     | `app/opengraph-image.tsx`                                        |
| 8   | JSON-LD: `Organization` and `WebSite` sitewide, `SoftwareApplication` on the home page with `price: 0` — the fact most worth being quoted on                                                                                                                                       | `components/seo/JsonLd.tsx`                                      |
| 9   | Marketing pages made statically prerenderable. `Navbar` resolved the session on the server, which forced the entire marketing group dynamic; it now resolves in the browser and the signed-out header is what a crawler gets                                                       | `components/ui/Navbar/*`, `components/marketing/StartButton.tsx` |
| 10  | Blog infrastructure: MDX articles as their own route folders with the registry in `content/articles.ts`. Articles as code, reviewed in a diff, not rows in the database. The tag index was dropped — four articles do not need one, and nine want a hub page each rather than tags | **done, without tags**                                           |
| 11  | Google Search Console and **Bing Webmaster Tools**. Bing is not an afterthought — it is the index behind ChatGPT search and Copilot. Submit the sitemap to both                                                                                                                    | **open — needs you**                                             |
| 12  | Analytics with a goal on _first reading logged_, not on signup                                                                                                                                                                                                                     | **open**                                                         |

Rule for every page from here: the honest answer appears in the first forty
words, above any preamble. That is what gets extracted — by a featured
snippet, by an AI overview, and by whatever reads the page next.

## Where we start from, measured (2026-09-17)

Semrush on the day the domain went live, so that month 3 has something to be
compared against:

- Authority Score 2, organic traffic 0, 18 organic keywords, nothing ranking.
- AI visibility 0: no mentions and no cited pages in ChatGPT, AI Overviews,
  AI Mode or Gemini. Phase 0's crawler rules are the entry ticket, not a
  result.
- 195 referring domains and 292 backlinks, and **none of them count.** They
  are stats-scraper subdomains (`wants.cfd`, `takes.sbs`, `knows.sbs`),
  "Website Stats" pages, and one PBN advert using our own URL as its anchor
  text. Nearly all nofollow, nearly all first seen in January 2026 — months
  before there was a site to link to. Semrush paints the network graph
  "Dangerous"; that is the scraper cloud, not a penalty, and there is nothing
  worth disavowing while the profile is inert. The point is not to read 195 as
  a head start: real referring domains are zero, and the weekly metric should
  count follow links from sites a person would recognise.

## What the keyword data says — round one, the Phase 1 clusters

Pulled from Semrush on 2026-09-17, US database. Volumes are monthly, KD is
Semrush Keyword Difficulty.

**The market is enormous and the head is closed.** `canker sore` is 301,000
a month at KD 52; `canker sores` 60,500 at KD 64; `what causes canker sores`
40,500 at KD 48; `canker sore treatment` 74,000 at KD 48. Those are Cleveland
Clinic and Mayo queries and we are not going to take them. Nothing in the plan
should aim at them.

**The duration cluster is wide open, and it is exactly our thesis.**

| Keyword                                     | Volume | KD     |
| ------------------------------------------- | ------ | ------ |
| how long do canker sores last               | 12,100 | **25** |
| how long does a canker sore last            | 3,600  | **18** |
| how long does canker sore last              | 1,300  | 24     |
| how long canker sore go away                | 880    | 34     |
| how long does it take a canker sore to heal | 880    | 27     |
| how long do canker sores take to heal       | 720    | 23     |
| how long for canker sore to heal            | 720    | 28     |
| how long to canker sores last               | 590    | 22     |

Plus roughly forty more variants between 40 and 400 a month, nearly all under
KD 35. Call it **25,000 a month at an average difficulty in the twenties** —
the single best target on the board, and the exact question the product exists
to answer.

**The SERP confirms it is winnable.** For `how long do canker sores last`,
Semrush shows 156 results with an AI Overview and a Discussions-and-forums
block at position 3. Cleveland Clinic holds #1 with 460 referring domains — but
#2 is an Aspen Dental page with **2** referring domains, #8 a dental practice
blog with 1, and **#10 has zero backlinks and zero referring domains**. Below
the first result this is a SERP of thin dental-practice filler. A page written
by someone who has actually watched the curve can take it. The forums block is
the tell: Google is already reaching for patient experience on this query and
finding only Reddit.

**The "is it healing?" cluster is unowned.** Small individually, and nobody has
bothered to write it properly.

| Keyword                                          | Volume | KD     |
| ------------------------------------------------ | ------ | ------ |
| how do you know when canker sore is healing      | 210    | **16** |
| how to know a canker sore is healing             | 260    | 32     |
| how do you know when a canker sore is healing    | 210    | 29     |
| how to know if a canker sore is healing          | 210    | 39     |
| how to tell if canker sore is healing            | 140    | 33     |
| how can you tell if a canker sore is healing     | 140    | 42     |
| how to know if your canker sore is healing       | 50     | **2**  |
| do canker sores get worse before they get better | 140    | 28     |

About 1,400 a month across a dozen near-identical phrasings, at a difficulty
that is essentially zero. This is one article, and it is the one that converts,
because the honest answer is _measure it twice and compare_ — which is the
product.

**Stages is the second-biggest cluster, and it wants pictures.**

| Keyword                          | Volume | KD     |
| -------------------------------- | ------ | ------ |
| canker sore stages               | 2,400  | 30     |
| stages of canker sores           | 1,000  | **20** |
| canker sore healing stages       | 1,000  | 30     |
| stages of a canker sore pictures | 1,000  | 39     |
| stages of a healing canker sore  | 480    | 28     |
| stages of a canker sore          | 390    | 31     |
| healing stages of a canker sore  | 320    | **20** |
| canker sore timeline             | 110    | 23     |

Roughly 8,000 a month at KD ~28. The `pictures` intent is a gift rather than a
problem: we cannot ethically stage photographs of strangers' mouths, but we can
draw the day-by-day progression in the product's own visual language, which is
more legible than a photo and is an asset other sites will hotlink.

**Recurrence is where the long-term users are.**

| Keyword                                              | Volume | KD  |
| ---------------------------------------------------- | ------ | --- |
| chronic canker sores                                 | 1,000  | 32  |
| multiple canker sores at once                        | 1,000  | 28  |
| recurring canker sore                                | 720    | 46  |
| why do i keep getting canker sores in my mouth       | 720    | 33  |
| constant canker sores                                | 590    | 33  |
| why do i get so many canker sores                    | 590    | 41  |
| numerous canker sores at once                        | 480    | 31  |
| frequent canker sores                                | 390    | 40  |
| why do i keep getting canker sores every week        | 320    | 28  |
| recurring canker sore in the same spot (3 phrasings) | ~270   | ~29 |

About 6,000 a month. Someone searching _recurring canker sore in the same spot_
is describing a mouth map. They are also, unlike the acute searcher, someone
with a reason to keep a log for a year.

**Two ideas the data killed.** `mouth ulcer tracker app` returns no data at
all — the product category has no search demand, so the planned
"canker sore tracker apps" comparison page would rank for nothing. `canker
sore size` likewise returns nothing; `how big do canker sores get` and
`canker sore large` (1,300, KD 43) exist, but a millimetre-ruler tool has no
query behind it. **The ruler tool is demoted out of Phase 1.** Nobody is
looking for our tools. They are looking for an answer to a question about time,
and the tools belong inside those answers.

**UK is a separate, smaller, harder market.** `how long do mouth ulcers last`
is 390 in the US but 1,300 in the UK, 3,100 globally, at KD 47 — the NHS owns
it. Write US-first with _canker sore_ as the primary term, use _mouth ulcer_ as
a synonym in the body so the page is eligible either way, and do not build a UK
cluster until the US one is working.

## Round two of the keyword data (2026-09-17, after Phase 1 shipped)

Method, so the numbers are reproducible: Semrush Keyword Magic, US database,
phrase-match exports for `canker sore`, `canker sores`, `mouth ulcer` and
`mouth sores` — 34,003 unique keywords, 2.2M monthly searches — bucketed by
regex locally rather than eyeballed off page one. Cluster totals below are the
**sum of every phrasing in the bucket**, and the figure that matters is the
volume sitting at KD ≤ 35, because the rest is Cleveland Clinic's. Buckets
overlap where the queries do (a `canker sore vs cold sore on tongue` is in two
of them). Semrush's phrase-match export silently drops some phrasings, so the
braces numbers below are read off the broad-match screen instead.

| Cluster                     | Total/mo | Weighted KD |  At KD ≤ 35 |
| --------------------------- | -------: | ----------: | ----------: |
| treatment / get rid of      |  464,000 |          40 |     130,000 |
| **cold sore & herpes**      |  121,000 |      **28** | **106,000** |
| location: tongue            |  176,000 |          49 |       4,000 |
| location: throat / tonsil   |   70,000 |          33 |      39,000 |
| location: gum               |   62,000 |          40 |      12,000 |
| location: lip               |   59,000 |          44 |      12,000 |
| stages / pictures           |   45,000 |          43 |       9,000 |
| duration (how long)         |   33,000 |          28 |      26,000 |
| recurrence / same spot      |   19,000 |          35 |      11,000 |
| size (big / getting bigger) |   14,000 |          46 |       1,400 |
| healing signs               |   10,000 |          33 |       5,500 |
| vitamin / deficiency        |    9,400 |          24 |       7,600 |
| kids / toddlers             |    8,700 |          28 |       3,700 |
| stress / anxiety            |    6,000 |          30 |       4,700 |
| braces / retainers          |    5,500 |     **0–6** |       5,500 |
| won't heal / won't go away  |    4,600 |          37 |       1,800 |
| pregnancy / hormonal        |    1,300 |          16 |         800 |
| tracker / app / log         |        0 |           — |           0 |

Six things fall out of that table.

**Cold sore versus canker sore is four times the duration cluster and just as
soft.** 121,000 a month, weighted KD 28, and 106,000 of it at KD ≤ 35 — the
largest winnable thing found so far.

| Keyword                                   | Volume | KD     |
| ----------------------------------------- | ------ | ------ |
| cold sore vs canker sore vs fever blister | 22,200 | 34     |
| canker sore vs cold sore                  | 18,100 | **24** |
| cold sore vs canker sore                  | 9,900  | **20** |
| cold sore versus canker                   | 9,900  | 32     |
| are canker sores herpes                   | 6,600  | 34     |
| canker sore vs herpes                     | 4,400  | **18** |
| is canker sore herpes                     | 3,600  | 30     |
| difference between cold sores and canker  | 2,400  | 26     |

It is winnable for the same reason it is publishable without a clinician: the
distinction is **definitional, not clinical.** Where the sore is, whether it
blistered first, whether it is contagious — those are facts about two named
conditions, not a diagnosis of the reader. The existing off-limits rule already
carved this page out; the data says it should be the next thing written.

**The herpes half is a different reader from the cold-sore half.** `canker sore
vs cold sore` wants a comparison table. `are canker sores herpes` and `is
canker sore herpes` — 10,000 a month between them — want a straight no in the
first sentence and a reason to believe it. Same facts, different first forty
words, so it is two pages rather than one.

**The throat and tonsil sub-cluster is the cheapest large location target.**
70,000 a month, 39,000 of it at KD ≤ 35: `canker sore in throat` 4,400 at KD
30, `canker sore on tonsil` 3,600 at KD 19, `canker sore tonsillitis` 2,400 at
KD 18, and another 6,000 across `back of throat` phrasings at KD 15–29. It is
cheap because it is awkward: an ulcer on a tonsil frequently is not aphthous,
so the honest page is mostly about what else is back there and when to stop
guessing — and that is a page we can write, because it makes no claim about the
reader beyond "this one is worth showing someone".

**The gum tail is nearly free, and it is the same-spot story.** The head terms
are locked (`canker sore on gum` 22,200 at KD 39, `canker sore on gums` 6,600
at KD 51) but the near-tooth phrasings are not: `canker sore on gum line` 1,300
at **KD 13**, `canker sore on gum by tooth` 390 at KD 17, `canker sore gum
above tooth` 320 at **KD 11**, `canker sores along gum line` 320 at KD 23.
Every one of those is somebody describing a place and a tooth, which is the
mouth map and the mechanical branch of article 4.

**Tongue and lip stay off the list.** Tongue is the biggest location bucket by
far — 176,000 a month — and almost none of it is reachable: weighted KD 49, and
only 4,000 at KD ≤ 35, most of that being cold-sore comparisons that the round-
two pages will pick up anyway.

**Braces are the only free cluster on the board.** Roughly 5,500 a month at
**KD 0–6**: `canker sore and braces` 480, `braces and mouth ulcers` 480,
`canker sore from braces` 320, `braces mouth sores` 320, `ulcers from braces`
320, `can braces cause canker sores` 210, and thirty more phrasings under 300,
almost all at KD 0. Nothing else found is that cheap.

**Two clusters are deliberately left on the table**, and the numbers are here
so that the decision stays a decision rather than an oversight. Treatment is
464,000 a month and includes the single cheapest keyword in the corpus —
`mouthwash for canker sores`, 3,600 at KD 19. Vitamin and deficiency queries
are 9,400 a month at a weighted KD of 24. Both are one page each and a week's
work, and both require recommending a product or a dose. They stay off-limits
while there is no clinician on the byline; the log-what-you-tried framing is
not a loophole and should not be used as one.

## Phase 1 — the four articles that carry the site

Written in this order. Each is a genuine answer with an interactive piece
embedded in it, not a landing page with a widget bolted on.

**1. How long a canker sore actually lasts, day by day.** — shipped
Target: `how long do canker sores last` and its forty variants, ~25,000/mo,
KD ~25. Fifty-word answer at the top with the day range in it. Then the day-by-
day course, what each day feels like, what changes the number, and the point at
which the duration stops being normal. Embed the **healing-timeline estimator**
here — day of onset plus current size in, typical remaining course out — because
the calculator is the thing the SERP does not have and the forums block says
people want. `FAQPage` markup for the sub-phrasings.

**2. How to tell whether a canker sore is healing.** — shipped
Target: the twelve "is it healing" phrasings, ~1,400/mo, KD ~16–40. The honest
answer is that a single look tells you nothing and the comparison is the whole
method: same spot, same light, width in millimetres, twice, two days apart. That
is the article and it is also the pitch. Highest conversion rate on the site by
some distance — it ends with the reader needing a second measurement.

**3. The stages of a canker sore, drawn.** — shipped
Target: the stages cluster, ~8,000/mo, KD ~28. Original day-by-day illustrations
in the product's visual language — prodrome, ulceration, peak, granulation,
healed — each with the size and pain the product would record. Competes on the
`pictures` intent without photographing anyone. Make the diagram set
embeddable; a linkable asset is worth more here than the ranking.

Shipped as `/blog/canker-sore-stages`, with the set also served standalone at
`/diagrams/canker-sore-stages.svg` and an embed snippet on the page. The snippet
is an `<img>` inside an anchor rather than an iframe, since an iframe is not a
link and the link is the reason to give the drawings away.

**4. Why you keep getting them in the same spot.** — shipped
Target: the recurrence cluster, ~6,000/mo, KD ~33. Framed as pattern-finding
rather than cause-claiming, which is both what we can defend without a clinician
and what the mouth map literally does. Ends at the trigger and treatment lists
in `utils/day-log.ts`, and at a dentist for anything systemic.

Shipped as `/blog/why-do-i-keep-getting-canker-sores`. Its spine is a split the
cause lists never make: sores in one fixed spot are reporting a _place_ and
have a mechanical explanation a dentist can find, while sores anywhere are
reporting a _time_ and need the three days before each one. Two mouth maps
side by side make the distinction in one glance, and a two-question widget
sends the reader down whichever branch is theirs. That is pattern-finding, not
cause-claiming, and it is the only article of the four whose answer requires a
year of logging rather than a week of it.

Around these, as volume justifies it: _day 7 and it is still there_, _two weeks
and no better — what a dentist will ask you_ (this one mirrors the nudge the app
already shows and is the safest high-intent page on the site), _do canker sores
get worse before they get better_, and the SLS-toothpaste elimination test.

**Off-limits, permanently, until there is a clinician on the masthead:** the
`canker sore treatment` head term and everything under it, medication
comparisons, supplement dosing, anything about oral cancer, anything phrased as
diagnosis. We may describe what the app records about a treatment someone tried;
we do not recommend one. The one near-diagnostic page worth having is _canker
sore or cold sore_ — the distinction is definitional, not clinical — and it must
end at "see a dentist".

Every article: a fifty-word direct answer under the H1, a `Article` schema with
real `datePublished`/`dateModified`, a maintained "last reviewed" date,
question-shaped H2s matching the actual phrasings above, an explicit _this is a
log, not medical advice_ line, and a link to whichever tool belongs with it.

## Phase 1.5 — the next six pages, in order

Numbered on from Phase 1. Each entry says what it targets, what makes it ours,
what it must not say, and how it earns a reading rather than a visit.

**5. Canker sore or cold sore — the whole difference in one table.** — shipped
Target the comparison half of the cluster: `canker sore vs cold sore` (18,100,
KD 24), `cold sore vs canker sore` (9,900, KD 20), `cold sore vs canker sore vs
fever blister` (22,200, KD 34). Three facts do all the work and belong in the
first forty words: a canker sore is inside the mouth on soft tissue, a cold sore
is on the lip border or outside it; a cold sore blisters before it breaks and a
canker sore never does; a cold sore is contagious and a canker sore is not. Then
the table, then the drawing.

The asset is a **side-by-side illustration** in the stage diagrams' visual
language — the `pictures` and `photos` phrasings are about 1,000 a month on
their own, and the same trick applies: we cannot photograph strangers' mouths
but we can draw the two side by side more legibly than a photo. Serve it
standalone the way `/diagrams/canker-sore-stages.svg` is served, with the same
`<img>`-inside-an-anchor embed snippet.

Conversion is this page's weakness and must be designed for: the reader wants an
identification and then leaves. The close is the one sentence no competitor can
write — if it is a canker sore, it has a 7-to-14-day course, and here is the
first measurement — linking up to article 1 and into the timeline estimator.
Ends at a dentist for anything recurring on the lip border, and never names an
antiviral.

**6. Are canker sores herpes? No — here is how to be sure.** — shipped
Same facts, different reader: `are canker sores herpes` (6,600, KD 34),
`canker sore vs herpes` (4,400, KD 18), `is canker sore herpes` (3,600, KD 30),
plus the `herpes vs canker sore in mouth` tail. This one is asked at midnight by
someone frightened, so the answer is the first sentence: no — canker sores are
not caused by a virus and are not contagious — and the rest of the page is why
that is true and what would make it worth testing rather than reading. The
hardest guardrail on the site: no claim about anybody's HSV status, no symptom
checklist that reads as a test, and it ends at a clinician in plain words.
Written second because it shares the drawing and the research with page 5.

Shipped as `/blog/canker-sore-vs-cold-sore` and
`/blog/are-canker-sores-herpes`, sharing one drawing:
`/diagrams/canker-sore-vs-cold-sore.svg`, served standalone with the same
`<img>`-in-an-anchor embed snippet as the stage strip. The palette both diagram
sets use moved to `components/marketing/diagrams/palette.ts` so a page showing
both does not read as two illustrators. The lip is separated from the skin
around it by value rather than hue, because a pink lip would be the first thing
on the site to break the rule that red is data.

Two things came out differently from the plan. The comparison page leads with
three questions rather than the table, because the table is the reference and
the questions are what somebody in front of a mirror can actually act on. And
the herpes page carries the exception the reassuring version would have left
out — a first herpes infection genuinely can put ulcers inside the mouth, with
fever — because a page that is only reassuring is wrong for the reader it is
most important to, and the honest version is also the one that ends at a
clinician without it feeling like a hedge.

**7. The mouth-map location hub.** — hub and gum page shipped
One page per site in the mouth, each answering the same three questions in the
same order — what is there, what rubs it, and what a sore there typically does —
and all of them linking into the signed-out mouth map and to each other. Order
by cost, not by size:

- **Gums first.** `canker sore on gum line` (1,300, KD 13), `canker sore gum
above tooth` (320, KD 11), `canker sore on gum by tooth` (390, KD 17),
  `canker sores along gum line` (320, KD 23). A sore against a specific tooth
  is the mechanical branch of article 4, and the useful thing to say is which
  tooth to ask a dentist to run a fingernail along.
- **Throat and tonsil second** — drafted 2026-09-19, not published. The big
  one: 70,000 a month with 39,000 at KD ≤ 35. Lead with the fact that changes the reader's afternoon — an ulcer on
  a tonsil is often not a canker sore — then what else it could be in one
  sentence each, then the threshold for going in. This is the page on the site
  most likely to be wrong in a way that matters, so it is the one page in
  Phase 1.5 worth having a dentist read before it ships.

  It is written and routed at `/blog/canker-sore-in-throat`, and it is
  **unpublished**: `draft: true` in the registry keeps it out of the sitemap,
  the article index and `llms.txt`, and the page serves `noindex`. Nothing on
  the site links to it, including the mouth map's own back-of-mouth entry. It
  carries a banner with the five questions the review has to answer — whether
  the lead claim about the tonsil is right, whether leaning on "a canker sore
  does not cause a fever" as the dividing line is safe to hand someone,
  whether the same-day red-flag list is right, whether the what-else-it-could-be
  list describes without diagnosing, and whether three weeks is the right
  persistence threshold on a site that uses two weeks everywhere else. That
  last one is a genuine inconsistency and the review should settle it rather
  than paper over it.

  The page deliberately has no interactive piece. A widget taking symptoms and
  returning a likelihood would be the only thing on the site that reads as a
  diagnosis, so the conversion is the ordinary one: if it turns out to be a
  canker sore, it has a course, and today's look tells you nothing without a
  second one.

  The draft mechanism is worth keeping: `PUBLISHED_ARTICLES` is what the
  sitemap, the index and `llms.txt` read, `ARTICLES` is what resolves a page,
  so any future page needing review has somewhere to live that is a page
  rather than a diff.

- **Roof of the mouth and inside the cheek** as one page each once the first
  two rank, on the same template.
- **Tongue and lip last or never** at KD 49 and 44.

The hub is also where Phase 2 pays off first: per-site medians and per-site
recurrence rates turn each of these pages from a description into a number
nobody else has.

Shipped 2026-09-19: `/mouth-map` as the hub and `/blog/canker-sore-on-gum` as
the first spoke. The hub is the app's own artwork and the app's own zone
hit-testing with writing attached to each site instead of a sore, so a site
described there is a site somebody can actually plot a point on; a test asserts
that every zone the geometry can return has copy, because the failure mode is a
place you can tap with nothing to say about it. Every site's text is in the HTML
at once with the unselected panels hidden, which is what makes an interactive
page crawlable and also what makes it work before the JavaScript arrives.

Three things came out differently from the plan. Choosing a site _is_ choosing a
view — a separate view control is a control the reader has to understand before
they can ask their question. The interactive piece on the gum page is not the
map but a two-question narrowing of _which teeth to feel_, because the doc's
own note — which tooth to ask a dentist to run a fingernail along — turned out
to be the whole page, and the map is one link away. And the honest first fact
about the gum is that a sore there is less likely to be aphthous at all, since
gum is keratinised and bound to bone: that reframing is what makes the page
defensible without a clinician, because it ends in "which tooth" rather than
"what is wrong with you".

Four sites now carry a threshold rather than a course — gum swelling and
throbbing, swelling under the tongue, the same-spot cheek, and the back of the
mouth. The back-of-mouth entry deliberately says the sore may well not be a
canker sore and stops there, so the hub does not pre-empt the throat page it
cannot yet write.

**8. Two weeks and it is still there.** — shipped
4,600 a month, weighted KD 37, and the safest high-intent page on the site:
`canker sore won't go away` (590, KD 30), `canker sore won't heal` (210, KD 28),
`mouth ulcer won't heal` (210, KD 21), `why do canker sores take so long to
heal` (110, KD 29). It mirrors the nudge the app already shows at two weeks, and
its whole job is to be the page that tells someone to go in, with the log as
the thing they bring. Write it as the terminal page of the duration article —
linked down from it, not competing with it for the same phrasings.

Shipped as `/blog/canker-sore-wont-go-away`. The page turned on a distinction
the brief did not name: _still there_ and _not healing_ are different
situations that feel identical from the inside, and nearly every reader
arriving at day fourteen cannot say which one they are in. So the widget's
default branch is "I have not measured it" — the honest answer for most
arrivals, and the only one whose output is a method rather than a verdict.
Its other branches emit a threshold and the sentence to arrive with, never a
guess at what a long-lasting sore might be; the three-week line is the page's
only firm claim. The duration article now links down to it from its own
too-long section, as planned.

**9. Stress, and what a log can and cannot prove.** — shipped
6,000 a month at a weighted KD of 30: `stress and canker sores` (880, KD 32),
`can stress cause canker sores` (590, KD 31), `does stress cause canker sores`
(480, KD 25), `canker sores and stress` (320, KD 19). A causes query, which we
do not answer as a causes query. The honest answer is that no article can tell
you whether stress caused yours, and that the question is answerable only across
ten sores and the three days before each — which is the `day_logs` trigger list
doing exactly what it is for. Highest product fit of any page in Phase 1.5
after the mouth map.

Shipped as `/blog/stress-and-canker-sores`, and the embedded piece is the one
argument no other page on this keyword makes: a tally only means something
against a base rate. With three stressful days in a typical week, about 78% of
three-day windows contain one, so "stress preceded four of my five sores" is
slightly _less_ than what no association looks like. The widget defaults to
exactly that disappointing case, because loading it with a flattering default
would make it an agreement machine — and agreeing cheaply is what every other
page here already does. The arithmetic lives in
`components/marketing/trigger-evidence.ts` with unit tests, since the page's
whole credibility rests on it being right; it assumes independent days, which
is conservative, and the page says so.

**10. The cheap tails, batched.** — both shipped
Small enough that they are a day each, and worth having because they are nearly
unclaimed: the hormonal-cycle pattern (`canker sore period` 90 at KD 17,
`hormonal canker sores` 90 at KD 14, `canker sores during period` 110 at KD 31 —
about 1,300 a month at KD 8–18, and a cycle correlation is precisely the thing a
year of logging finds and an article cannot), and `canker sore bigger` /
`canker sore keeps getting bigger` (~1,000 a month at KD 25–32), which is the
size question the ruler tool was demoted for — it belongs here, inside a page
about whether growing on day three is normal, and not as a tool page.

Both shipped, and both text-only apart from one reused component, which is
what kept them to a day each. `/blog/canker-sores-and-your-period` leans on
the one thing that makes the cycle unlike every other trigger: it comes with
dates already attached, so three or four cycles of subtraction settle it where
memory cannot. It names the confound rather than selling the correlation — the
premenstrual week also carries worse sleep, more stress and a clenched jaw, so
a sore landing in it has said _when_ and not _which_.
`/blog/canker-sore-keeps-getting-bigger` embeds the existing `HealingCheck`
rather than a new widget, because the two-measurement comparison it already
makes is exactly the size question, and it hands off to the two-week page when
the numbers come back unchanged.

**Still off-limits, unchanged:** treatment and its 464,000 a month, medication
and mouthwash comparisons, supplement and vitamin dosing, anything about oral
cancer, anything phrased as a diagnosis of the reader, and the kids' clusters
whose volume is nearly all `treatment for kids`.

## Landing pages: the article is the landing page

Worth stating plainly, because "SEO landing pages" usually means a set of thin
pages aimed at the product category, and here the data says that category does
not exist. Across 34,003 keywords there is **one** tracker-or-app phrasing and
it has zero volume. A `/canker-sore-tracker-app` page, a `/features` page or a
comparison-of-trackers page would rank for nothing, be crawled as filler, and
convert nobody. They should not be built.

What replaces them:

- **Every article carries the conversion.** The interactive piece goes in the
  body where the question is asked, usable with no account; one start button
  sits immediately after it, while the reader is holding a number, rather than
  at the bottom of 1,200 words; and the page closes on what it cannot tell them
  that a second measurement can.
- **`/mouth-map` is the one real landing page** — live since 2026-09-19: the
  signed-out, interactive mouth map as the hub of cluster 7, and the single URL
  a Reddit answer, a TikTok caption or an App Store description can point at
  without pitching. It is in the sitemap at 0.9, above `about`, and it is the
  only marketing page that is not an article.
- **The store listings are landing pages** in their own search surfaces, and
  take the same keyword work in the title and subtitle.
- **The home page stays a product page.** It cannot win `canker sore` at KD 52
  and should not try; turning it into an article page would cost the one clear
  call to action and gain nothing.

Internal linking, so the cluster reads as one thing rather than nine: the
duration article is the hub for everything about time, the mouth map is the hub
for everything about place, each spoke links up to its hub and sideways to its
siblings, and every page points at exactly one tool — the one that answers the
question that page is about.

Cadence at solo scale: one page a fortnight, which puts Phase 1.5 at about three
months. `dateModified` moves only when the body actually changes, and the
"last reviewed" line only when someone has genuinely re-read it. Once Search
Console has 28 days of data on a page, read that page's own query list before
writing the next one — the site's own impressions are better evidence than any
estimate in this document.

## Phase 2 — the data flywheel (month 4 onward)

This is the part that no competitor and no AI summariser can copy, and it is
the reason to be patient through Phase 1.

Once there is a defensible volume of readings, publish a standing, versioned
page — `/data/canker-sore-healing` — carrying the aggregate figures the
`readings` table already supports: median days to heal, the mean size curve by
day, pain peak by day, the distribution of sites across the mouth map, and how
often a sore at a given site recurs there.

Requirements, non-negotiable: aggregate only, a stated minimum n before any
figure is published, no free-text notes, no per-user anything, a plain
methodology section, and a line in `app/(marketing)/privacy/page.tsx` saying
anonymised aggregates may be published before a single figure goes out.

Then the figures get reused everywhere — cited in our own articles, offered to
journalists, and quotable in one sentence. "Canker Core's data from N tracked
sores puts the median at X days" is a sentence an answer engine can lift whole,
with attribution, which is precisely the unit AEO rewards.

## AEO — being the answer, not the tenth blue link

Answer engines resolve a question from a handful of sources, so the job is to
be easy to extract and worth extracting.

- **Be crawlable by them.** The robots rules in Phase 0 are the entry ticket;
  blocking `GPTBot` to protect content is the one unforced error here.
- **Be in Bing.** ChatGPT search and Copilot read it. Submit the sitemap.
- **Answer first.** One self-contained paragraph under each heading that makes
  sense lifted out of context, with the qualifier inside it, not two
  paragraphs later.
- **Carry a number.** Pages with a specific figure and a stated source get
  quoted; pages of adjectives do not. This is what Phase 2 is for.
- **Publish `/llms.txt`** — done: a plain-text map of the pages, each with the
  fifty-word answer it leads with, built from the article registry. Its "facts
  worth quoting" list only carries claims an article on the site actually
  establishes, since the whole value of being quoted is that the quote is
  checkable.
- **Keep the markup boring.** Server-rendered text, real headings, real
  tables. Phase 0 task 8 matters here too.
- **Be nameable.** The goal is an answer engine writing "apps like Canker Core
  let you log size and pain daily" in response to _how do I track a mouth
  ulcer_. Get the name next to the category, repeatedly, in places that get
  crawled: the tool pages, a Product Hunt launch, r/cankersores and
  r/Behcets answers that are genuinely useful first, an App Store listing
  whose description uses the same phrasing.

## Distribution, at solo scale

SEO is slow and the data flywheel needs users before it can spin, so the first
readings have to come from somewhere else.

- **Reddit** — r/cankersores, r/Behcets, r/braces, r/Sjogrens. Answer, do not
  post. A tool link inside a genuinely helpful answer is fine; anything else
  gets the domain banned, which is unrecoverable.
- **App Store and Play Store listings** are search surfaces in their own
  right, and the same keyword work applies to the title and subtitle.
- **TikTok/Shorts** — the mouth map filling in over seven days is a
  fifteen-second video and the single most demonstrable thing the product does.
- **One launch**, on Product Hunt, once the tools are live rather than now.

## What to measure

Weekly, five numbers, nothing else: impressions in Search Console, clicks,
signups, **first readings logged**, and referring domains. The one that decides
whether the strategy is working is first-readings-per-thousand-impressions,
because it is the only one that says the traffic was the right traffic.

Two clarifications the day-one baseline forces. Referring domains means links
from sites a person would recognise, counted by hand — the 195 Semrush reports
are scraper noise and will keep growing on their own, so the metric has to
ignore them or it will look like progress. And impressions get read per
cluster, not per site: nine pages aimed at five clusters can only be judged by
which cluster moved.

Checkpoints: by month 3, every Phase 1 page indexed and ranking for its long
tail, and Phase 1.5's first two pages live. By month 6, one article on page one
of its cluster, the cold-sore drawing embedded somewhere we did not ask for,
and the data page published. By month 12, the data page cited by a site we did
not ask, and a first AI-visibility mention against zero on day one.

## Ordering, if only one thing happens at a time

Items 1 to 5 are done or in the build; the live list starts at 6.

1. ~~Ship the Phase 0 build~~, then confirm `/robots.txt` and `/sitemap.xml`
   answer on the real domain and carry `cankercore.com` URLs.
2. Search Console and **Bing** — still open, still the thing that decides
   whether the next six months produce evidence. Nothing below is measurable
   without it.
3. ~~Blog infrastructure, then _how long a canker sore actually lasts_.~~
4. ~~_How to tell whether a canker sore is healing_.~~
5. ~~The stage diagrams.~~
6. ~~Redirect the sslip staging host.~~ Resolved a different way: as of
   2026-09-18 it answers 404 over HTTP and 503 over TLS, so it is no longer a
   competing copy. A 301 to the canonical domain would still be tidier if the
   host is ever wanted again.
7. ~~_Canker sore or cold sore_ with the side-by-side drawing, then _are canker
   sores herpes_ on the same research.~~ Both shipped 2026-09-18, with the
   drawing served standalone as the site's second embeddable asset.
8. ~~`/mouth-map` signed out, then the gum page~~ — both shipped 2026-09-19,
   the hub first so the spoke had somewhere to link. The **throat page is
   drafted and waiting on a dentist**, unpublished at
   `/blog/canker-sore-in-throat`; publishing it is a review, not a writing
   task.
9. ~~`/llms.txt`~~ (shipped, generated from `content/articles.ts` so it cannot
   drift from the sitemap), and the analytics goal on _first reading logged_
   rather than signup — still open, and a prerequisite for reading anything
   above.
10. ~~_Two weeks and it is still there_, then _stress_, then the cheap
    tails.~~ All four shipped 2026-09-17, which completes the writing in Phase
    1.5. What remains in it is not a writing task: the **throat page's
    clinical review**, and the two lower-priority mouth-map spokes — roof of
    the mouth and inside the cheek — which were always gated on the gum page
    ranking first.
11. The data page, the moment the numbers are honest — and it upgrades the
    mouth-map spokes the same week it lands.
