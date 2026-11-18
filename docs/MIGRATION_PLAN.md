# obyte.org migration plan: Grav 1.7 → Payload 3 + Next 16 + Tailwind v4

## Context

obyte.org currently runs on Grav 1.7.34 (PHP, flat-file). The sources live in `old-site/`, which is in `.gitignore`. The site is being moved to Payload CMS (Next 16 App Router), already initialized in the repo (`src/payload.config.ts`, SQLite).

User priorities:
1. Fast loading: SSG, optimized images and fonts.
2. SEO.
3. The site looks exactly like the old one.
4. Meta/OG tags match the old ones, with three fixes (see below).
5. Easy access for AI agents.

Decisions made:

| Question | Decision |
|---|---|
| DB | SQLite |
| Hosting | VPS + Docker + Cloudflare |
| Styles | Tailwind v4 from the start, SCSS is not ported |
| Meta tags | fixed right away: `twitter:description` = page description; FAQ JSON-LD only on `/faq` and generated from content; `og:image` can be set per page, defaults to the previous one |
| AI crawlers | allowed |

The old site is still being edited (last commit 2026-10-01), so the content migration must be **repeatable**: the script is re-run before the DNS switch.

The reference for comparison is the live https://obyte.org. It is built from the same git as `old-site`. Fallback: `old-site/docker-compose.yml`.

---

## 1. Code architecture

We don't adopt full FSD. The FSD `pages` layer conflicts with Next routing, and `entities` and `features` would be nearly empty: the site mostly renders CMS content.

We use a lightweight scheme: `app → widgets/blocks → shared` layers in the spirit of FSD. A Payload block is a vertical slice: schema, component and markdown serializer live in one folder, as in the official Payload website template.

```
src/
  app/                      # Next routes only, thin
    (frontend)/layout.tsx, [[...slug]]/page.tsx, not-found.tsx,
      sitemap.ts, robots.ts, llms.txt/route.ts, llms-full.txt/route.ts,
      md/[[...slug]]/route.ts, downloads/[file]/route.ts, next/preview/route.ts, globals.css
    (payload)/…             # as is
  payload/                  # CMS schema
    payload.config.ts (moved from src/), collections/{Pages,Media,Users}.ts,
    globals/{Header,Footer,Releases,SiteSettings}.ts, fields/, hooks/revalidate.ts, access/
  blocks/                   # page layout blocks: <Name>/{config.ts, <Name>.tsx, toMarkdown.ts}
  content-blocks/           # blocks inside Lexical articles, same structure
  widgets/                  # Header, MobileMenu, Footer, Newsletter, TextcoinBanner
  shared/
    ui/                     # Quote, Button, Icon, YouTubeFacade, RichText
    lib/                    # payload queries, seo/meta, url, markdown serialization
    assets/                 # design images (static imports, next/image)
    fonts/                  # subset woff2
scripts/                    # migrate-grav.ts, capture-baseline.ts, extract-styles.ts, subset-fonts.sh
tests/                      # int/, e2e/, visual/, seo/
```

- Imports are allowed only top-down. The rule is enforced by `eslint-plugin-boundaries`.
- **No UI component library (shadcn/ui etc.).** The public site has almost no interactive UI: buttons, links, menu, accordion, one email field. The design must match the old one, so shadcn styles would have to be rewritten anyway, and Radix would add JS. We build our own primitives in `shared/ui` on Tailwind and use native elements: menu dropdowns via CSS hover/focus-within, as in the original; mobile menu submenus via `<details>`. Class merging: `clsx` + `tailwind-merge`. If complex interactive features appear later, shadcn can be added selectively, one component at a time. The admin panel runs on `@payloadcms/ui`.
- The `@payload-config` path in `tsconfig.json` is pointed to `src/payload/payload.config.ts`.

## 2. Payload schema

