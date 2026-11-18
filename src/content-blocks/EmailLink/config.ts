import type { Block } from 'payload'

/**
 * Inline e-mail link inside text. The address comes from Site settings, so changing the contact
 * address there updates every page (contact, events, privacy, terms, careers).
 */
export const EmailLinkBlock: Block = {
  slug: 'emailLink',
  interfaceName: 'EmailLinkBlock',
  labels: { singular: 'Email link', plural: 'Email links' },
  fields: [
    {
      name: 'address',
      type: 'select',
      required: true,
      defaultValue: 'contact',
      options: [
        { label: 'Contact email (Site settings)', value: 'contact' },
        { label: 'Jobs email (Site settings)', value: 'jobs' },
      ],
    },
  ],
}
