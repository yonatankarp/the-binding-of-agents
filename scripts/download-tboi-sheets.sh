#!/usr/bin/env bash
# Downloads source sprite sheets from The Spriters Resource into sprite-sources/sheets/.
# Maintainer-run, one-time. The downloaded sheets are gitignored.
#
# Sheets are NOT auto-discoverable; the URLs below are curated by the maintainer
# based on what's needed for the sprite manifest. Verify each URL resolves to a
# direct PNG before running. Update as needed.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$REPO_ROOT/sprite-sources/sheets"
mkdir -p "$DEST"

# Source sheets (curated by maintainer). Format: <local-filename> <url-to-direct-png>.
# These direct URLs are illustrative - verify against the actual Spriters Resource
# pages before running this script (browse to the resource page, copy the direct
# PNG download link, update below).
SHEETS=(
  "playable-characters-repentance.png https://www.spriters-resource.com/resources/sheets/176/176014.png"
  "playable-characters-tainted.png   https://www.spriters-resource.com/resources/sheets/152/152315.png"
  "familiars-rebirth.png             https://www.spriters-resource.com/resources/sheets/152/152314.png"
)

for entry in "${SHEETS[@]}"; do
  read -r filename url <<< "$entry"
  out="$DEST/$filename"
  if [[ -f "$out" ]]; then
    echo "skip: $filename already present"
    continue
  fi
  echo "fetch: $filename"
  curl -fL -o "$out" "$url"
done

echo
echo "Sheets in $DEST:"
ls -la "$DEST"
