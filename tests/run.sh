#!/usr/bin/env bash
# Discover and run every tests/test_*.sh, then aggregate the result.
# Exits non-zero if any suite fails, so it plugs straight into CI.
set -u
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

failed=0
shopt -s nullglob
for suite in "$HERE"/test_*.sh; do
    printf '\n>>> %s\n' "$(basename "$suite")"
    if ! bash "$suite"; then
        failed=$((failed + 1))
    fi
done

echo
if [[ "$failed" -eq 0 ]]; then
    echo "All test suites passed."
else
    echo "$failed test suite(s) failed."
fi
[[ "$failed" -eq 0 ]]
