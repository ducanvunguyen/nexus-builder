#!/usr/bin/env bash
# Module: Integrity Check
# Purpose: Verify that a partition/image matches an expected SHA-256 digest.
#
# Public API:
#   hash_file     <path>                 -> prints the SHA-256 hex digest
#   verify_system <path> <expected_hash> -> returns 0 on match, 1 otherwise

# Print the SHA-256 digest (hex only) of a file to stdout.
hash_file() {
    local target="$1"
    sha256sum "$target" | awk '{print $1}'
}

# Compare a file's SHA-256 against an expected value.
verify_system() {
    local partition="$1"
    local expected_hash="$2"
    local actual_hash

    echo "[Integrity] Checking ${partition}..." >&2

    if [[ ! -r "$partition" ]]; then
        echo "[CRITICAL] Cannot read ${partition}." >&2
        return 1
    fi

    actual_hash="$(hash_file "$partition")"

    if [[ "$actual_hash" == "$expected_hash" ]]; then
        echo "[Integrity] OK: ${partition} matches expected digest." >&2
        return 0
    fi

    echo "[CRITICAL] Hash mismatch on ${partition}!" >&2
    echo "[CRITICAL]   expected: ${expected_hash}" >&2
    echo "[CRITICAL]   actual:   ${actual_hash}" >&2
    return 1
}
