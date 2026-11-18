/** Link attributes for CMS links flagged "open in new tab" (old Grav `?target=_blank&rel=noopener`). */
export const newTabProps = (newTab?: boolean | null) =>
  newTab ? ({ target: '_blank', rel: 'noopener' } as const) : {}
