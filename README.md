# 🛡️ Nexus-Builder: Immutable Linux Distro Factory

Nexus-Builder is a professional toolchain for creating **A/B Immutable Linux Distributions** tailored for high-performance ARM64 SoCs, such as the **Rockchip RK3576**.

## 🚀 Vision
In modern embedded systems, reliability is everything. Nexus-Builder moves away from fragile `apt-get` updates to a robust **Atomic Image-based Update** model.

## ✨ Core Features
- **Immutable RootFS**: Uses OverlayFS to protect the system core from corruption.
- **A/B Atomic Updates**: Fail-safe slot switching logic with rollback support.
- **Rockchip Optimized**: Pre-configured profiles for next-gen hardware (Flipper One).
- **Industrial Hardening**: Designed for stateless operation and SD card longevity.

## 🛠 Quick Start
```bash
# Clone the repo (Thay link duới đây bằng link thật của bạn)
git clone https://github.com/ducanvunguyen/nexus-builder.git
cd nexus-builder

# Cấp quyền thực thi
chmod +x scripts/*.sh core/*.sh tests/*.sh

# Build an image for Flipper One (Simulation)
./scripts/build-image.sh boards/rk3576-flipper.conf

# Run logic tests
bash tests/test_integrity.sh
```

## 🏗 Roadmap
- [x] RK3576 Board Support Profile
- [x] OverlayFS Protection Logic
- [ ] Flatpak Sandbox Integration
- [ ] Hardware-verified Boot (Secure Boot)
