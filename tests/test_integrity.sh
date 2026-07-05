#!/usr/bin/env bash
# Unit tests for the integrity checker (core/integrity-check.sh).
set -u
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=tests/lib.sh
source "$HERE/lib.sh"
# shellcheck source=core/integrity-check.sh
source "$HERE/../core/integrity-check.sh"

echo "== integrity verification =="

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

payload="$WORK/system_a.img"
printf 'nexus-immutable-rootfs' >"$payload"
good_hash="$(sha256sum "$payload" | awk '{print $1}')"

assert_success "verify passes with the correct hash" verify_system "$payload" "$good_hash"
assert_fail "verify fails with a wrong hash" verify_system "$payload" "deadbeef"

test_summary
