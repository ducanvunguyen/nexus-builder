#!/usr/bin/env bash
# Unit tests for the integrity checker (core/integrity-check.sh).

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=tests/lib.sh
source "$HERE/lib.sh"
# shellcheck source=core/integrity-check.sh
source "$HERE/../core/integrity-check.sh"

echo "Running: integrity check"

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
printf 'nexus-builder\n' >"$tmp"

expected="$(sha256sum "$tmp" | awk '{print $1}')"

assert_eq "$expected" "$(hash_file "$tmp")" "hash_file matches sha256sum"
assert_ok "verify_system accepts a correct digest" verify_system "$tmp" "$expected"
assert_fail "verify_system rejects a wrong digest" verify_system "$tmp" "deadbeef"
assert_fail "verify_system rejects a missing file" verify_system "/no/such/file" "$expected"

test_summary
