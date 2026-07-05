#!/usr/bin/env bash
# Nexus-Builder :: shared helpers.
#
# Small, dependency-free utilities used across the toolchain. This file only
# *defines* functions and is safe to source multiple times.

# --- Coloured logging (auto-disabled when stdout is not a TTY, e.g. in CI) ---
if [[ -t 1 ]]; then
    _C_RESET=$'\033[0m'
    _C_BLUE=$'\033[34m'
    _C_GREEN=$'\033[32m'
    _C_YELLOW=$'\033[33m'
    _C_RED=$'\033[31m'
else
    _C_RESET="" _C_BLUE="" _C_GREEN="" _C_YELLOW="" _C_RED=""
fi

log_info() { printf '%s[Nexus]%s %s\n' "$_C_BLUE" "$_C_RESET" "$*"; }
log_ok()   { printf '%s[ OK ]%s %s\n' "$_C_GREEN" "$_C_RESET" "$*"; }
log_warn() { printf '%s[WARN]%s %s\n' "$_C_YELLOW" "$_C_RESET" "$*" >&2; }
log_err()  { printf '%s[FAIL]%s %s\n' "$_C_RED" "$_C_RESET" "$*" >&2; }

# die <message> : log an error and exit non-zero.
die() { log_err "$*"; exit 1; }

# require_cmd <command> : succeed (0) if the command is on PATH, else fail (1).
require_cmd() { command -v "$1" >/dev/null 2>&1; }
