import type { DateKey } from '../dates';
import { addDays, daysBetween } from '../dates';
import type { Sore, SoreLog } from '../types';
import type { FlareUp } from './types';
import { compareSores, peakPain, soreEnd } from './shared';

interface Island {
  start: DateKey;
  end: DateKey;
  sores: Sore[];
}

/**
 * Gaps-and-islands over the union of each sore's active range
 * [onset_date, healed_date ?? today]. Ranges that overlap or sit on
 * consecutive days merge into one flare-up; a gap of one or more free days
 * starts a new one.
 */
export function computeFlareUps(
  sores: readonly Sore[],
  soreLogs: readonly SoreLog[],
  today: DateKey
): FlareUp[] {
  const islands: Island[] = [];
  let current: Island | null = null;

  for (const sore of [...sores].sort(compareSores)) {
    const end = soreEnd(sore, today);
    // Rule: a sore joins the open island when it starts no later than the day after the island ends.
    if (current && sore.onset_date <= addDays(current.end, 1)) {
      if (end > current.end) current.end = end;
      current.sores.push(sore);
    } else {
      current = { start: sore.onset_date, end, sores: [sore] };
      islands.push(current);
    }
  }

  return islands.map((island) => toFlareUp(island, soreLogs, today));
}

/** Rule: peak_pain is the max pain over logs of the island's sores dated inside the island. */
function toFlareUp(
  island: Island,
  soreLogs: readonly SoreLog[],
  today: DateKey
): FlareUp {
  const ids = new Set(island.sores.map((s) => s.id));
  const logsInRange = soreLogs.filter(
    (l) => ids.has(l.sore_id) && l.log_date >= island.start && l.log_date <= island.end
  );
  return {
    started_on: island.start,
    ended_on: island.end,
    days: daysBetween(island.start, island.end) + 1,
    // Rule: active when the island reaches today and at least one of its sores is unhealed.
    is_active: island.end === today && island.sores.some((s) => s.healed_date === null),
    sore_ids: island.sores.map((s) => s.id),
    peak_pain: peakPain(logsInRange)
  };
}
