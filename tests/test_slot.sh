#!/usr/bin/env bash
# Unit tests for the A/B slot manager (core/ab-mgr.sh).
set -u
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=tests/lib.sh
source "$HERE/lib.sh"

# Isolate the U-Boot env in a temp file so tests never touch a real device.
NEXUS_UBOOT_ENV="$(mktemp)"
export NEXUS_UBOOT_ENV
trap 'rm -f "$NEXUS_UBOOT_ENV" "${NEXUS_UBOOT_ENV}".tmp.* 2>/dev/null' EXIT

# shellcheck source=core/ab-mgr.sh
source "$HERE/../core/ab-mgr.sh"

echo "== A/B slot manager =="

# A fresh device (no env file) defaults to slot A.
rm -f "$NEXUS_UBOOT_ENV"
assert_eq "A" "$(get_active_slot)" "defaults to slot A when no env exists"

# Switching to B is persisted.
set_active_slot "B"
assert_eq "B" "$(get_active_slot)" "set_active_slot B persists"

# other_slot always names the inactive slot.
assert_eq "A" "$(other_slot)" "other_slot is A while B is active"

# Switching back to A is persisted.
set_active_slot "A"
assert_eq "A" "$(get_active_slot)" "set_active_slot A persists"
assert_eq "B" "$(other_slot)" "other_slot is B while A is active"

# Invalid slot designations are rejected.
assert_fail "invalid slot 'Z' is rejected" set_active_slot "Z"
assert_fail "empty slot is rejected" set_active_slot ""

test_summary
