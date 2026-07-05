#!/usr/bin/env bash
# Nexus-Builder test runner.
# Executes every tests/test_*.sh file and aggregates their results, exiting
# non-zero if any test file reports a failure.

set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

fail=0
total=0

for t in "$HERE"/test_*.sh; do
    [[ -e "$t" ]] || continue
    total=$((total + 1))
    echo "=============================================="
    echo "TEST: $(basename "$t")"
    echo "=============================================="
    if bash "$t"; then
        :
    else
        fail=$((fail + 1))
    fi
    echo
done

echo "=============================================="
if [[ "$fail" -eq 0 ]]; then
    echo "ALL ${total} TEST FILE(S) PASSED"
    exit 0
fi
echo "${fail} of ${total} TEST FILE(S) FAILED"
exit 1
