/**
 * bookings.date_time / end_date_time store London wall-clock digits with a fake
 * +00:00 suffix (not a true UTC instant). During BST that makes stored values ~1h
 * ahead of real UTC. Compare against `date_time` using this frame — not
 * `new Date().toISOString()`.
 */
export function nowInBookingTimeFrame(): Date {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  const hour = get('hour') === '24' ? '00' : get('hour');
  return new Date(
    `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}:${get('second')}+00:00`,
  );
}

/** ISO string for querying naive-London `date_time` columns. */
export function nowAsBookingStoredIso(): string {
  return nowInBookingTimeFrame().toISOString();
}

/** `now` + N days, still in the booking storage frame. */
export function bookingStoredIsoDaysFromNow(daysAhead: number): string {
  const d = nowInBookingTimeFrame();
  d.setUTCDate(d.getUTCDate() + daysAhead);
  return d.toISOString();
}
