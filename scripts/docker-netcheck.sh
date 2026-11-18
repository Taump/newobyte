#!/bin/sh
# Build-time network check (Dockerfile): prints where the build downloads from and whether each
# source answers, so a hanging/failing build log shows the cause. Never fails the build itself.
#   sh scripts/docker-netcheck.sh <url> [<url> …]
echo "── netcheck ──────────────────────────────────────────"
echo "apk repositories:"
sed 's/^/  /' /etc/apk/repositories
echo "npm registry: ${npm_config_registry:-default}"
echo "resolv.conf: $(grep -E '^nameserver' /etc/resolv.conf | tr '\n' ' ')"
for url in "$@"; do
  host=$(echo "$url" | sed -E 's|^[a-z]+://([^/:]+).*|\1|')
  addrs=$(nslookup "$host" 2>/dev/null | awk '/^Address/ && !/[#:]53$/ {print $NF}' | head -3 | tr '\n' ' ')
  start=$(date +%s)
  if wget -q -T 10 -O /dev/null "$url" 2>/dev/null; then status=OK; else status=FAIL; fi
  echo "$status  $(($(date +%s) - start))s  $url  [${addrs:-no DNS answer}]"
done
echo "──────────────────────────────────────────────────────"