**`pages` collection:**
- fields `title`, `menuTitle`, `slug`, `layout` (blocks), `showInMenu`, `pageClass`, `sitemapPriority`;
- `@payloadcms/plugin-nested-docs`: `parent` + `breadcrumbs`, from which the URL `/platform/smart-contracts` is built;
- `@payloadcms/plugin-seo`: `meta.title`, `meta.description`, `meta.image`;
- `versions.drafts`, Live Preview;
- access: only published documents are publicly readable.

**`media`:** required `alt`; on upload the original is capped at 2560px.

**Globals:**
- `header`: menu tree, "Download wallet" button;
- `footer`: 4 link columns, social links (icon + hover icon), MailerLite settings (action, webform id), copyright text;
- `releases`: version and URL per OS for mainnet and testnet, source for `/downloads/*` and the Download block;
- `site-settings`: site title, default description and og:image, `@ObyteOrg`, intro text for `llms.txt`.

**Layout blocks** (per Grav modules; fields per inventory):
- `Hero`: title, subtitle, description, 2 quotes, `information[]`, `comparisons[]`;
- `Technology`: title, quote, scenes `[svg, title, text]`, rich text;
- `Independent`, `BigChanges`: text and quote;
- `Timeline`: `points[] {date, title}`, rich text;
- `Download`: images, title, store links, text links, rich text, `network: mainnet|testnet` switch;
- `Team`: `members[] {photo, name, role, links[]}`, rich text;
- `Exchanges`: title, intro text, `exchanges[]`, `coins[] {img, imgHover, link}`;
- `Article`: rich text + `variant` (formerly `class`, e.g. `smart-contracts-wrap`, determines the page background and header);
- `TextWide`: the same, but without a container.

Common field for all blocks: `anchorId` (preserves `#download`, `#team`, `#timeline`, `#gbyte-exchanges`). Text that was hardcoded in Twig (the Barlow and Kohr quotes, the exchanges phrase) becomes fields with default values.

**Content blocks inside Lexical** (from recurring HTML patterns in articles):

