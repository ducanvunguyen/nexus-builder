# Contributing to Nexus-Builder

Thanks for your interest in improving Nexus-Builder! This project is a small,
pure-Bash toolchain, so contributing is deliberately lightweight.

## Development setup
You only need `bash` and [ShellCheck](https://www.shellcheck.net/). For an
actual image build you also need `sgdisk` (from `gdisk`) and `truncate`
(coreutils). Run `./nexus doctor` to see what is missing on your host.

## Before you open a pull request
Please make sure the same checks that run in CI pass locally:

```bash
# Lint every script (-x follows sourced files)
shellcheck -x nexus core/*.sh scripts/*.sh tests/*.sh

# Run the test suite
./nexus test
```

## Guidelines
- Keep scripts POSIX-friendly Bash and quote your expansions.
- Add or update a test under `tests/` for any behaviour change to `core/`.
- Test files are named `tests/test_*.sh` and are auto-discovered by
  `tests/run.sh`; source `tests/lib.sh` for the `assert_*` helpers.
- Keep commits focused and describe the "why", not just the "what".

Happy building! 🛡️
