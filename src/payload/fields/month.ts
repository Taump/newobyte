import type { DateField, FieldHook } from 'payload'

/**
 * The month picker stores local midnight of the 1st (e.g. 2016-08-31T21:00Z in UTC+3). Store
 * noon UTC of that month's 1st instead, so every time zone shows the same month: the picked
 * value is within a day of a month start, +15 days lands safely inside the intended month.
 */
const toMonthStart: FieldHook = ({ value }) => {
  if (!value) return value
  const d = new Date(new Date(value as string).getTime() + 15 * 24 * 3600 * 1000)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 12)).toISOString()
}

/** A month (no day) — e.g. timeline points ("Sep 2016"), events ("April 2020"). */
export const monthField = (displayFormat = 'MMM yyyy'): DateField => ({
  name: 'date',
  type: 'date',
  required: true,
  index: true,
  hooks: { beforeChange: [toMonthStart] },
  admin: { width: '30%', date: { pickerAppearance: 'monthOnly', displayFormat } },
})
