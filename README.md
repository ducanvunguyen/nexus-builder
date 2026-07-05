# 🛡️ Nexus-Builder: Immutable Linux Distro Factory

[![CI](https://github.com/ducanvunguyen/nexus-builder/actions/workflows/ci.yml/badge.svg)](https://github.com/ducanvunguyen/nexus-builder/actions/workflows/ci.yml)
[![ShellCheck](https://img.shields.io/badge/lint-shellcheck-brightgreen.svg)](https://www.shellcheck.net/)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Shell](https://img.shields.io/badge/made%20with-bash-1f425f.svg)](https://www.gnu.org/software/bash/)

Nexus-Builder is a professional toolchain for creating **A/B Immutable Linux Distributions** tailored for high-performance ARM64 SoCs, such as the **Rockchip RK3576**.

## 🚀 Vision
In modern embedded systems, reliability is everything. Nexus-Builder moves away from fragile `apt-get` updates to a robust **Atomic Image-based Update** model.

## ✨ Core Features
- **Unified `nexus` CLI**: One friendly entry point for building, verifying, and managing boot slots.
- **Immutable RootFS**: Uses OverlayFS to protect the system core from corruption.
- **A/B Atomic Updates**: Fail-safe slot switching logic with rollback support.
- **Rockchip Optimized**: Pre-configured profiles for next-gen hardware (Flipper One).
- **Industrial Hardening**: Designed for stateless operation and SD card longevity.

## 🛠 Quick Start
```bash
# Clone the repo
git clone https://github.com/ducanvunguyen/nexus-builder.git
cd nexus-builder

# Grant execution permission
chmod +x nexus scripts/*.sh core/*.sh tests/*.sh

# Check your host has everything it needs
./nexus doctor

# Preview the image layout without touching a disk
./nexus build --dry-run

# Build an image for Flipper One (needs sgdisk + truncate)
./nexus build

# Run the test suite
./nexus test
```

## 🖥 The `nexus` CLI
Everything is driven through a single command. Run `./nexus help` for the full list.

| Command | Description |
| --- | --- |
| `nexus build [--dry-run] [board.conf]` | Generate a flashable disk image (or preview the layout). |
| `nexus slot` / `nexus slot get` | Show the active boot slot (`A` or `B`). |
| `nexus slot set <A\|B>` | Select a boot slot with an atomic write. |
| `nexus slot switch [A\|B]` | Toggle to the other slot, or switch to a specific one. |
| `nexus verify <file> <sha256>` | Verify a file against an expected SHA-256 digest. |
| `nexus doctor` | Check that the host has the required tools. |
| `nexus test` | Run the full test suite. |
| `nexus version` | Print the CLI version. |

Colours are automatically disabled when output is piped, when `$NO_COLOR` is set, or with the `--no-color` flag.

### A/B slot state
The active slot is persisted like a U-Boot environment variable. On real hardware this maps to `fw_setenv BOOT_SLOT`; for local development and CI it is written to a plain file so the logic can be tested anywhere. Override the location with `NEXUS_BOOTENV`:

```bash
NEXUS_BOOTENV=/run/nexus/bootenv ./nexus slot set B
```

## 🧪 Development
```bash
# Static analysis (same as CI)
shellcheck nexus core/*.sh scripts/*.sh tests/*.sh

# Tests
bash tests/run.sh
```
Every push and pull request runs ShellCheck and the test suite via [GitHub Actions](.github/workflows/ci.yml).

## 🏗 Roadmap
- [x] RK3576 Board Support Profile
- [x] OverlayFS Protection Logic
- [x] Unified `nexus` CLI with `doctor` diagnostics
- [x] Continuous Integration (ShellCheck + tests)
- [ ] Flatpak Sandbox Integration
- [ ] Hardware-verified Boot (Secure Boot)
