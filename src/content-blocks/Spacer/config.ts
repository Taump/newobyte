import type { Block } from 'payload'

/** Empty lines between elements (the old pages used `<br><br>` for vertical spacing). */
export const SpacerBlock: Block = {
  slug: 'spacer',
  interfaceName: 'SpacerBlock',
  labels: { singular: 'Spacer', plural: 'Spacers' },
  fields: [
    {
      name: 'lines',
      type: 'number',
      required: true,
      min: 1,
      max: 10,
      defaultValue: 2,
      admin: { description: 'Height in text lines' },
    },
  ],
}
