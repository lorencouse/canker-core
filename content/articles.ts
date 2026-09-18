/**
 * The article registry.
 *
 * Articles are `page.mdx` files in their own route folder, so Next resolves
 * the routes; this list is what everything *else* needs — the index, the
 * sitemap, the JSON-LD, the "last reviewed" line. It is hand-maintained rather
 * than globbed off the filesystem so that adding an article is a deliberate
 * diff and the dates cannot drift to "whenever the build ran".
 *
 * `answer` is the direct answer the page leads with, repeated here because it
 * is also the meta description and the FAQ answer in the structured data.
 * Keep it under fifty words: it is what a featured snippet or an AI overview
 * lifts, and anything longer gets truncated mid-sentence.
 */
export type Article = {
  slug: string;
  title: string;
  /** The <title> and H1 can differ; this is the H1. */
  heading: string;
  answer: string;
  published: string;
  updated: string;
  /** Question-shaped headings this page is written to answer, for FAQ markup. */
  faqs?: Array<{ question: string; answer: string }>;
  /**
   * Written, routed, and not published: kept out of the sitemap, the index and
   * `llms.txt`, and served `noindex`. The one page in the plan that needs a
   * clinician to read it before it ships needs somewhere to be read, and a
   * file in a docs folder is not a page.
   */
  draft?: boolean;
};

