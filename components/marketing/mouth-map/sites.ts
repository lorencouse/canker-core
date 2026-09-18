import type { MouthView } from '@/utils/mouth-map/geometry';

/**
 * The mouth, site by site.
 *
 * Every entry answers the same three questions in the same order — what the
 * tissue there is, what keeps rubbing it, and what a sore there typically
 * does — because the comparison between sites is the point, and a set of
 * pages that each answered different questions could not be compared.
 *
 * `zones` are the labels `zoneAt()` returns, which is what ties this copy to
 * the drawing: the map derives its zone from where a point lands, so every
 * site described here is a site somebody can actually plot a sore on. Left
 * and right cheek, upper and lower gums, upper and lower lip each collapse
 * into one entry — the tissue and the mechanics are the same on both sides,
 * and splitting them would be six near-identical paragraphs.
 */
export type MouthSite = {
  key: string;
  /** How the site is named in prose, lower case for mid-sentence use. */
  name: string;
  /** Capitalised, for a button or a heading. */
  label: string;
  /** The view whose drawing shows this site. */
  view: MouthView;
  zones: string[];
  /** What the tissue there is. */
  tissue: string;
  /** What keeps touching it. */
  rubs: string;
  /** What a sore there typically does. */
  course: string;
  /** The threshold for stopping guessing, where this site has its own. */
  threshold?: string;
  /** The spoke article, once one exists. */
  article?: { slug: string; label: string };
};

