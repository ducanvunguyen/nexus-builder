#!/usr/bin/env bash
# Module: A/B Partition Manager
# Purpose: Atomic, fail-safe boot-slot selection for immutable A/B systems.
#
# On a real Rockchip RK3576 target the active slot lives in the U-Boot
# environment and is flipped with `fw_setenv BOOT_SLOT <A|B>`. To keep the
# logic testable on any host, we persist the same key/value to a plain file
# whose location can be overridden with $NEXUS_BOOTENV.
#
# Public API:
#   get_active_slot           -> prints the active slot ("A" or "B") to stdout
#   set_active_slot  <A|B>    -> persists the target slot atomically
#   switch_boot_slot <A|B>    -> alias of set_active_slot (kept for back-compat)
#   toggle_slot               -> flips A<->B and prints the new slot to stdout
#
# Diagnostic messages go to stderr so that command substitution around
# get_active_slot / toggle_slot only ever captures the slot letter.

# Default boot slot used when no environment has been written yet.
NEXUS_DEFAULT_SLOT="${NEXUS_DEFAULT_SLOT:-A}"

# Resolve the path of the (simulated) U-Boot environment file.
_nexus_bootenv() {
    printf '%s\n' "${NEXUS_BOOTENV:-/tmp/nexus-boot-env.sim}"
}

# Print the currently selected slot. Falls back to the default when the
# environment file is missing or malformed, so callers always get a valid slot.
get_active_slot() {
    local env_file slot=""
    env_file="$(_nexus_bootenv)"

    if [[ -r "$env_file" ]]; then
        slot="$(sed -n 's/^BOOT_SLOT=//p' "$env_file" | tail -n1)"
    fi

    case "$slot" in
        A | B) printf '%s\n' "$slot" ;;
        *) printf '%s\n' "$NEXUS_DEFAULT_SLOT" ;;
    esac
}

# Persist the target slot using write-to-temp-then-rename so that an
# interrupted write can never leave a half-written environment behind.
# This atomic swap is the whole point of an A/B updater: the pointer flips
# all at once, or not at all.
set_active_slot() {
    local target_slot="$1" env_file tmp_file
    env_file="$(_nexus_bootenv)"

    if [[ "$target_slot" != "A" && "$target_slot" != "B" ]]; then
        echo "[Nexus-AB] ERROR: invalid slot '${target_slot}' (expected A or B)." >&2
        return 1
    fi

    mkdir -p "$(dirname "$env_file")" || return 1
    tmp_file="$(mktemp "${env_file}.XXXXXX")" || return 1
    printf 'BOOT_SLOT=%s\n' "$target_slot" >"$tmp_file"
    if ! mv -f "$tmp_file" "$env_file"; then
        rm -f "$tmp_file"
        return 1
    fi

    echo "[Nexus-AB] Boot slot set to ${target_slot}. System will fail-over if it does not boot." >&2
    return 0
}

# Backwards-compatible name kept from the original module.
switch_boot_slot() {
    set_active_slot "$@"
}

# Flip to the other slot and print the new value to stdout. Handy for the
# common "flash the inactive slot, then swap the pointer" workflow.
toggle_slot() {
    local current
    current="$(get_active_slot)"
    if [[ "$current" == "A" ]]; then
        set_active_slot "B" && printf 'B\n'
    else
        set_active_slot "A" && printf 'A\n'
    fi
}
