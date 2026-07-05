#!/usr/bin/env bash
# Nexus-Builder Image Generator
#
# Usage:
#   build-image.sh [--dry-run] [board.conf]
#
# With --dry-run the partition layout is printed but no image is written and
# no external tools are required, which makes the build path safe to exercise
# in CI and on machines without the disk utilities installed.

set -euo pipefail

DRY_RUN=0
BOARD_CONF=""

for arg in "$@"; do
    case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    -h | --help)
        echo "Usage: build-image.sh [--dry-run] [board.conf]"
        exit 0
        ;;
    *) BOARD_CONF="$arg" ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BOARD_CONF="${BOARD_CONF:-$SCRIPT_DIR/../boards/rk3576-flipper.conf}"

if [[ ! -r "$BOARD_CONF" ]]; then
    echo "[ERROR] Board profile not found: $BOARD_CONF" >&2
    exit 1
fi

# shellcheck source=/dev/null
source "$BOARD_CONF"

echo "--------------------------------------------------"
echo "Building Image for: ${BOARD_NAME} (${SOC})"
echo "--------------------------------------------------"

IMAGE_OUT="output/nexus-os-${BOARD_NAME}.img"

print_layout() {
    echo "Partition layout:"
    echo "  1  loader     16M"
    echo "  2  system_a   1024M"
    echo "  3  system_b   1024M   (A/B redundancy)"
    echo "  4  userdata   rest"
}

if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "[DRY-RUN] No image will be written."
    print_layout
    echo "[DRY-RUN] Would create: $IMAGE_OUT"
    exit 0
fi

# Real builds need the disk tooling; fail early with a clear message otherwise.
missing=()
for tool in truncate sgdisk; do
    command -v "$tool" >/dev/null 2>&1 || missing+=("$tool")
done
if [[ ${#missing[@]} -gt 0 ]]; then
    echo "[ERROR] Missing required tools: ${missing[*]}" >&2
    echo "        Install them (e.g. 'apt-get install gdisk coreutils') or re-run with --dry-run." >&2
    exit 1
fi

mkdir -p output
truncate -s 2G "$IMAGE_OUT"

# Formatting with GPT and naming partitions.
sgdisk -n 1:0:+16M -c 1:"loader" "$IMAGE_OUT"
sgdisk -n 2:0:+1024M -c 2:"system_a" "$IMAGE_OUT"
sgdisk -n 3:0:+1024M -c 3:"system_b" "$IMAGE_OUT"
sgdisk -n 4:0:0 -c 4:"userdata" "$IMAGE_OUT"

echo "[DONE] Image generated at $IMAGE_OUT"
echo "You can now flash this to an SD card using 'dd' or BalenaEtcher."
