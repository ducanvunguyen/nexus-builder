#!/usr/bin/env bash
# Module: A/B Partition Manager
# Logic: Atomic slot switching backed by a U-Boot style environment file.
#
# The active boot slot is persisted as a single line, "BOOT_SLOT=<A|B>", in the
# file named by $NEXUS_UBOOT_ENV. On a real RK3576 target this file is written
# with the U-Boot tools (fw_setenv); here we model it as a plain file so the
# logic is fully testable on any host. Point NEXUS_UBOOT_ENV at a temp file in
# tests to avoid touching a real device.

: "${NEXUS_UBOOT_ENV:=/tmp/u-boot-env.sim}"

# get_active_slot : print the currently active boot slot, defaulting to "A".
get_active_slot() {
    if [[ -f "$NEXUS_UBOOT_ENV" ]]; then
        local slot
        slot="$(sed -n 's/^BOOT_SLOT=//p' "$NEXUS_UBOOT_ENV" | tail -n1)"
        case "$slot" in
            A|B) printf '%s\n' "$slot"; return 0 ;;
        esac
    fi
    printf 'A\n'
}

# set_active_slot <A|B> : persist the desired boot slot atomically.
# Writes to a temp file first, then renames it into place so a crash can never
# leave the env half-written (the essence of an atomic update).
set_active_slot() {
    local target="$1"
    case "$target" in
        A|B) ;;
        *) echo "[ERROR] Invalid slot designation: '$target' (expected A or B)" >&2
           return 1 ;;
    esac
    local tmp="${NEXUS_UBOOT_ENV}.tmp.$$"
    printf 'BOOT_SLOT=%s\n' "$target" >"$tmp" && mv -f "$tmp" "$NEXUS_UBOOT_ENV"
}

# other_slot : print the slot that is NOT currently active (the update target).
other_slot() {
    if [[ "$(get_active_slot)" == "A" ]]; then
        printf 'B\n'
    else
        printf 'A\n'
    fi
}

# switch_boot_slot <A|B> : user-facing wrapper with logging.
switch_boot_slot() {
    local target_slot="$1" # "A" or "B"

    echo "[Nexus-AB] Preparing to switch boot target to Slot $target_slot..."

    if set_active_slot "$target_slot"; then
        echo "[SUCCESS] Boot slot updated. System will fail-over if $target_slot fails."
    else
        echo "[ERROR] Invalid slot designation."
        return 1
    fi
}
