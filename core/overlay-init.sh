#!/bin/bash
# Description: This script initializes an OverlayFS to keep the 
# System Partition read-only, preventing SD card corruption.

setup_immutable_root() {
    local OVERLAY_DIR="/mnt/overlay"
    local WORK_DIR="$OVERLAY_DIR/work"
    local UPPER_DIR="$OVERLAY_DIR/upper"

    echo "[Nexus-Core] Hardening system: Mounting RootFS as Read-Only..."
    
    # Mount tmpfs to handle runtime changes in RAM
    mount -t tmpfs tmpfs $OVERLAY_DIR
    mkdir -p $UPPER_DIR $WORK_DIR

    # Apply OverlayFS
    mount -t overlay overlay -o lowerdir=/,upperdir=$UPPER_DIR,workdir=$WORK_DIR /etc
    
    if [ $? -eq 0 ]; then
        echo "[SUCCESS] Immutable layer active. Changes are volatile."
    else
        echo "[ERROR] Failed to protect RootFS."
        exit 1
    fi
}
