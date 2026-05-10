#!/bin/bash
# Unit test for AB Manager logic

source "$(dirname "$0")/../core/ab-mgr.sh"

echo "Running Test: AB Slot Switching..."

# Test 1: Default slot
slot=$(get_active_slot)
if [ "$slot" == "A" ]; then
    echo "[PASS] Initial slot is A"
else
    echo "[FAIL] Initial slot is $slot"
fi

# Test 2: Switch to B
set_active_slot "B"
slot=$(get_active_slot)
if [ "$slot" == "B" ]; then
    echo "[PASS] Switched to B successfully"
else
    echo "[FAIL] Failed to switch to B"
fi
