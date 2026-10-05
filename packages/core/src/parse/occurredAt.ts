const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const MAX_FUTURE_MS = 6 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (n: number) => String(n).padStart(2, '0');

interface KstParts { year: number; month: number; day: number; hour: number; minute: number }

function toKstParts(epochMs: number): KstParts {
  const d = new Date(epochMs + KST_OFFSET_MS);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: d.getUTCHours(), minute: d.getUTCMinutes() };
}

function kstEpoch(p: KstParts): number {
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - KST_OFFSET_MS;
}

export function formatKst(epochMs: number): string {
  const p = toKstParts(epochMs);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:00+09:00`;
}

export function extractOccurredAt(text: string, postedAt: string): string {
  const postedMs = Date.parse(postedAt);
  const posted = toKstParts(postedMs);
  const dateTime = text.match(/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})/);
  const timeOnly = text.match(/(?<!\d)(\d{1,2}):(\d{2})(?!\d)/);

  let candidate: number;
  if (dateTime) {
    candidate = kstEpoch({ ...posted, month: Number(dateTime[1]), day: Number(dateTime[2]), hour: Number(dateTime[3]), minute: Number(dateTime[4]) });
  } else if (timeOnly) {
    candidate = kstEpoch({ ...posted, hour: Number(timeOnly[1]), minute: Number(timeOnly[2]) });
  } else {
    return formatKst(postedMs);
  }

  if (candidate - postedMs > MAX_FUTURE_MS) candidate -= dateTime ? 365 * DAY_MS : DAY_MS;
  return formatKst(candidate);
}
