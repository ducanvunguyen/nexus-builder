#!/usr/bin/env bash
# Unit tests for the A/B partition manager (core/ab-mgr.sh).

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=tests/lib.sh
source "$HERE/lib.sh"
# shellcheck source=core/ab-mgr.sh
source "$HERE/../core/ab-mgr.sh"

# Isolate all state in a throwaway boot-env file. Start with it absent so we
# also exercise the "no environment written yet" default path.
export NEXUS_BOOTENV
NEXUS_BOOTENV="$(mktemp)"
rm -f "$NEXUS_BOOTENV"
trap 'rm -f "$NEXUS_BOOTENV" "$NEXUS_BOOTENV".*' EXIT

echo "Running: A/B partition manager"

assert_eq "A" "$(get_active_slot)" "defaults to slot A when no env exists"

set_active_slot B >/dev/null 2>&1
assert_eq "B" "$(get_active_slot)" "set_active_slot B persists"

switch_boot_slot A >/dev/null 2>&1
assert_eq "A" "$(get_active_slot)" "switch_boot_slot A works (back-compat alias)"

assert_eq "B" "$(toggle_slot 2>/dev/null)" "toggle from A returns B"
assert_eq "B" "$(get_active_slot)" "toggle persisted the new slot"

assert_fail "invalid slot is rejected" set_active_slot Z
assert_eq "B" "$(get_active_slot)" "state is unchanged after an invalid set"

leftovers="$(find "$(dirname "$NEXUS_BOOTENV")" -maxdepth 1 \
    -name "$(basename "$NEXUS_BOOTENV").*" 2>/dev/null | wc -l | tr -d ' ')"
assert_eq "0" "$leftovers" "no temp files left behind (writes are atomic)"

test_summary
