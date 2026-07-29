#!/usr/bin/env bash
# Quick diagnostic helper for PowerPulse
set -euo pipefail

echo "=== PowerPulse diagnostics ==="
echo
echo "-- Cinnamon --"
cinnamon --version 2>/dev/null || echo "cinnamon: not found"
echo
echo "-- UPower devices --"
if command -v upower >/dev/null 2>&1; then
  upower -e || true
else
  echo "upower: not found"
fi
echo
echo "-- HeadsetControl --"
if command -v headsetcontrol >/dev/null 2>&1; then
  echo "binary: $(command -v headsetcontrol)"
  headsetcontrol -b || true
else
  echo "headsetcontrol: not found (optional)"
fi
echo
echo "-- Installed desklet --"
DEST="${HOME}/.local/share/cinnamon/desklets/powerpulse@vicman.app"
if [[ -d "${DEST}" ]]; then
  ls -la "${DEST}"
else
  echo "Not installed at ${DEST}"
fi
