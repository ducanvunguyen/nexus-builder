# 🛡️ Nexus-Builder: Immutable Linux Distro Factory

[![CI](https://github.com/ducanvunguyen/nexus-builder/actions/workflows/ci.yml/badge.svg)](https://github.com/ducanvunguyen/nexus-builder/actions/workflows/ci.yml)
[![Shell](https://img.shields.io/badge/shell-bash-4EAA25?logo=gnubash&logoColor=white)](https://www.gnu.org/software/bash/)
[![Platform](https://img.shields.io/badge/platform-ARM64%20(RK3576)-0A7BBB)](boards/rk3576-flipper.conf)
[![License](https://img.shields.io/badge/license-see%20LICENSE-blue)](LICENSE)

Nexus-Builder is a professional toolchain for creating **A/B Immutable Linux Distributions** tailored for high-performance ARM64 SoCs, such as the **Rockchip RK3576**.

## 🚀 Vision
In modern embedded systems, reliability is everything. Nexus-Builder moves away from fragile `apt-get` updates to a robust **Atomic Image-based Update** model.

## ✨ Core Features
- **Immutable RootFS**: Uses OverlayFS to protect the system core from corruption.
- **A/B Atomic Updates**: Fail-safe slot switching logic with rollback support.
- **Rockchip Optimized**: Pre-configured profiles for next-gen hardware (Flipper One).
- **Industrial Hardening**: Designed for stateless operation and SD card longevity.
- **Unified CLI**: One `nexus` command drives every workflow — build, verify, slot management and diagnostics.

## 🛠 Quick Start
```bash
# Clone the repo
git clone https://github.com/ducanvunguyen/nexus-builder.git
cd nexus-builder

# Grant execution permission
chmod +x nexus scripts/*.sh core/*.sh tests/*.sh

# Check that your host has the required tools
./nexus doctor

# Build an image for Flipper One
./nexus build

# Run the test suite
./nexus test
```

## 🧰 The `nexus` CLI
A single entrypoint ties the toolchain together:

| Command | Description |
| --- | --- |
| `nexus build [board.conf]` | Build an A/B image (defaults to `boards/rk3576-flipper.conf`). |
| `nexus slot get` | Print the currently active boot slot (`A` or `B`). |
| `nexus slot set <A\|B>` | Set the active boot slot. |
| `nexus slot switch` | Flip to the inactive slot (`A ⇄ B`) — the core of an atomic update. |
| `nexus verify <file> <sha256>` | Verify a partition/file against an expected SHA256. |
| `nexus doctor` | Check that the required host tools are installed. |
| `nexus test` | Run the full test suite. |
| `nexus version` | Print the Nexus-Builder version. |
| `nexus help` | Show usage. |

> **Tip:** the active slot is persisted to the file named by `NEXUS_UBOOT_ENV`
> (default `/tmp/u-boot-env.sim`). On a real RK3576 target this maps to the
> U-Boot environment via `fw_setenv`.

## 🧪 Testing & CI
Every push and pull request runs on GitHub Actions:
- **ShellCheck** lints every script in the repo (`shellcheck -x`).
- The **test suite** (`tests/run.sh`) exercises the A/B slot manager and the integrity checker.

Run the same checks locally:
```bash
shellcheck -x nexus core/*.sh scripts/*.sh tests/*.sh
./nexus test
```

## 🏗 Roadmap
- [x] RK3576 Board Support Profile
- [x] OverlayFS Protection Logic
- [x] Unified `nexus` CLI
- [x] Continuous Integration (ShellCheck + tests)
- [ ] Flatpak Sandbox Integration
- [ ] Hardware-verified Boot (Secure Boot)

## 🤝 Contributing
Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). If Nexus-Builder is useful to you, please ⭐ the repo!
