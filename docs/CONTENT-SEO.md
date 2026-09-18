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

We cannot out-authority a medical publisher on *what a canker sore is*. We can
own a space none of them want, which is **the course of one sore over time**.
Every big health page answers "what is it and what do I do". Almost nobody
answers "it is day 9, is this normal, is mine actually shrinking". That is the
question a person with an active ulcer types at 11pm, it is the question the
product exists to answer, and the searcher is by definition mid-episode — the
only moment when starting a tracking log makes sense.

Two assets follow from that, and they are the whole moat:

1. **Interactive tools that answer the question on the page**, without an
   account. The mouth map and the severity ramp already exist as components.
2. **First-party aggregate data.** Once there are a few hundred sores in
   `readings`, we can publish the median days-to-heal, the size curve by day,
   the distribution of sites in the mouth. Nobody else has that. It is the one
   thing on this site a Mayo Clinic page might link to, and the one thing an
   answer engine has no substitute for.

## Phase 0 — technical foundations

`cankercore.com` went live on 2026-09-17. Items 3–8 below are implemented in
the repo but **not yet deployed** — the site serves whatever image the
registry tag points at, so none of this is live until a build ships.

| # | Task | Status |
|---|---|---|
| 1 | `cankercore.com` serving over TLS | **done** |
| 2 | `canker.46.224.227.119.sslip.io` still answers 200 with the full site. Two hosts serving identical pages splits every signal between them — point the staging host at a 301 to the canonical domain in Coolify/Traefik, or take its domain off the app | **open — server side, needs you** |
| 3 | `NEXT_PUBLIC_SITE_URL` must be `https://cankercore.com` in the *build*, not just the runtime env. The prerendered pages bake absolute URLs from it; the documented build command passed an empty string | fixed in `docs/DEPLOYMENT.md`, verify at next build |
| 4 | `robots.txt` — allows all, disallows the session-gated paths, names the answer-engine crawlers explicitly, points at the sitemap | `app/robots.ts` |
| 5 | `sitemap.xml` — the four public pages, ready to take articles | `app/sitemap.ts` |
| 6 | Canonical URLs on every public page, plus Open Graph and Twitter cards | `app/layout.tsx`, marketing pages |
| 7 | Generated share card, 1200×630 | `app/opengraph-image.tsx` |
| 8 | JSON-LD: `Organization` and `WebSite` sitewide, `SoftwareApplication` on the home page with `price: 0` — the fact most worth being quoted on | `components/seo/JsonLd.tsx` |
| 9 | Marketing pages made statically prerenderable. `Navbar` resolved the session on the server, which forced the entire marketing group dynamic; it now resolves in the browser and the signed-out header is what a crawler gets | `components/ui/Navbar/*`, `components/marketing/StartButton.tsx` |
| 10 | Blog infrastructure: `app/(marketing)/blog/[slug]` over MDX in `content/`, with a tag index. Articles as code, reviewed in a diff, not rows in the database | **open** |
| 11 | Google Search Console and **Bing Webmaster Tools**. Bing is not an afterthought — it is the index behind ChatGPT search and Copilot. Submit the sitemap to both | **open — needs you** |
| 12 | Analytics with a goal on *first reading logged*, not on signup | **open** |

Rule for every page from here: the honest answer appears in the first forty
words, above any preamble. That is what gets extracted — by a featured
snippet, by an AI overview, and by whatever reads the page next.

## Phase 1 — the tool pages (weeks 1–4)

Tools, not articles, because they are the fastest route from a search result
to a logged reading, and they attract links that a written page will not.

Each lives at a clean URL, works with no account, and ends in the same place:
*this was one measurement, the useful thing is the second one — here is where
to keep it.*

1. **`/tools/canker-sore-size`** — a 1:1 on-screen millimetre ruler plus
   photo-reference sizes, answering "how big is my canker sore". Solves the
   real problem that nobody owns a ruler at 11pm. Targets *canker sore size
   chart*, *how big is a canker sore*, *canker sore mm*.
2. **`/tools/healing-timeline`** — enter day of onset and current size, get
   the typical remaining course and the day at which it stops being typical.
   Targets the largest cluster we can realistically win: *how long do canker
   sores last*, *canker sore day 5*, *canker sore not healing*.
3. **`/tools/mouth-map`** — the existing `MouthMapHero` made interactive
   without a login: tap a spot, get the anatomical name and what recurs there.
   Targets *canker sore on gums / tongue / inside lip / roof of mouth*, which
   is a long tail of dozens of low-competition variants.
4. **`/tools/is-it-a-canker-sore`** — a decision tree that distinguishes
   aphthous ulcer from cold sore by the two facts a person can actually
   observe (inside vs. outside the mouth, blister vs. crater). This is the one
   near-diagnostic page worth having, because the distinction is definitional
   rather than clinical. It must end at "see a dentist", never at a treatment.

Every tool page carries `SoftwareApplication` or `HowTo` JSON-LD, a short
written explainer beneath it so there is text to index, and an embed snippet —
an `<iframe>` other sites can paste — because an embed is a link we do not
have to ask for.

## Phase 2 — the article clusters (months 2–6)

One post a week is enough. Two clusters, and a firm boundary.

**Cluster A — duration and course (the money cluster).** Everything here is
observational and framed in time, which is exactly where a tracking app has
standing to speak.

- How long a canker sore actually lasts, day by day
- Day 7 and it is still there — what that does and does not mean
- The four stages of a mouth ulcer, and what each one looks like
- How to tell whether a canker sore is healing or getting worse
- What a normal size curve looks like (built on our own data — see Phase 3)
- Two weeks and no better: what a dentist will ask you *(mirrors the nudge the
  app already shows, and is the safest high-intent page on the site)*

**Cluster B — patterns and triggers (the retention cluster).** These match the
`day_logs` trigger and treatment lists in `utils/day-log.ts` one to one, which
means every article ends at a feature rather than at a CTA.

- Keeping a canker sore trigger diary, and what to record
- SLS toothpaste: how to run a proper elimination test on yourself
- Braces, dentures and a sore in the same place every time
- Stress, sleep and recurrence — how to see it in your own log
- Recurrent aphthous stomatitis: tracking episodes over a year
- What to bring to a dentist about recurring ulcers

**Off-limits, permanently, until there is a clinician on the masthead:** what
cures a canker sore fastest, medication comparisons, supplement dosing,
anything about oral cancer, anything phrased as diagnosis. We may *describe*
what the app records about a treatment someone tried; we do not recommend one.

Every post: a fifty-word direct answer under the H1, a "last reviewed" date we
actually maintain, an explicit *this is a log, not medical advice, see a
dentist if X* line, question-shaped H2s, and a link to the relevant tool.

## Phase 3 — the data flywheel (month 4 onward)

This is the part that no competitor and no AI summariser can copy, and it is
the reason to be patient through phases 1 and 2.

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
  quoted; pages of adjectives do not. This is what Phase 3 is for.
- **Publish `/llms.txt`** — a plain-text map of the site's pages and what each
  answers.
- **Keep the markup boring.** Server-rendered text, real headings, real
  tables. Phase 0 task 8 matters here too.
- **Be nameable.** The goal is an answer engine writing "apps like Canker Core
  let you log size and pain daily" in response to *how do I track a mouth
  ulcer*. Get the name next to the category, repeatedly, in places that get
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
2. The size ruler tool, because it is the smallest thing that is genuinely
   useful to a stranger.
3. Search Console and Bing, so the next six months produce evidence.
4. The healing-timeline tool and the duration cluster.
5. The data page, the moment the numbers are honest.
