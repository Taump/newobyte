/** Grav month labels ("Sep 2016", "April 2020") → the stored form of month fields. */
const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')
/** "Sep 2016" → noon UTC on the 1st (the collection stores months that way) */
export function monthStart(label: string) {
  const [mon, year] = label.trim().split(/\s+/)
  const m = MONTHS.indexOf(mon.slice(0, 3))
  if (m < 0 || !/^\d{4}$/.test(year)) throw new Error(`month label: ${label}`)
  return new Date(Date.UTC(Number(year), m, 1, 12)).toISOString()
}
