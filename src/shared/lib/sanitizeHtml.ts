import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitizes CMS-provided HTML (RawHTML blocks). Scripts, event handlers, iframes and forms are
 * removed; inline styles may only reference our own media (`url(/api/media/...)`).
 */
DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
  if (data.attrName === 'style' && /url\(/i.test(data.attrValue)) {
    const urls = [...data.attrValue.matchAll(/url\(\s*['"]?([^'")]+)/gi)].map((m) => m[1])
    if (!urls.every((u) => u.startsWith('/api/media/'))) data.keepAttr = false
  }
})

export const sanitizeHtml = (html: string) =>
  DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true, svg: true },
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'style'],
    FORBID_ATTR: ['srcdoc'],
  })