export const ARTICLES: Article[] = [
  {
    slug: 'canker-sore-wont-go-away',
    title: 'A canker sore that will not go away',
    heading: 'Two weeks, and it is still there',
    answer:
      'Most canker sores close within 7 to 14 days. Past two weeks at the same width, or past three weeks at all, the useful move is an examination rather than another week of waiting \u2014 and two dated measurements are what make that appointment short.',
    published: '2026-09-17',
    updated: '2026-09-17',
    faqs: [
      {
        question: 'How long is too long for a canker sore?',
        answer:
          'Three weeks is the line worth treating as firm. Before that, the distinction that matters is not how long it has been there but whether it is measurably narrowing: a wide sore can take the full fortnight and a few days more while genuinely closing, and a sore that reads the same width on two dates a week apart is not on that course at all.'
      },
      {
        question: 'Why is my canker sore not healing?',
        answer:
          'The commonest reason is that it is healing and you cannot see it. A crater fills in from the edges by a millimetre or so a day, which is invisible to memory and obvious against a ruler. The next commonest is that something keeps reopening it \u2014 a tooth edge, a bracket, a denture rim, or a tongue that will not leave it alone \u2014 so the wound restarts rather than continues.'
      },
      {
        question: 'Why do canker sores take so long to heal?',
        answer:
          'Because a mouth ulcer is an open wound in tissue that is used several thousand times a day, kept wet, and disturbed by every meal. Healing is the crater filling in from its edges, so the time it takes is set mostly by how wide it got: filling a 10mm crater is more work than filling a 3mm one.'
      },
      {
        question: 'Should I see a dentist or a doctor about a mouth ulcer?',
        answer:
          'Either can look at it, and a dentist is usually quicker to get and better placed to find a sharp edge holding it open. A doctor is the better first call when there are ulcers elsewhere, several at once, a fever, a rash, or a change in how often you get them, because those are questions about the rest of the body rather than about the mouth.'
      },
      {
        question: 'What should I bring to the appointment?',
        answer:
          'The date you first felt it, the widest width you measured and the date you measured it, the width now, and where exactly it is. That is a thirty-second history that answers most of what will be asked, and it is the part nobody can reconstruct in the chair.'
      }
    ]
  },
  {
    slug: 'stress-and-canker-sores',
    title: 'Stress and canker sores: what a log can and cannot prove',
    heading: 'Stress, and what a log can and cannot prove',
    answer:
      'Stress is the most commonly reported trigger for canker sores, and no article can tell you whether it caused yours. That is answerable only across several sores, the three days before each, and how often your ordinary days are stressful too.',
    published: '2026-09-17',
    updated: '2026-09-17',
    faqs: [
      {
        question: 'Can stress cause canker sores?',
        answer:
          'Stress is the trigger people report most often, and it is the one most consistently associated with outbreaks in studies of recurrent aphthous ulcers. Association is not the same as cause, and neither is enough to tell an individual that stress is behind theirs \u2014 it makes stress a reasonable thing to test in your own record rather than an established explanation for your sores.'
      },
      {
        question: 'Why does stress seem to come before every one of mine?',
        answer:
          'Often because stressful days are common. If three days in a typical week are stressful, then roughly eight in ten three-day windows contain one, so almost any sore \u2014 whatever set it off \u2014 arrives after a stressful day. A tally only means something when it beats the rate you would get from your own calendar with no connection at all.'
      },
      {
        question: 'How long after stress does a canker sore appear?',
        answer:
          'Usually one to three days, which is what makes it so hard to spot from memory. The day the pain shows up is not the day that mattered, so the stressful stretch people blame is frequently the wrong one and the relevant day has already been forgotten.'
      },
      {
        question: 'Can reducing stress stop canker sores?',
        answer:
          'For some people fewer stressful stretches come with fewer sores, and there is no way to know in advance whether you are one of them. It is testable, though: a record of sores and days across several months shows whether your rate changed with your circumstances, which is a far better question than whether stress causes ulcers in general.'
      },
      {
        question: 'How many sores does it take to find a trigger?',
        answer:
          'Five at an absolute minimum and ten before it is worth believing, each with dates, and with the quiet days logged too. Without the days that had no sore, a trigger tally has nothing to be compared against and will confirm whatever you already suspected.'
      }
    ]
  },
  {
    slug: 'canker-sores-and-your-period',
    title: 'Canker sores and your period: do yours track your cycle?',
    heading: 'Canker sores and your cycle',
    answer:
      'Some people get canker sores at the same point in every cycle and most do not. It is one of the few trigger questions with a clean test, because cycle day is knowable for every sore \u2014 three or four cycles of dates settle what memory cannot.',
    published: '2026-09-17',
    updated: '2026-09-17',
    faqs: [
      {
        question: 'Can your period cause canker sores?',
        answer:
          'A minority of people who get recurrent canker sores get them in a consistent relationship to their cycle, most often in the week before a period. It is not the usual pattern, and the general finding does not tell you whether you are one of them \u2014 only your own dates do.'
      },
      {
        question: 'When in the cycle do they usually appear?',
        answer:
          'Where a pattern exists at all, it is most often in the luteal phase, the stretch between ovulation and the start of bleeding. What matters more than the phase is the consistency: the same few days of every cycle is a pattern, and scattered across different phases is not.'
      },
      {
        question: 'How do I tell whether mine follow my cycle?',
        answer:
          'Record the first day of each period and the day each sore first appeared, then count the days between them. Three or four cycles is usually enough to see it: if the gaps land within a few days of each other every time, that is a real pattern, and if they are spread across the cycle, the connection is not there.'
      },
      {
        question: 'Do hormonal contraceptives change them?',
        answer:
          'Reports go in both directions and there is no reliable general answer, which makes a starting or stopping date one of the more informative things to have in a log. A rate that changes clearly a couple of months either side of that date is the sort of before-and-after nothing else in this subject offers.'
      },
      {
        question: 'Is it the hormones or something else in that week?',
        answer:
          'That is the honest difficulty. The premenstrual week tends to carry poorer sleep, more stress and different eating along with the hormonal change, and a log that records those as well is the only way to see whether the cycle is doing the work or merely keeping company with whatever is.'
      }
    ]
  },
  {
    slug: 'canker-sore-keeps-getting-bigger',
    title: 'A canker sore getting bigger: when growing is normal',
    heading: 'It is getting bigger',
    answer:
      'Growing in the first three days is what canker sores do: they open, widen, then stop by about day four. Widening after that is the one size change worth acting on. Pain is not a size measurement \u2014 only two widths, two days apart, are.',
    published: '2026-09-17',
    updated: '2026-09-17',
    faqs: [
      {
        question: 'Is it normal for a canker sore to get bigger?',
        answer:
          'In the first three days, yes, and it is the single most common reason people decide something has gone wrong when nothing has. An ulcer opens as a small crater and widens as the surface breaks down around it, reaching its full size at roughly day three or four before it starts filling in from the edges.'
      },
      {
        question: 'When should I worry about a canker sore getting bigger?',
        answer:
          'When it is still widening after about day four, when it passes 10mm across, or when it is spreading rather than widening as one round sore. Those are worth an examination rather than another week of waiting \u2014 not because they are likely to be serious, but because they are outside the course this page describes.'
      },
      {
        question: 'How big do canker sores get?',
        answer:
          'Most stay under 5mm and close in about a week. Between 5mm and 10mm is still the ordinary minor kind, just wider, and usually takes 10 to 14 days. Over 10mm is the uncommon major kind, which is slower, can last weeks, and is worth showing to a dentist.'
      },
      {
        question: 'Why does it feel bigger than it looks?',
        answer:
          'Because pain tracks where a sore is far more than how wide it is. A 3mm ulcer where your teeth close on it hurts more than a broad shallow one on the inside of a cheek, and pain peaks in the first three days and fades well before the crater closes. Feeling worse and getting bigger are separate events that happen to overlap early on.'
      },
      {
        question: 'How do I know whether it is actually growing?',
        answer:
          'Measure the widest point in millimetres in decent light, write it down with the date, and measure again two days later. Eyeballing a sore against a ruler is good to about a millimetre, so a one-millimetre difference is noise and two millimetres is real. A single look tells you nothing in either direction.'
      }
    ]
  },
  {
    slug: 'canker-sore-in-throat',
    title: 'A sore at the back of the mouth, or on a tonsil',
    heading: 'A sore at the back of the mouth',
    answer:
      'An ulcer at the back of the mouth can be a canker sore, but one on a tonsil often is not. Canker sores favour the soft palate and the arches beside the tonsil, arrive without a fever, and close in 7 to 14 days. A fever changes the question.',
    published: '2026-09-19',
    updated: '2026-09-19',
    draft: true,
    faqs: [
      {
        question: 'Can you get a canker sore in your throat?',
        answer:
          'Yes, on the soft lining at the back of the mouth — the soft palate and the arches either side of the tonsil. That tissue is the movable, non-keratinised kind canker sores favour. A sore on the tonsil itself is a different matter, because the tonsil is not that tissue and the things that commonly affect it are infections rather than ulcers.'
      },
      {
        question: 'Is a white spot on my tonsil a canker sore?',
        answer:
          'Often it is not. White or yellow material sitting in the pits of a tonsil is usually either the coating of a throat infection or a tonsil stone, neither of which is an ulcer. An ulcer is a break in the surface — a crater with an edge. A coating wipes or lifts; a crater does not.'
      },
      {
        question: 'Is it a canker sore or tonsillitis?',
        answer:
          'Fever is the dividing line worth trusting. A canker sore is a local sore and does not cause a fever, swollen glands or feeling generally unwell. A throat infection usually does, and it usually affects both sides and the whole of swallowing rather than one identifiable spot.'
      },
      {
        question: 'How long should a sore at the back of the mouth take?',
        answer:
          'If it is a canker sore, the same 7 to 14 days as anywhere else, with the pain worst in the first three days. Anything at the back of the mouth that has not healed within three weeks should be looked at, whatever it looks like.'
      },
      {
        question: 'When should I see someone about a sore throat?',
        answer:
          'The same week for a fever, swollen glands, pain on swallowing, or pain on one side lasting more than a few days. The same day for trouble breathing or swallowing your own saliva, a muffled voice, drooling, severe pain on one side with difficulty opening your mouth, or a stiff neck.'
      }
    ]
  },
  {
    slug: 'canker-sore-on-gum',
    title: 'Canker sore on the gum line: which tooth to check',
    heading: 'A canker sore on the gum line',
    answer:
      'A sore sitting right on the gum is often not an ordinary canker sore. Gum is tough tissue bound down onto bone, and canker sores prefer lining that moves — so one there usually has something holding it there. Find the edge that touches it and the sore follows.',
    published: '2026-09-19',
    updated: '2026-09-19',
    faqs: [
      {
        question: 'Can you get a canker sore on your gums?',
        answer:
          'Yes, but it is the less usual place for one. The gum is keratinised tissue bound tightly to the bone, and ordinary aphthous ulcers favour the loose, movable lining of the inner lip and cheek. A sore on the gum is more often a spot where something keeps injuring the tissue — a tooth edge, a bracket, a denture clasp, hard brushing — than a canker sore arriving on its own.'
      },
      {
        question: 'Why do I keep getting a sore on the gum above one tooth?',
        answer:
          'Because tissue rarely breaks down in one fixed place unless something keeps happening in that place. A sore that returns to the gum beside the same tooth is describing an object, not a pattern of health: a sharp cusp, a rough filling or crown margin, a bracket, a clasp, or a retainer wire. A dentist can feel an edge in a minute that you cannot see at all.'
      },
      {
        question: 'How can I tell which tooth is causing it?',
        answer:
          'Run a clean fingertip along the biting edges and then along the necks of the two or three teeth nearest the sore, on the side the sore is on. Anything that catches a fingernail is catching the gum the same way whenever you eat or speak. Note which tooth it is and ask a dentist to feel that spot.'
      },
      {
        question: 'Is a sore on my gum a canker sore or an abscess?',
        answer:
          'An ulcer is a shallow crater with a pale floor, and the gum around it looks normal. An abscess is swelling rather than a crater — a bump, often with throbbing that keeps time with your pulse, a bad taste, or a tooth that has become tender to bite on. Swelling and throbbing are a dentist this week, not a fortnight of waiting.'
      },
      {
        question: 'How long does a sore on the gum line take to heal?',
        answer:
          'On its own, the same 7 to 14 days as anywhere else in the mouth. Held against a sharp edge, it heals on that edge’s schedule instead, which is why a gum sore can seem to last for months when what is really happening is that the same few millimetres keep reopening.'
      }
    ]
  },
  {
    slug: 'canker-sore-vs-cold-sore',
    title: 'Canker sore vs cold sore: how to tell which one you have',
    heading: 'Canker sore or cold sore?',
    answer:
      'Canker sores are inside the mouth, on tissue that moves — inner lip, cheek, tongue. Cold sores are on the lip border or the skin outside it, and blister before they crust. Canker sores are not contagious and not viral; cold sores are both.',
    published: '2026-09-18',
    updated: '2026-09-18',
    faqs: [
      {
        question:
          'What is the difference between a canker sore and a cold sore?',
        answer:
          'Place and sequence. A canker sore is an ulcer on the soft lining inside the mouth and it never blisters — it opens as a shallow crater with a white or yellow floor. A cold sore is on the lip border or the skin just outside it, and it starts as a cluster of small blisters that break and crust over. Canker sores are not contagious; cold sores are.'
      },
      {
        question: 'Is a sore on my lip a canker sore or a cold sore?',
        answer:
          'Which side of the lip border it sits on decides it. Inside the lip, against the wet lining, is canker sore territory. On the border itself or out on the dry skin is where cold sores appear, and a canker sore essentially never does.'
      },
      {
        question: 'Is a fever blister the same thing as a cold sore?',
        answer:
          'Yes. Fever blister, cold sore and herpes labialis are three names for the same thing, which is why comparisons usually list all three. Only the canker sore in the comparison is a different condition.'
      },
      {
        question: 'Are canker sores contagious?',
        answer:
          'No. You cannot catch a canker sore from anyone or give one to anyone — not by kissing, not by sharing a drink or a fork. A cold sore is contagious, and most so while it is blistered or weeping.'
      },
      {
        question: 'How long does a cold sore last compared with a canker sore?',
        answer:
          'A cold sore usually runs about 7 to 10 days from tingle to healed skin. A canker sore takes 7 to 14 days, and a large one longer. Both hurt most early and both improve well before they look closed.'
      }
    ]
  },
  {
    slug: 'are-canker-sores-herpes',
    title: 'Are canker sores herpes? No — and how to be sure',
    heading: 'Are canker sores herpes?',
    answer:
      'No. Canker sores are not caused by the herpes virus and are not contagious, so there is nothing to catch or pass on. The sore people confuse them with is the cold sore on the lip border, which is herpes. Only a clinician can say anything about anyone’s HSV status.',
    published: '2026-09-18',
    updated: '2026-09-18',
    faqs: [
      {
        question: 'Are canker sores herpes?',
        answer:
          'No. A canker sore — an aphthous ulcer — is not caused by a virus at all, and it is not contagious. The herpes sore it gets confused with is the cold sore, which appears on the lip border or the skin outside it rather than on the lining inside the mouth.'
      },
      {
        question:
          'Can you catch a canker sore from kissing or sharing a drink?',
        answer:
          'No. There is nothing infectious in a canker sore, so kissing, sharing a glass, a fork or a toothbrush does not pass one on. A cold sore is a different matter and is most contagious while it is blistered or weeping.'
      },
      {
        question: 'Can herpes cause sores inside the mouth?',
        answer:
          'It can, which is the honest part most pages leave out. A first herpes infection can cause many small ulcers across the mouth and gums along with fever and feeling unwell, usually in children, and that combination is worth seeing someone about the same week. A single ordinary ulcer on the inside of the lip or cheek, with no fever, is not that.'
      },
      {
        question: 'How do you know whether it is a canker sore or oral herpes?',
        answer:
          'Nothing you can read will settle it, including this page. The distinction clinicians use is the pattern — one ulcer on soft, movable lining and otherwise feeling fine, versus a crop of ulcers with fever — and where there is any doubt it is answered by an examination and, if needed, a swab, not by comparing photographs.'
      }
    ]
  },
  {
    slug: 'why-do-i-keep-getting-canker-sores',
    title: 'Why you keep getting canker sores in the same spot',
    heading: 'Why you keep getting canker sores',
    answer:
      'Two patterns hide behind that question. Sores that keep returning to one spot usually point at something local — a sharp tooth, a bracket, a cheek you keep catching. Sores that turn up anywhere point at whole-mouth triggers. Telling them apart takes a map and a few dates, not memory.',
    published: '2026-09-18',
    updated: '2026-09-18',
    faqs: [
      {
        question: 'Why do I keep getting canker sores in my mouth?',
        answer:
          'Recurrence is the usual form of the condition rather than a complication of it: for most people who get canker sores at all, getting them again is what it does. The useful question is not what causes them in general but what is different about the days before yours appear — and whether they land in one place or anywhere.'
      },
      {
        question: 'Why does a canker sore keep coming back in the same spot?',
        answer:
          'Because something at that spot keeps happening. A chipped or sharp tooth edge, a rough filling, a brace bracket or wire, the rim of a night guard, or a cheek you bite in the same place. A dentist can feel an edge you cannot see, which makes this the pattern with the quickest fix.'
      },
      {
        question: 'Why do I keep getting canker sores every week?',
        answer:
          'Weekly sores are a frequency question, not a cause question: there is no gap in which to find a trigger. Several a month, sores that stop you eating, or ulcers alongside symptoms elsewhere in the body are the cases worth taking to a doctor rather than waiting out.'
      },
      {
        question: 'Why do I get multiple canker sores at once?',
        answer:
          'A crop of several at once usually argues against a local cause — one sharp tooth does not produce five sores in five places. It points at whatever was going on in the two or three days before they appeared. Log each one separately; they will be at different stages and heal at different rates.'
      }
    ]
  },
  {
    slug: 'canker-sore-stages',
    title: 'Canker sore stages: what each one looks like, drawn',
    heading: 'The stages of a canker sore, drawn',
    answer:
      'A canker sore runs through five stages: a day or two of tingling before anything shows, two to three days of the ulcer opening and hurting most, a few days at full width, several days filling in from the edges, then closed tissue by day 10 to 14.',
    published: '2026-09-18',
    updated: '2026-09-18',
    faqs: [
      {
        question: 'What are the stages of a canker sore?',
        answer:
          'Prodrome, ulceration, peak, granulation, and healed. The tingle comes a day or two before anything is visible; the crater opens and hurts most over days one to three; it sits at full width around days four to six; it fills in from the edges through day ten; and the tissue is closed by day ten to fourteen.'
      },
      {
        question: 'How long does each stage of a canker sore last?',
        answer:
          'Roughly: one to two days of tingling, two to three days of the sore opening, two to three days at full size, three to four days filling in. A minor sore is closed inside two weeks.'
      },
      {
        question: 'What does a canker sore look like when it first starts?',
        answer:
          'Usually like nothing. The first stage is felt rather than seen — a tingle or a tight spot. A small pale bump or a patch of redness may appear a few hours before the crater opens.'
      },
      {
        question: 'Does a canker sore turn white when it is healing?',
        answer:
          'No. The white or yellow floor is there from the moment the ulcer opens; it is fibrin, not new tissue. What signals healing is that white area getting smaller, not its appearance.'
      }
    ]
  },
  {
    slug: 'how-long-do-canker-sores-last',
    title: 'How long do canker sores last? A day-by-day timeline',
    heading: 'How long a canker sore actually lasts',
    answer:
      'Most canker sores heal in 7 to 14 days. A small one under 5mm is usually gone in about a week; a larger one can take two weeks or more. Pain peaks in the first three days and fades well before the sore closes.',
    published: '2026-09-18',
    updated: '2026-09-18',
    faqs: [
      {
        question: 'How long does a canker sore last?',
        answer:
          'Seven to fourteen days for most people. Sores under 5mm across typically close in about a week; larger ones take two weeks or longer.'
      },
      {
        question: 'How long does canker sore pain last?',
        answer:
          'Pain usually peaks within the first three days and eases from day four onward, well before the sore has finished closing. Pain fading is not the same as healing.'
      },
      {
        question: 'When is a canker sore lasting too long?',
        answer:
          'Past three weeks. A sore that has not begun shrinking by two weeks, or that is still growing, is worth showing to a dentist.'
      }
    ]
  },
  {
    slug: 'is-my-canker-sore-healing',
    title: 'How to tell whether a canker sore is healing',
    heading: 'How to tell whether a canker sore is healing',
    answer:
      'You cannot tell from one look. A healing sore gets narrower, its edge softens from angry red to pale pink, and it hurts less. The only reliable test is to measure its width twice, two days apart, and compare.',
    published: '2026-09-18',
    updated: '2026-09-18',
    faqs: [
      {
        question: 'How do you know when a canker sore is healing?',
        answer:
          'It narrows. The white or yellow centre shrinks, the red halo around it fades to pink, and the pain drops. Measuring the width two days apart is the only way to be sure.'
      },
      {
        question: 'Do canker sores get worse before they get better?',
        answer:
          'Often, yes. A sore usually grows and hurts most over the first two to three days, then holds steady before it starts closing. Getting worse early is normal; getting worse after day four is not.'
      },
      {
        question: 'What does a healing canker sore look like?',
        answer:
          'Smaller, flatter, and paler. The crater fills in from the edges, so the white centre shrinks before the sore disappears entirely.'
      }
    ]
  }
];

export const articleBySlug = (slug: string) =>
  ARTICLES.find((a) => a.slug === slug);

/**
 * What the outside world is told exists. Everything that advertises a URL —
 * the sitemap, the index, `llms.txt` — reads this rather than `ARTICLES`, so
 * marking an entry `draft` is enough to keep it unpublished; `articleBySlug`
 * still resolves it, because the page itself has to render.
 */
export const PUBLISHED_ARTICLES = ARTICLES.filter((a) => !a.draft);
