#!/usr/bin/env bash
# Minimal, dependency-free test harness for Nexus-Builder.
#
# Usage:
#   source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
#   assert_eq "expected" "actual" "description"
#   assert_success "desc" some_command arg1 arg2
#   assert_fail    "desc" some_command arg1 arg2
#   test_summary   # prints totals; returns non-zero if any assertion failed

TESTS_RUN=0
TESTS_FAILED=0

assert_eq() {
    local expected="$1" actual="$2" desc="${3:-values are equal}"
    TESTS_RUN=$((TESTS_RUN + 1))
    if [[ "$expected" == "$actual" ]]; then
        printf '  [PASS] %s\n' "$desc"
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        printf '  [FAIL] %s (expected="%s" actual="%s")\n' "$desc" "$expected" "$actual"
    fi
}

# assert_success <desc> <cmd...> : the command must exit 0.
assert_success() {
    local desc="$1"
    shift
    TESTS_RUN=$((TESTS_RUN + 1))
    if "$@" >/dev/null 2>&1; then
        printf '  [PASS] %s\n' "$desc"
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        printf '  [FAIL] %s (command exited non-zero)\n' "$desc"
    fi
}

# assert_fail <desc> <cmd...> : the command must exit non-zero.
assert_fail() {
    local desc="$1"
    shift
    TESTS_RUN=$((TESTS_RUN + 1))
    if "$@" >/dev/null 2>&1; then
        TESTS_FAILED=$((TESTS_FAILED + 1))
        printf '  [FAIL] %s (expected non-zero exit)\n' "$desc"
    else
        printf '  [PASS] %s\n' "$desc"
    fi
}

test_summary() {
    printf '\n%d assertion(s) run, %d failed\n' "$TESTS_RUN" "$TESTS_FAILED"
    [[ "$TESTS_FAILED" -eq 0 ]]
}