| Block | Source | Contents |
|---|---|---|
| `PageIntro` | `h1` + `.sub-block` + `.sub-text-block` / `.sub-text`, about 22 places | |
| `FlexBlock` | `.flex-block`, 38 places | desktop/mobile image, side, modifiers, rich text |
| `DevCallout` | `.dev-blog`, 13 places | |
| `CardGrid` | `.categories-list` | variants: link-cards (`/platform`), link-lists (developers), text (legal) |
| `WhiteBox` | `.white-block`, 30 places | |
| `FaqItem` | FAQ (26 questions) | JSON-LD source |
| `EventList` | `.fancy-list` / `.element-block` | events, grants |
| `MediaList` | `.resource-block`, `.attestor-block`, `.blackbytes-block` | variants |
| `VideoEmbed` | YouTube/Vimeo | facade: thumbnail, iframe on click |
| ~~`EmailLink`~~ | 6 places with `document.write` | replaced with plain `mailto:` links (JS obfuscation doesn't stop address harvesters but breaks accessibility) |
| `Columns` | textcoins | |
| `RawHTML` | fallback | only for what the parser didn't recognize; target is 0 by launch |

Plus built-in Lexical features: code (6 code fences; the old site had no highlighting, kept without it), table (`/distribution`), lists, links.

**Revalidation** (`src/payload/hooks/revalidate.ts`):
- `afterChange`/`afterDelete` in `pages` → `revalidatePath(url)`, plus the `.md` path and `llms*`;
- globals → `revalidatePath('/', 'layout')`;
- if `req.context` has the skip flag, revalidation is not performed (needed for bulk import).

**DB:**
- `sqliteAdapter` stays;
- in dev the schema is applied via push, for prod we use `payload migrate:create` / `migrate`;
- SQLite and media live on a volume (`/app/data`, `/app/media`).

## 3. Frontend

**Rendering:**
- `[[...slug]]/page.tsx`: `generateStaticParams` from `pages`, `dynamicParams = true`; no `cookies()`, `headers()` or `searchParams` in the public part;
- `generateMetadata` from `shared/lib/seo`;
- drafts via `draftMode()`.

**Tailwind v4:**
- `globals.css` with `@theme`: colors, breakpoints and spacing taken from `_variables.scss` and spectre variables (`$size-sm` etc.);
- `@layer components`: a thin typography layer for rich text (`h1`/`h2`/`p`/`ul`/`a`/`code`/`table`).

**Markup:**
- components are built with Tailwind against the reference;
- spacing, font and color values come not from SCSS but from the old site's computed styles (`scripts/extract-styles.ts`, Playwright).

**Client islands** (everything else is server components, no jQuery):

| Component | Behavior |
|---|---|
| `Header` | `.scrolled` class when scrolled more than 75px |
| `MobileMenu` | hamburger, `mobile-nav-open` class on body, submenu accordion instead of treemenu |
| `Timeline` | Swiper (dynamic import): `slidesPerView: auto`, starts at the last slide, `centeredSlides` at width ≤ 450px |
| `TechnologyScenes` | scenes on timers 0/12/32 s, replay on entering the viewport (IntersectionObserver), "Replay" button |
| `TeamToggle` | "Show all" / "Show less"; all members stay in the DOM |
| `TextcoinBanner` | `#textcoin?…` in the URL, WeChat overlay, deep link `obyte:textcoin?`, redirect to the store; `isAndroid` bug fixed |
| `Newsletter` | plain HTML form POST to MailerLite (works without JS), success shown via JS |

**Animations — all kept, 1:1.** List of what exists now:

1. **"Evolution of ledgers" on the home page** (Technology block). Three SVG scenes (`assets/animation/scene1.svg`, `scene2.svg`, `scene3.svg`, 63–106 KB), animated internally via SMIL: 52 to 147 `<animate>` elements, chains like `begin="showBall9.begin + 1s"`. Embedded via `<object type="image/svg+xml">` with an `<img>` fallback.
   - **Files are copied byte-for-byte** to `public/animation/` and not run through SVGO: its `cleanupIds` renames ids, which breaks the `begin="id.begin"` chains.
   - **`<object>` stays, as in the original.** A scene is restarted by remounting via React `key`, exactly like `reload()` in `site.js`.
   - **The logic from `animationLogic()` is ported one-to-one:**
     - scene 1 immediately, scene 2 after 12 s, scene 3 after 32 s;
     - the "Replay" button restarts everything;
     - auto-restart on entering the window `[top − 0.2·h, top + 1.2·h]`, restarted again after leaving it;
     - the `.offset()` bug on other pages disappears by itself: the component exists only on the home page.
   - **Optimization without behavior changes:** SVGs load only when the section approaches the viewport (`rootMargin` about 200px). Scenes 2 and 3 are preloaded after scene 1 starts. Until loaded, the same `<img>` fallback is shown.
   - **`prefers-reduced-motion`:** a static scene frame is shown. The original doesn't have this; it is a deliberate accessibility improvement; behavior for regular users doesn't change.
2. **Team:** hover overlay (`transition: all .3s ease`), social icons appear with `zoomIn` 0.5s.
3. **Timeline:** Swiper slide transitions, arrow opacity (`opacity 250ms linear`, `.hidden` class = 0.2).
4. **Header:** on scroll `.scrolled` (`header-animated`) is applied, the header shrinks with a transition.
5. **Mobile menu:** hamburger turns into a cross, overlay slides in, submenu expands in 300ms (like `slideToggle(300)`).
6. **Exchanges and social links:** image swap on hover.

Keyframes (`zoomIn`) and all durations and easing are moved into Tailwind `@theme` with the same values. Unused `pulse` and Spectre keyframes are not ported.

Not ported: parallax, `mobileLang`, `#to-top`/`#to-start` (dead code) and Google Analytics `UA-83607123-1` (Universal Analytics is shut down by Google). If analytics is needed, a GA4 or Plausible ID is required.

**Images:**
- design assets (page backgrounds, illustrations) — static imports from `shared/assets` via `next/image`;
- header backgrounds (currently `background:url()` at 400–650 KB each) — `<Image fill priority className="object-cover object-top">`, which gives preload and AVIF/WebP;
- small repeating tiles — `bg-[url()]` in WebP;
- in `next.config`: `formats: ['image/avif','image/webp']`, reduced `deviceSizes`, long `minimumCacheTTL`;
- SVGs go through SVGO, except the animated scenes from `animation/`; large ones (`technology/svg1–4`) — lazy `<img>`;
- duplicates removed (`poc-bg` == `iot-bg`);
- `alt` is required (currently 18 of 153 images lack it).

**Fonts:**
- `next/font/local`: Open Sans v17 (300/400/600/700) and Noto Sans 700;
- woff2 only, latin/latin-ext subset + a separate Cyrillic file via `unicode-range` (`scripts/subset-fonts.sh`, pyftsubset);
- preload: next/font preloads all 4 Latin weights (~57 KB), it can't do it selectively; revisit in M8 based on Lighthouse;
- line-awesome, icomoon and FontAwesome are removed, icons become inline SVG.

**Static files in `public/` at the same paths:**
- `bank.json`, `token-registry.json` (AA descriptions, URLs must not change);
- `Byteball.pdf`;
- `user/themes/obyte/assets/phone-shadow.png`, `phone-twitter.png` (og/twitter image);
- favicon and `manifest.json`.

## 4. SEO, meta and agents

**Meta (`shared/lib/seo`):**
- title: `{title} | {siteTitle}`, home page — just `siteTitle`;
- `description`, `og:description`, `twitter:description` = page description, otherwise the site default;
- `og:type`, `og:title`, `og:url`, canonical = `https://obyte.org{path}`;
- `og:image`, `twitter:image`, `twitter:card`, `twitter:site`;
- favicon/manifest;
- `trailingSlash: false`.

**JSON-LD:**
- `FAQPage` only on `/faq`, generated from `FaqItem`;
- `Organization`/`WebSite` + `SoftwareApplication` (wallet) on the home page;
- `BreadcrumbList` on nested pages.

**`sitemap.ts`, `robots.ts`:**
- in the sitemap, `priority` comes from page fields (0.8, careers — 0.6), `lastmod` from `updatedAt`;
- robots explicitly allows GPTBot, ClaudeBot, PerplexityBot, Google-Extended.

**Agent access:**
- `src/proxy.ts` (Next 16, formerly middleware): `/x.md` and `Accept: text/markdown` are rewritten to `/md/x`;
- `md/[[...slug]]/route.ts`: static page markdown. Rich text is converted via `convertLexicalToMarkdown` from `@payloadcms/richtext-lexical`, each block has its own `toMarkdown.ts`;
- `<link rel="alternate" type="text/markdown">` in head;
- `llms.txt` and `llms-full.txt` are generated from the CMS.

**Redirects:**
- `next.config.ts redirects()`:
  - `/discord`, `/coin_info.json`, `/milan*` — 302/303, as now;
  - `/terms.html`, `/privacy.html`, `/testnet.html` — 308 (SEO fix);
- `downloads/[file]/route.ts`: 303 to the URL from the `releases` global, all 19 file names from `.htaccess`.

## 4.1 Security

**Users (`src/payload/collections/Users.ts`), no self-registration:**
- `roles` field: `admin` | `editor`. Only admin can change a role (field-level access, so a user can't escalate their own privileges);
- user `create` and `delete` — admin only. `read`/`update`: admin sees and edits everyone, editor — only themselves;
- first-user registration is closed. In `onInit` an admin is created from `ADMIN_EMAIL` and `ADMIN_PASSWORD` if there are no users. In production `proxy.ts` returns 404 for `/admin/create-first-user` and `/api/users/first-register`. This way nobody can register first on a fresh deploy;
- `auth`: `maxLoginAttempts: 5`, `lockTime: 15 min`, `tokenExpiration: 2 h`; cookies `secure`, `sameSite: 'Lax'`;
- no email adapter, "forgot password" doesn't work, passwords are reset by an admin. SMTP can be added later if needed.

**Content permissions:**
- `pages`: only `_status = published` is publicly readable, drafts are visible only to logged-in users. The frontend uses the Local API and explicitly filters for published content;
- editor can manage pages, media, header, footer, releases. `site-settings`, `users` and the `RawHTML` field — admin only;
- `media`: files are publicly readable. Allowed: `image/png|jpeg|webp|avif|gif|svg+xml`; **only admin can upload SVG**, it is sanitized on upload via DOMPurify (svg profile), and `/api/media/file/*.svg` is served with `Content-Security-Policy: sandbox; script-src 'none'`. The home page's animated scenes don't go into media (they live in `public/animation/`).

**XSS protection in content:**
- `RawHTML` is rendered via `sanitize-html` with an allowlist of tags and attributes, without `script`, `on*` and `style` with `url()`;
- rich text links are checked by a scheme validator: allowed are `http`, `https`, `mailto`, `obyte:`, `obyte-tn:`, relative. `javascript:` is forbidden;
- `TextcoinBanner` accepts only mnemonic words matching `^[a-z0-9-]+$`, otherwise ignores the hash, and outputs them via `textContent`.

**Payload API and config:**
- GraphQL is disabled (`graphQL.disable: true`), it isn't used;
- the demo route `src/app/my-route` is removed;
- `cors` and `csrf` are restricted to `NEXT_PUBLIC_SERVER_URL`;
- the `next/preview` preview route checks for a logged-in user via `payload.auth`, a secret in the query alone is not enough;
- there is no public revalidation endpoint, revalidation is triggered only from hooks.

**HTTP headers** (`next.config.ts headers()`):
- CSP:
  - `default-src 'self'`
  - `img-src 'self' data: https://i.ytimg.com`
  - `frame-src https://www.youtube-nocookie.com https://player.vimeo.com`
  - `form-action 'self' https://static.mailerlite.com`
  - `script-src 'self' 'unsafe-inline'` — no nonce: a nonce makes every page dynamic and breaks SSG (decision 2026-11-17); XSS protection comes from content sanitization
  - `frame-ancestors 'self'`
- HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.

**Infrastructure:**
- `PAYLOAD_SECRET`, `ADMIN_*` come only from env. Without `PAYLOAD_SECRET` the app doesn't start;
- Docker runs as non-root (already the case in the Dockerfile);
- Cloudflare: WAF rate limit on `/api/users/login`; Cloudflare Access (zero trust) in front of `/admin` and `/api/users*` is recommended;
- backups: daily SQLite via `sqlite3 .backup` + rsync of `media`, kept for 14 days;
- in CI, `pnpm audit --prod` and Renovate for dependency updates.

## 5. Content migration: `scripts/migrate-grav.ts`

The script runs via the Local API (`pnpm migrate:grav --source old-site/docroot`). It is idempotent: it upserts by path and compares media by sha1.

Steps:
1. Walk `user/pages`. The `NN.` prefix sets the order and the "in menu" flag; the folder hierarchy gives `parent`.
2. Page modules (`_name/template.md`) are mapped into layout blocks respecting `content.order.custom`. `visible:false` modules (`_checkout`) are skipped.
3. Module frontmatter is moved into block fields. Paths `/user/themes/obyte/assets/...` (and `../../user/...`, `?v1`) are uploaded to `media`; a relation to the uploaded file is used. Links with `?target=_blank&rel=noopener` in Grav syntax become link attributes.
4. Article bodies:
   - gray-matter → `unified` (remark-parse → remark-rehype → rehype-raw) → HAST tree;
   - a class-based pattern recognizer emits content blocks;
   - simple fragments are converted via `convertHTMLToLexical` (jsdom is already in devDeps);
   - `<br><br>` are normalized.
5. Header and footer are filled from the menu tree and `footer.html.twig`. Releases is filled from `.htaccess`. Site settings — from `site.yaml`.
6. Report `migration-report.md`: what went into `RawHTML`, images without alt, broken links.

New dependencies for the script: `gray-matter`, `unified`, `remark-parse`, `remark-rehype`, `rehype-raw`, `hast-util-*`.

## 6. Milestones (≈ 6–7 weeks)

| # | Milestone | Deliverable |
|---|---|---|
| M0 | Infrastructure (2 days) | Tailwind v4, folder structure, eslint-boundaries, fonts (subset), template demo code removed, `.env.example`, Dockerfile with a media volume |
| M1 | Baselines (1–2 days) | `capture-baseline.ts`: screenshots of all 31 URLs at 1440/768/375 from obyte.org, dump of `<head>` and computed styles of key selectors into `tests/fixtures/baseline/` |
| M2 | Payload schema and security (4 days) | collections, globals, all blocks (config only), plugins, revalidation hooks, roles and access control, admin seed, closed registration, upload restrictions, `generate:types` |
| M3 | Content migration (4–5 days) | `migrate-grav.ts` + vitest for the parser (fixtures from real md), empty `RawHTML` report |
| M4 | Shell (3 days) | layout, Header, MobileMenu, Footer + Newsletter, TextcoinBanner, catch-all route, RenderBlocks |
| M5 | Home page (6–7 days) | Hero, Technology (SMIL scenes + timers + Replay), Independent, BigChanges, Timeline, Download, Team, Exchanges; visual test for each section and frame-by-frame animation comparison |
| M6 | Inner pages (8–10 days) | Article/TextWide + content blocks + page variants; groups: platform/*, technology, developers, faq, legal, events/grants/resources, iot/poc, testnet |
| M7 | SEO and agents (3 days) | meta, JSON-LD, sitemap, robots, `.md`, `llms*`, proxy, redirects, `/downloads` |
| M8 | Performance (2–3 days) | Lighthouse CI with budgets, AVIF quality tuning, preload and bundle checks |
| M9 | QA and deploy (3–4 days) | full visual run, linkinator, meta check, deploy to VPS, Cloudflare, final migration re-run, DNS |

We start with M0 → M1 → M2 → M3.

## 7. Verification

- **Visual tests** (`tests/visual/`, Playwright `toHaveScreenshot`): each page × 3 widths is compared with the obyte.org reference. Animations disabled, Swiper pinned, tolerance about 1% of pixels. Any mismatch is a bug.
- **Animations** (`tests/visual/animation.spec.ts`):
  - SMIL scenes are compared frame by frame with the old site. Using `object.contentDocument.documentElement.pauseAnimations()` + `setCurrentTime(t)` we capture `.clip-container` frames at t = 0, 2, 5, 8, 11 s for each scene, on obyte.org and on the new site;
  - scene switches at 12 and 32 s, "Replay" and auto-restart on scroll are checked via `page.clock`;
  - hover states for Team, social links and exchanges — separate screenshots;
  - Timeline: starting position on the last slide and arrow navigation.
- **Meta** (`tests/seo/meta.spec.ts`): the set of head tags is compared with the reference. Allowed differences: the `twitter:description` fix, the FAQ JSON-LD move, the markdown `alternate`, Next service tags.
- **Security** (`tests/int/access.int.spec.ts` + e2e):
  - an anonymous user can't create a user via REST or via first-register in prod mode;
  - editor can't create a user and can't change their own role;
  - an anonymous user can't see drafts via `/api/pages`;
  - uploading SVG or HTML to media is rejected;
  - `RawHTML` with `<script>` and `onerror` is sanitized;
  - a `javascript:` link fails validation;
  - lockout after 5 failed logins;
  - security headers are present on pages.
- **Unit** (`tests/int/`, vitest): migration parser, block `toMarkdown`, meta building.
- **e2e:** textcoin (`/#textcoin?test words`), mobile menu, Show all, Timeline, `/downloads/Obyte-win64.exe` → 303, `/platform.md` and `Accept: text/markdown`, `/llms.txt`, `/sitemap.xml`, publishing in the admin updates the page.
- **Lighthouse CI** (`@lhci/cli`): Performance ≥ 95, SEO = 100, LCP < 2.0 s, CLS < 0.05, TBT < 100 ms, JS < 60 KB gzip.
- **Links:** linkinator over the built site; crawler over all old URLs (only 200 or an expected redirect).
- **Each milestone is closed** with `pnpm lint`, `pnpm build`, `pnpm test:int`, `pnpm test:e2e`.

## Status

| Milestone | Status | Notes |
|---|---|---|
| M0 | ✅ | Tailwind v4 (`--spacing: 1px`, Spectre breakpoints +1px, fluid root font 16→20px), subset fonts, eslint-boundaries |
| M1 | ✅ | `pnpm baseline` → `tests/fixtures/baseline/old` (gitignored, 126 MB; **archive before the DNS switch**) |
| M2 | ✅ | schema, roles, closed registration, SVG admin-only + DOMPurify + CSP sandbox; 26 security tests |
| M3 | ✅ | `pnpm migrate:grav` — 31 pages, 175 media, idempotent; report `migration-report.md`; 6 RawHTML (page layouts of IoT, PoC, distribution, grants, prosaic) → close in M6 |
| M4 | ✅ | layout: Header (dropdown, scroll-shrink), MobileNav, Footer + MailerLite form, TextcoinBanner, catch-all SSG route, RichText + temporary block renderers; fonts = the ones the old site actually uses (Open Sans v17, Noto Sans v9, see scripts/build-fonts.sh); CSP without nonce; pixel comparison `pnpm visual:diff`: header ≤0.7%, footer 0.07–0.15%, mobile menu 0.35% |
| M5 | ✅ | home page: Hero, Technology (SMIL scenes as is in `public/animation/`, timers 0/12/32 s, Replay, restart on scroll, lazy SVGs, reduced-motion), Independent, BigChanges, Timeline (custom slider instead of Swiper 4, no jump before hydration), Download, Team (members are a `team-members` collection with drag-and-drop ordering; the "Show all" threshold and labels are block fields), Exchanges. Checked at 7 widths (1440…375): sections ≤1% (exchange logo resampling ≤2.5%), heights match; animation frames ≤0.12% (`pnpm compare:animation`). Findings: the reference is the served `theme.min.css` (media rule order differs from SCSS); the old site's italic is Open Sans Italic from Google (via MailerLite), added; CSP `frame-src 'self'` (Chrome loads `<object>` as a frame); module anchors as in Grav (`#the-future-is-br-b-decentralized-b`, `#big-changes`) |
| M6 | ✅ | inner pages, **0 RawHTML**. Styling decision (agreed): hybrid — Tailwind for components/shell/home page, page styles ported from the served `theme.min.css` by the `pnpm extract:legacy-css` generator → `src/shared/styles/legacy.css` (+ manual `legacy-fixes.css`); content blocks render the old markup and classes. New blocks/fields: Box (styled wrappers, `p.bullet`, nested `a > b`), Spacer, Distribution table, Events/FAQ feed, Email link (inline), image styles, FlexBlock variants. Lists in the admin (Lists group): Team, Exchanges, Coin trackers, Social links, Timeline, Events, FAQ. Site settings: emails and links (`{github}`, `{explorer}`, `{discord}`, `{telegram}` in any links). Wallet releases: files per platform (mainnet/testnet), Mobile apps, Download names → `/downloads/<name>` 303. Image previews in the admin (thumbnail), full-size WebP for content. Found: the old site renders Open Sans 400/700 and Noto Sans from Google (the MailerLite import beat the theme files) — fonts rebuilt. Checked 31 pages × 1440/768/375: ≈95% of snapshots < 1%; the rest — video poster instead of an empty iframe, photo recompression |
| M7 | ✅ | `generateMetadata` (`payload/pageMeta.ts`): title/description/OG/twitter/canonical as on the old site, fixes — page `twitter:description`, per-page share image (SEO → image), old `phone-shadow/phone-twitter.png` at the same URLs; `<link rel=alternate type=text/markdown>`. JSON-LD (`payload/structuredData.ts`): FAQPage from the FAQ collection only on /faq, Organization + WebSite + SoftwareApplication on the home page, BreadcrumbList on the rest. Markdown twins: `/x.md`, `/index.md`, `Accept: text/markdown` → `src/proxy.ts` → static `/md/[[...slug]]`; Lexical serializer `shared/lib/lexicalMarkdown.ts` + a `toMarkdown.ts` per block. `/llms.txt`, `/llms-full.txt`, `/sitemap.xml` (priority/lastmod), `/robots.txt` (AI bots allowed, `/admin` and `/api/` blocked, except `/api/media/`). Redirects: `*.html` → 308, `/coin_info.json`, `/milan*` → 303, `/sitemap` → `/sitemap.xml`, `/discord` → 303 to the address from Site settings. Head check of 31 pages against the reference: matches (home page: canonical without trailing `/`). Tests: e2e `seo.e2e.spec.ts`, int `lexicalMarkdown.int.spec.ts`. Note for Cloudflare: HTML and markdown at the same URL differ by `Accept` — don't cache HTML at the edge without taking the header into account |
| M8 | ✅ | Images: inner page backgrounds from the old theme → WebP during legacy CSS generation (8.2 → 1.4 MB); on phones (≤768px) — an 800px center crop of the same background (same pixels, ×2–3 lighter; only for backgrounds at natural size); home page design images → WebP; /platform cards — the media library WebP variant instead of PNG (−1.5 MB). LCP image preload (hero and page header backgrounds, `LegacyBackgroundPreload`, `legacyBackgrounds.ts` is generated) — via a rendered `<link>`, not `ReactDOM.preload` (hints from RSC would fire on prefetch). Menu/footer links without prefetch (`SiteLink`): otherwise every page fetched ~17 menu pages with their images in the background (>1 MB). Fonts: preloaded once (`ReactDOM.preload`). Cache: `/api/media/file`, `/animation`, `/user`, PDF — one day + SWR one week. Browser JS 194 KB gzip (tailwind-merge removed from the client; the rest is React/Next). Lighthouse (`pnpm perf`, budgets in `lighthouserc.cjs`): desktop 99–100 (LCP 0.6–1.0 s), mobile 87–97 (simulated; real slow 4G load: LCP ≈ 2.1 s), CLS ≈ 0, TBT ≤ 10 ms, SEO 100, best practices 96–100. Accessibility 92–96: contrast/link underlines of the old design — left as is for fidelity. Locally Lighthouse sees an extra internal redirect of ~0.6 s due to HSTS on http — it doesn't exist on https |
| M9 | ⏳ | QA: `pnpm check:links` — all 31 pages + markdown, 811 internal links/resources: 0 errors (found and fixed: Payload re-encoded `{explorer}` links on save → hook removed, old values are decoded); 19 `/downloads/*` and the JSON for AAs match the old site; external: ~18 unreachable (dead sites, LinkedIn/App Store block bots) — content of the old site. Deploy prepared: Dockerfile fixed (`public/` wasn't copied, no `.dockerignore`; prerender from a DB snapshot via `--build-context data=…`, the DB doesn't end up in the image; healthcheck), schema migrations `src/migrations` + `prodMigrations`, `pnpm db:export` (current DB with all data + media → prod, schema is checked against migrations), `deploy/` (compose, deploy.sh, backup.sh, README with a DNS/Cloudflare checklist). Image built and verified locally: e2e 16/16, links 0 errors. Remaining: server, Cloudflare, DNS switch Since then: the site **ships with its content** — `seed/` (database without accounts + uploads, `pnpm db:export`) is committed; Docker entrypoint / `pnpm start:prod` / `pnpm db:init` fill an empty installation from it, a live database is never touched; builds pre-render from `seed/` or (deploy.sh) a snapshot of the live database. **Admin only from env**: one account from `ADMIN_EMAIL`/`ADMIN_PASSWORD`, synced on every start (others removed), nobody can create/edit/delete accounts; exports, seed and backups contain no accounts (wiped with VACUUM). Production without Docker: `pnpm start:prod` (standalone, `MEDIA_DIR`, refuses a dev database). All documentation in English. |
