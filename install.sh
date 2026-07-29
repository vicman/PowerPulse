#!/usr/bin/env bash
# PowerPulse Desklet installer for Linux Mint Cinnamon
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UUID="powerpulse@vicman.app"
SRC="${SCRIPT_DIR}/${UUID}"
DEST_DIR="${HOME}/.local/share/cinnamon/desklets"
DEST="${DEST_DIR}/${UUID}"

echo "=== PowerPulse Desklet installer ==="
echo

if [[ ! -d "${SRC}" ]]; then
  echo "ERROR: Source directory not found: ${SRC}" >&2
  exit 1
fi

if ! command -v cinnamon >/dev/null 2>&1; then
  echo "ERROR: Cinnamon was not found in PATH." >&2
  echo "This desklet requires Linux Mint Cinnamon." >&2
  exit 1
fi

CINNAMON_VERSION="$(cinnamon --version 2>/dev/null || true)"
echo "Detected: ${CINNAMON_VERSION:-Cinnamon}"

if command -v headsetcontrol >/dev/null 2>&1; then
  echo "HeadsetControl: found ($(command -v headsetcontrol))"
else
  echo "HeadsetControl: not found (optional — UPower devices will still work)"
fi

mkdir -p "${DEST_DIR}"

if [[ -d "${DEST}" ]]; then
  echo "Updating existing installation at ${DEST}"
  # Replace contents without deleting the destination path itself aggressively.
  find "${DEST}" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
else
  mkdir -p "${DEST}"
fi

cp -a "${SRC}/." "${DEST}/"

# Compile translations if gettext tools are available.
if command -v msgfmt >/dev/null 2>&1; then
  LOCALE_BASE="${HOME}/.local/share/locale"
  for po in "${DEST}/po"/*.po; do
    [[ -f "${po}" ]] || continue
    lang="$(basename "${po}" .po)"
    [[ "${lang}" == "en" ]] && continue
    out_dir="${LOCALE_BASE}/${lang}/LC_MESSAGES"
    mkdir -p "${out_dir}"
    msgfmt -o "${out_dir}/${UUID}.mo" "${po}" && echo "Installed translation: ${lang}"
  done
fi

echo
echo "Installed to: ${DEST}"
echo
echo "How to add the desklet:"
echo "  1. Right-click the desktop → Add Desklets..."
echo "  2. Or open: Menu → Preferences → Desklets"
echo "  3. Find \"PowerPulse\" and add it to the desktop"
echo
echo "Optional diagnostic commands:"
echo "  upower -e"
echo "  headsetcontrol -b"
echo "  ls \"${DEST}\""
echo
echo "Done."
