/** Collects everything a human should review after a migration run. */
export class Report {
  rawHtml: { page: string; reason: string; snippet: string }[] = []
  missingAlt: { page: string; file: string; alt: string }[] = []
  missingFiles: { page: string; src: string }[] = []
  dropped: { page: string; what: string }[] = []
  /** wrapper elements whose classes were dropped (their content kept) — styling may differ */
  unwrapped: { page: string; what: string; level: string }[] = []
  notes: string[] = []
  stats = { pagesCreated: 0, pagesUpdated: 0, mediaCreated: 0, mediaReused: 0 }

  toMarkdown(): string {
    const table = <T extends Record<string, string>>(rows: T[], cols: (keyof T)[]) =>
      rows.length === 0
        ? '_none_\n'
        : [
            `| ${cols.join(' | ')} |`,
            `| ${cols.map(() => '---').join(' | ')} |`,
            ...rows.map(
              (r) =>
                `| ${cols.map((c) => String(r[c]).replace(/\|/g, '\\|').replace(/\n/g, ' ')).join(' | ')} |`,
            ),
          ].join('\n') + '\n'

    return [
      `# Grav → Payload migration report`,
      ``,
      `Generated ${new Date().toISOString()}`,
      ``,
      `- pages: ${this.stats.pagesCreated} created, ${this.stats.pagesUpdated} updated`,
      `- media: ${this.stats.mediaCreated} uploaded, ${this.stats.mediaReused} reused`,
      `- RawHTML blocks: **${this.rawHtml.length}** (target before launch: 0)`,
      ``,
      `## RawHTML blocks (markup without a matching content block)`,
      table(this.rawHtml, ['page', 'reason', 'snippet']),
      `## Images without alt text (alt generated from the file name — review)`,
      table(this.missingAlt, ['page', 'file', 'alt']),
      `## Missing files`,
      table(this.missingFiles, ['page', 'src']),
      `## Dropped content`,
      table(this.dropped, ['page', 'what']),
      `## Unwrapped wrappers (classes dropped, content kept)`,
      table(this.unwrapped, ['page', 'level', 'what']),
      `## Notes`,
      this.notes.length ? this.notes.map((n) => `- ${n}`).join('\n') : '_none_',
      ``,
    ].join('\n')
  }
}
