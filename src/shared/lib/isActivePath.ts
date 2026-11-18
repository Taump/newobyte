/** Grav `p.active or p.activeChild`: the link is the current page or one of its ancestors. */
export const isActivePath = (pathname: string, href: string) =>
  href.startsWith('/') &&
  !href.startsWith('/#') &&
  (pathname === href || (href !== '/' && pathname.startsWith(`${href}/`)))
