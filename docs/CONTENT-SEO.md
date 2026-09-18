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

`cankercore.com` went live on 2026-09-17. Items 3–8 below are implemented in
the repo but **not yet deployed** — the site serves whatever image the
registry tag points at, so none of this is live until a build ships.

| #   | Task                                                                                                                                                                                                                                                   | Status                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| 1   | `cankercore.com` serving over TLS                                                                                                                                                                                                                      | **done**                                                         |
| 2   | `canker.46.224.227.119.sslip.io` still answers 200 with the full site. Two hosts serving identical pages splits every signal between them — point the staging host at a 301 to the canonical domain in Coolify/Traefik, or take its domain off the app | **open — server side, needs you**                                |
| 3   | `NEXT_PUBLIC_SITE_URL` must be `https://cankercore.com` in the _build_, not just the runtime env. The prerendered pages bake absolute URLs from it; the documented build command passed an empty string                                                | fixed in `docs/DEPLOYMENT.md`, verify at next build              |
| 4   | `robots.txt` — allows all, disallows the session-gated paths, names the answer-engine crawlers explicitly, points at the sitemap                                                                                                                       | `app/robots.ts`                                                  |
| 5   | `sitemap.xml` — the four public pages, ready to take articles                                                                                                                                                                                          | `app/sitemap.ts`                                                 |
| 6   | Canonical URLs on every public page, plus Open Graph and Twitter cards                                                                                                                                                                                 | `app/layout.tsx`, marketing pages                                |
| 7   | Generated share card, 1200×630                                                                                                                                                                                                                         | `app/opengraph-image.tsx`                                        |
| 8   | JSON-LD: `Organization` and `WebSite` sitewide, `SoftwareApplication` on the home page with `price: 0` — the fact most worth being quoted on                                                                                                           | `components/seo/JsonLd.tsx`                                      |
| 9   | Marketing pages made statically prerenderable. `Navbar` resolved the session on the server, which forced the entire marketing group dynamic; it now resolves in the browser and the signed-out header is what a crawler gets                           | `components/ui/Navbar/*`, `components/marketing/StartButton.tsx` |
| 10  | Blog infrastructure: `app/(marketing)/blog/[slug]` over MDX in `content/`, with a tag index. Articles as code, reviewed in a diff, not rows in the database                                                                                            | **open**                                                         |
| 11  | Google Search Console and **Bing Webmaster Tools**. Bing is not an afterthought — it is the index behind ChatGPT search and Copilot. Submit the sitemap to both                                                                                        | **open — needs you**                                             |
| 12  | Analytics with a goal on _first reading logged_, not on signup                                                                                                                                                                                         | **open**                                                         |

Rule for every page from here: the honest answer appears in the first forty
words, above any preamble. That is what gets extracted — by a featured
snippet, by an AI overview, and by whatever reads the page next.

## What the keyword data says

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
- **Publish `/llms.txt`** — a plain-text map of the site's pages and what each
  answers.
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

Checkpoints: by month 3, the tool pages indexed and ranking for their long
tail. By month 6, one article on page one of its cluster and the data page
published. By month 12, the data page cited by a site we did not ask.

## Ordering, if only one thing happens at a time

1. Ship the Phase 0 build, then confirm `/robots.txt` and `/sitemap.xml`
   answer on the real domain and carry `cankercore.com` URLs.
2. Search Console and Bing, so the next six months produce evidence.
3. Blog infrastructure, then _how long a canker sore actually lasts_ with the
   timeline estimator in it — the biggest, easiest cluster on the board.
4. _How to tell whether a canker sore is healing_, which is the same work
   again at a tenth of the difficulty and converts harder.
5. The stage diagrams, which are the linkable asset.
6. The data page, the moment the numbers are honest.
