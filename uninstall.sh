#!/usr/bin/env bash
# PowerPulse Desklet uninstaller
set -euo pipefail

UUID="powerpulse@vicman.app"
DEST="${HOME}/.local/share/cinnamon/desklets/${UUID}"
LOCALE_BASE="${HOME}/.local/share/locale"

echo "=== PowerPulse Desklet uninstaller ==="
echo

if [[ ! -d "${DEST}" ]]; then
  echo "Nothing to remove: ${DEST} does not exist."
  exit 0
fi

echo "Removing: ${DEST}"
rm -rf "${DEST}"

# Remove compiled translations installed by install.sh
if [[ -d "${LOCALE_BASE}" ]]; then
  find "${LOCALE_BASE}" -type f -name "${UUID}.mo" -delete 2>/dev/null || true
fi

echo
echo "Removed PowerPulse desklet files."
echo "If the desklet is still on the desktop, remove it from:"
echo "  Desklets settings → PowerPulse → Remove"
echo "Or reload Cinnamon (Alt+F2 → r → Enter)."
echo
echo "Done."
