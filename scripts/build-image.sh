#!/bin/bash
# Nexus-Builder Image Generator

source "$(dirname "$0")/../boards/rk3576-flipper.conf"

echo "--------------------------------------------------"
echo "Building Image for: $BOARD_NAME ($SOC)"
echo "--------------------------------------------------"

# Create a 2GB Sparse Image
IMAGE_OUT="output/nexus-os-${BOARD_NAME}.img"
mkdir -p output
truncate -s 2G "$IMAGE_OUT"

# Formatting with GPT and naming partitions
sgdisk -n 1:0:+16M   -c 1:"loader"   "$IMAGE_OUT"
sgdisk -n 2:0:+1024M -c 2:"system_a" "$IMAGE_OUT"
sgdisk -n 3:0:+1024M -c 3:"system_b" "$IMAGE_OUT"
sgdisk -n 4:0:0      -c 4:"userdata" "$IMAGE_OUT"

echo "[DONE] Image generated at $IMAGE_OUT"
echo "You can now flash this to an SD card using 'dd' or BalenaEtcher."