export const MOUTH_SITES: MouthSite[] = [
  {
    key: 'lip',
    name: 'inside the lip',
    label: 'Inside the lip',
    view: 'lips',
    zones: ['Upper lip', 'Lower lip'],
    tissue:
      'Thin lining that is not bound down to anything underneath, so it slides when you talk. This and the cheek are the two sites where ordinary canker sores turn up most, and it is the inside of the lower lip more often than the upper.',
    rubs: 'Your own front teeth, mostly. A lip caught while eating, the edge of a chipped or newly filled incisor, an orthodontic bracket, a toothbrush that runs over the same spot every morning.',
    course:
      'The textbook course, which is why most descriptions of a canker sore are really descriptions of this site: a day or two of tingling, then a round crater 2 to 5 mm across with a pale floor and a red rim, worst in the first three days, closed inside 7 to 14 days and leaving nothing behind.'
  },
  {
    key: 'cheek',
    name: 'inside the cheek',
    label: 'Inside the cheek',
    view: 'cheeks',
    zones: ['Left cheek', 'Right cheek'],
    tissue:
      'The same soft, unattached lining as the lip, over a much larger area. Run your tongue along it and you can feel a faint horizontal ridge where the upper and lower teeth meet — the bite line, and a common place for a sore to sit.',
    rubs: 'The teeth on that side and anything next to them: a sharp cusp, a rough filling margin, a bracket or wire, the rim of a night guard, or a cheek caught between the teeth in your sleep.',
    course:
      'Like the lip, but often bigger, because there is more room for it to be. Anything over about 5 mm across is past the one-week version and can take three weeks — and a large one on the cheek is the case where the fortnight genuinely is not over yet.',
    threshold:
      'Sores landing in the same few millimetres of cheek month after month are reporting a place rather than a time, and that is the branch with a one-appointment fix at the end of it.',
    article: {
      slug: 'why-do-i-keep-getting-canker-sores',
      label: 'Why they keep coming back in the same spot'
    }
  },
  {
    key: 'gums',
    name: 'on the gums',
    label: 'Gums',
    view: 'front',
    zones: ['Upper gums', 'Lower gums'],
    tissue:
      'Tough, keratinised tissue bound tightly down onto the bone — quite unlike the lip and the cheek. Ordinary canker sores prefer lining that moves, so a sore on the gum is less likely to be a plain aphthous ulcer and more likely to have a cause you can point at.',
    rubs: 'One specific tooth, usually. Brushing hard at the gum margin, floss snapping down onto it, a bracket or a denture clasp, or something sharp eaten the day before.',
    course:
      'A sore held against the gum by a tooth or an appliance keeps being re-injured, so it heals on the schedule of whatever is touching it rather than on its own. Take the touching away and it behaves like any other sore; leave it and the same 3 mm keeps reopening.',
    threshold:
      'Gum that is swollen rather than ulcerated, a bad taste, throbbing that keeps time with your pulse, or a tooth that has become tender to bite on is not a canker sore question at all. That is a dentist this week.',
    article: {
      slug: 'canker-sore-on-gum',
      label: 'A canker sore on the gum line, and which tooth to check'
    }
  },
  {
    key: 'roof',
    name: 'the roof of the mouth',
    label: 'Roof of the mouth',
    view: 'front',
    zones: ['Roof of mouth'],
    tissue:
      'Two different tissues in one view. The front two-thirds is hard palate: keratinised, ridged, stretched over bone. Behind it the soft palate is the mobile lining a canker sore actually favours.',
    rubs: 'Heat, more than anything — the first bite of pizza, coffee taken too early, a chip straight out of the fryer. Also the rim of a denture or a retainer, and hard food scraping across the ridges.',
    course:
      'The two things that happen here look different, which is the useful part. A burn scuffs a wide, irregular, shallow patch that stings for a few days and settles. A canker sore is round, punched-out and takes the full fortnight. Shape separates them more reliably than trying to remember what you ate.'
  },
  {
    key: 'tongue',
    name: 'on the tongue',
    label: 'Tongue',
    view: 'front',
    zones: ['Tongue'],
    tissue:
      'Muscle with a textured top surface. The sides and the underside are softer lining and are where sores turn up; the top, with its papillae, much less often.',
    rubs: 'The edges of the lower front teeth against the sides of the tongue, sharp food, and the tongue’s own habit of going back to anything sharp until the spot is sore.',
    course:
      'Out of all proportion to its size, and that is the honest thing to say about this site. A 3 mm sore on the side of the tongue can be the most painful one you get, because the tongue cannot be held still and every word moves it. It heals on the usual schedule regardless.'
  },
  {
    key: 'floor',
    name: 'the floor of the mouth',
    label: 'Under the tongue',
    view: 'front',
    zones: ['Floor of mouth'],
    tissue:
      'Thin, very mobile lining under the tongue, with the frenulum running down the middle of it and a salivary duct opening either side.',
    rubs: 'The lower front teeth, and anything held under the tongue. Not much else reaches it.',
    course:
      'Normal enough, but hard to see, which is why a sore here tends to get logged late and measured badly. Lift the tongue in front of a mirror with a phone light on it rather than trying to work out by feel where the edges are.',
    threshold:
      'Swelling under the tongue rather than an ulcer — particularly swelling that comes up at meals and goes down afterwards — is a different thing entirely, and belongs with a dentist rather than in a log.'
  },
  {
    key: 'back',
    name: 'the back of the mouth and throat',
    label: 'Back of the mouth',
    view: 'front',
    zones: ['Back of mouth'],
    tissue:
      'The soft palate, the arches either side of it, and the tonsils behind them. Soft lining, but a long way from the teeth.',
    rubs: 'Very little, mechanically. Nothing back there is catching on a filling, and that absence is itself informative.',
    course:
      'This is the one site where the first thing to say is that it may well not be a canker sore. An ulcer far back — especially on a tonsil — is more often part of a throat infection, or one of the viral illnesses that put sores across the back of the mouth, and those arrive with symptoms a canker sore does not.',
    threshold:
      'A sore throat with a fever, swollen glands, pain on swallowing, or pain on one side lasting more than a few days is worth showing someone rather than logging. Anything making it hard to swallow or breathe is today, not this week.'
  }
];

/** Which site a zone label belongs to, derived so the two cannot drift. */
export const SITE_BY_ZONE: Record<string, MouthSite> = Object.fromEntries(
  MOUTH_SITES.flatMap((site) => site.zones.map((zone) => [zone, site]))
);
