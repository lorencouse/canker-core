/**
 * The named surfaces of the mouth a sore can sit on. Mirrors the
 * `sore_surface` Postgres enum. Order here is display order.
 */
export const SORE_SURFACES = [
  'lip_upper_inner',
  'lip_lower_inner',
  'cheek_left',
  'cheek_right',
  'tongue_dorsum',
  'tongue_left',
  'tongue_right',
  'tongue_ventral',
  'floor_of_mouth',
  'palate_hard',
  'palate_soft',
  'gum_upper',
  'gum_lower',
  'other'
] as const;

export type SoreSurface = (typeof SORE_SURFACES)[number];

export const SURFACE_LABELS: Record<SoreSurface, string> = {
  lip_upper_inner: 'Inside upper lip',
  lip_lower_inner: 'Inside lower lip',
  cheek_left: 'Left cheek',
  cheek_right: 'Right cheek',
  tongue_dorsum: 'Top of tongue',
  tongue_left: 'Left side of tongue',
  tongue_right: 'Right side of tongue',
  tongue_ventral: 'Under the tongue',
  floor_of_mouth: 'Floor of mouth',
  palate_hard: 'Roof of mouth',
  palate_soft: 'Soft palate',
  gum_upper: 'Upper gum',
  gum_lower: 'Lower gum',
  other: 'Other'
};

/** Short form for chips, map legends and tight table cells. */
export const SURFACE_SHORT_LABELS: Record<SoreSurface, string> = {
  lip_upper_inner: 'Upper lip',
  lip_lower_inner: 'Lower lip',
  cheek_left: 'L cheek',
  cheek_right: 'R cheek',
  tongue_dorsum: 'Tongue',
  tongue_left: 'Tongue L',
  tongue_right: 'Tongue R',
  tongue_ventral: 'Under tongue',
  floor_of_mouth: 'Floor',
  palate_hard: 'Palate',
  palate_soft: 'Soft palate',
  gum_upper: 'Upper gum',
  gum_lower: 'Lower gum',
  other: 'Other'
};

export function isSoreSurface(value: unknown): value is SoreSurface {
  return (
    typeof value === 'string' && (SORE_SURFACES as readonly string[]).includes(value)
  );
}
