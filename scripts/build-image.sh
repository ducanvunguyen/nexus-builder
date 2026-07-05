#!/usr/bin/env bash
# Nexus-Builder Image Generator
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Board profile: use the first argument if provided, else the default board.
BOARD_CONF="${1:-$SCRIPT_DIR/../boards/rk3576-flipper.conf}"
[[ -f "$BOARD_CONF" ]] || { echo "[ERROR] Board config not found: $BOARD_CONF" >&2; exit 1; }

# shellcheck disable=SC1090  # config path is resolved at runtime
source "$BOARD_CONF"

echo "--------------------------------------------------"
echo "Building Image for: $BOARD_NAME ($SOC)"
echo "--------------------------------------------------"

# Fail early with a clear message instead of a cryptic error mid-build.
for tool in truncate sgdisk; do
    command -v "$tool" >/dev/null 2>&1 || { echo "[ERROR] Required tool '$tool' not found." >&2; exit 1; }
done

# Create a sparse image large enough for the A/B layout.
# The two 1 GiB system slots plus the 16 MiB loader and GPT overhead exceed
# 2 GiB, so a 4 GiB image is the smallest size that fits both slots and leaves
# room for the userdata partition.
IMAGE_OUT="output/nexus-os-${BOARD_NAME}.img"
mkdir -p output
truncate -s 4G "$IMAGE_OUT"

# Formatting with GPT and naming partitions
sgdisk -n 1:0:+16M   -c 1:"loader"   "$IMAGE_OUT"
sgdisk -n 2:0:+1024M -c 2:"system_a" "$IMAGE_OUT"
sgdisk -n 3:0:+1024M -c 3:"system_b" "$IMAGE_OUT"
sgdisk -n 4:0:0      -c 4:"userdata" "$IMAGE_OUT"

echo "[DONE] Image generated at $IMAGE_OUT"
echo "You can now flash this to an SD card using 'dd' or BalenaEtcher."
