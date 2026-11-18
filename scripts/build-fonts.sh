#!/usr/bin/env bash
# Builds the self-hosted webfonts in public/fonts — the faces the old obyte.org actually renders.
#
# Verified in Chrome on the live site (document.fonts + loaded files + text widths): the page
# @imports MailerLite's Google Fonts mirror after the theme CSS, and for the same family/weight/
# style the later @font-face wins in its unicode-range (latin). So the old site renders:
#   Open Sans 300/600         → the theme's own v17 files
#   Open Sans 400/700 (+ ital)→ Google v44 (latin); the theme v17 files only for cyrillic
#   Noto Sans 400/700         → Google v42 (latin); the theme v9 700 only for cyrillic
#   (300-weight italic text uses 400 italic — the nearest italic face)
#
# Each face is split into -latin / -cyrillic files (+ -latin-ext for the Google one);
# src/app/(frontend)/fonts.css declares them with matching unicode-range, so an English page
# downloads only -latin files. File names carry the font version → immutable caching.
#
# Usage: scripts/build-fonts.sh [old-site/docroot/user/themes/obyte/fonts]
# Requires fonttools + brotli (pip install fonttools brotli); set FONTTOOLS / PYFTSUBSET if the
# tools are not on PATH.
set -euo pipefail

THEME_FONTS="${1:-old-site/docroot/user/themes/obyte/fonts}"
OUT="public/fonts"
FONTTOOLS="${FONTTOOLS:-fonttools}"
PYFTSUBSET="${PYFTSUBSET:-pyftsubset}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Google Fonts subset ranges (keep in sync with src/app/(frontend)/fonts.css)
LATIN="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"
LATIN_EXT="U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF"
CYRILLIC="U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116"

mkdir -p "$OUT"
rm -f "$OUT"/*.woff2

subset() { # <font file> <output name without suffix> <subset names…>
  local src="$1" name="$2"
  shift 2
  for sub in "$@"; do
    local range
    case "$sub" in
      latin) range="$LATIN" ;;
      latin-ext) range="$LATIN_EXT" ;;
      cyrillic) range="$CYRILLIC" ;;
    esac
    "$PYFTSUBSET" "$src" --unicodes="$range" --layout-features='*' --flavor=woff2 \
      --output-file="$OUT/$name-$sub.woff2"
  done
}

# Theme files (latin + cyrillic, like the originals). For 400/700 the latin range is served by
# the Google faces below (they win on the old page), the theme file only covers cyrillic.
for weight in 300 600; do
  src=$(ls "$THEME_FONTS"/open-sans/open-sans-v17-*-"$weight".ttf)
  subset "$src" "open-sans-v17-$weight" latin cyrillic
done
for weight in regular 700; do
  src=$(ls "$THEME_FONTS"/open-sans/open-sans-v17-*-"$weight".ttf)
  subset "$src" "open-sans-v17-${weight/regular/400}" cyrillic
done
subset "$THEME_FONTS/noto-sans/noto-sans-v9-cyrillic-ext_latin-700.ttf" noto-sans-v9-700 cyrillic

# Faces that only exist via MailerLite's Google Fonts mirror (the old page @imports it):
# Noto Sans 400 and Open Sans italic (the theme ships no italics). The mirror serves variable
# fonts → static instances; only the latin subset (the last @font-face block of the CSS).
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36"
google_static() { # <css family spec> <wght> <output name>
  curl -sf -A "$UA" "https://fonts.mailerlite.com/css?family=$1" -o "$TMP/g.css"
  local url
  url=$(grep -o 'url([^)]*)' "$TMP/g.css" | tail -1 | sed 's/url(\(.*\))/\1/')
  curl -sf "$url" -o "$TMP/var.woff2"
  # depending on the request the mirror serves a variable or an already-static file
  "$FONTTOOLS" varLib.instancer "$TMP/var.woff2" wght="$2" wdth=100 --static \
    -o "$TMP/static.ttf" >/dev/null 2>&1 ||
    "$FONTTOOLS" varLib.instancer "$TMP/var.woff2" wght="$2" --static \
      -o "$TMP/static.ttf" >/dev/null 2>&1 ||
    cp "$TMP/var.woff2" "$TMP/static.ttf"
  subset "$TMP/static.ttf" "$3" latin
}
google_static 'Noto+Sans:400' 400 noto-sans-v42-400
google_static 'Noto+Sans:700' 700 noto-sans-v42-700
google_static 'Open+Sans:400' 400 open-sans-v44-400
google_static 'Open+Sans:700' 700 open-sans-v44-700
google_static 'Open+Sans:400i' 400 open-sans-v44-400italic
google_static 'Open+Sans:700i' 700 open-sans-v44-700italic

ls -l "$OUT"/*.woff2 | awk '{print $5, $9}'
