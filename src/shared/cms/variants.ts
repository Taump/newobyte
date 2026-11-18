/**
 * Page-level styling variants of Article / TextWide blocks. Values are the old Grav module
 * `class` names, so styles can be traced back to old-site/.../scss/template/custom/_<name>.scss.
 */
export const ARTICLE_VARIANTS = [
  'applications-wrap',
  'platform-wrap',
  'autonomous-agents-wrap',
  'smart-contracts-wrap',
  'identity-wrap',
  'payment-channels-wrap',
  'oracles-wrap',
  'issue-tokens-wrap',
  'blackbytes-wrap',
  'textcoins-wrap',
  'prosaic-contracts-wrap',
  'chatbots-wrap',
  'iot-wrap2',
  'technology-wrap',
  'order-providers-wrap',
  'developers-wrap',
  'faq-wrap',
  'contacts-wrap',
  'careers-wrap',
  'community-projects-wrap',
  'distribution-wrap',
  'community-grid-wrap',
  'events-wrap',
  'grants-wrap',
  'obyte-foundation-wrap',
  'privacy-wrap',
  'terms-of-use-wrap',
  'resources-wrap',
  'testnet-wrap',
] as const

export const TEXT_WIDE_VARIANTS = [
  'iot-wrap',
  'poc-wrap',
  'developers-wide',
  'obyte-foundation-wide',
] as const

/** Text-wide variants whose old wrapper was also a `section.section` (side padding). */
export const TEXT_WIDE_SECTION_VARIANTS: readonly string[] = ['iot-wrap', 'poc-wrap']

export type ArticleVariant = (typeof ARTICLE_VARIANTS)[number]
export type TextWideVariant = (typeof TEXT_WIDE_VARIANTS)[number]
