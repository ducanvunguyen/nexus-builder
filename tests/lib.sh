#!/usr/bin/env bash
# Tiny assertion helpers shared by the Nexus-Builder test files.
#
# Each test file sources this, runs some assertions, and ends with
# `test_summary`, whose exit status becomes the file's exit status (non-zero
# if any assertion failed). The runner (run.sh) aggregates those statuses.

NEXUS_TEST_PASS=0
NEXUS_TEST_FAIL=0

# assert_eq <expected> <actual> <message>
assert_eq() {
    if [[ "$1" == "$2" ]]; then
        echo "  [PASS] $3"
        NEXUS_TEST_PASS=$((NEXUS_TEST_PASS + 1))
    else
        echo "  [FAIL] $3 (expected '$1', got '$2')"
        NEXUS_TEST_FAIL=$((NEXUS_TEST_FAIL + 1))
    fi
}

# assert_ok <message> <cmd...>  — passes when the command succeeds.
assert_ok() {
    local msg="$1"
    shift
    if "$@" >/dev/null 2>&1; then
        echo "  [PASS] $msg"
        NEXUS_TEST_PASS=$((NEXUS_TEST_PASS + 1))
    else
        echo "  [FAIL] $msg (command failed: $*)"
        NEXUS_TEST_FAIL=$((NEXUS_TEST_FAIL + 1))
    fi
}

# assert_fail <message> <cmd...>  — passes when the command fails.
assert_fail() {
    local msg="$1"
    shift
    if "$@" >/dev/null 2>&1; then
        echo "  [FAIL] $msg (command unexpectedly succeeded: $*)"
        NEXUS_TEST_FAIL=$((NEXUS_TEST_FAIL + 1))
    else
        echo "  [PASS] $msg"
        NEXUS_TEST_PASS=$((NEXUS_TEST_PASS + 1))
    fi
}

# Print a per-file summary and return non-zero if anything failed.
test_summary() {
    echo "  ---"
    echo "  passed: ${NEXUS_TEST_PASS}, failed: ${NEXUS_TEST_FAIL}"
    [[ "$NEXUS_TEST_FAIL" -eq 0 ]]
}
