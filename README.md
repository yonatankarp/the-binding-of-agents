# the-binding-of-agents

A TBOI-themed dashboard for managing Claude Code and Codex AI agent sessions.

> A hard fork of [pokegents](https://github.com/tRidha/pokegents) rethemed with The Binding of Isaac aesthetic. All agent orchestration functionality is preserved verbatim; only the visual theme and identifier vocabulary are changed. See [DISCLAIMER.md](./DISCLAIMER.md) for IP attribution.

## What it does

`the-binding-of-agents` (binary name `boa`) watches your active Claude Code / Codex sessions on disk and renders them as a TBOI-themed dashboard. Each agent appears as an Isaac character — pick from the 84-strong character + familiar pool via the **"WHO AM I?"** picker.

- See active sessions at a glance with status pills: **REST** (idle), **FIGHT** (busy), **CLEAR** (done)
- Browse past sessions in **The Bestiary**
- Spawn new agents and assign them characters
- Resume any past run
- Watch the live activity feed per agent
- Inter-agent messaging via MCP

## Install

### Pre-built binary (recommended)

Download the archive for your platform from the [Releases](https://github.com/yonatankarp/the-binding-of-agents/releases) page, extract it, then run the installer to register the `boa` CLI shim and storage directory:

```sh
./install.sh
boa dashboard start
boa dashboard open
```

The dashboard binds to `http://localhost:7834` by default (configurable in `~/.the-binding-of-agents/config.json`).

Supported platforms:
- macOS (Apple Silicon and Intel)
- Linux (x86_64 and ARM64)
- Windows (x86_64)

### Build from source

Requirements: Go 1.22+, Node 18+, npm, python3.

```sh
git clone https://github.com/yonatankarp/the-binding-of-agents.git
cd the-binding-of-agents
POKEGENTS_DEV_BUILD=1 ./install.sh
```

The install script creates the storage directory at `~/.the-binding-of-agents/` with default config, roles, and project, then installs a `boa` CLI shim at `~/.local/bin/boa`. When `POKEGENTS_DEV_BUILD=1` is set, it also builds the Go dashboard server, the React web bundle, and the ACP adapter. Without that flag the script expects pre-built binaries from a release artifact.

## Architecture

This is a thin fork. The Go backend handles all agent-tracking, file watching, websocket streaming, and Claude Code hook integration — unchanged from upstream pokegents except for identifier renames. The React/TypeScript frontend renders the dashboard with TBOI-themed sprites, palette, and copy.

Authoritative documents:
- [Design spec](./docs/superpowers/specs/2026-05-11-the-binding-of-agents-design.md)
- [Implementation plan](./docs/superpowers/plans/2026-05-11-the-binding-of-agents-implementation.md)

## Disclaimer

This is an unofficial fan project. Not affiliated with Edmund McMillen, Nicalis, or any rights holder of The Binding of Isaac.

- [DISCLAIMER.md](./DISCLAIMER.md) — fan-project framing and takedown policy
- [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) — per-sprite attribution and font credits

If you are a rights holder requesting content removal, file an issue with the subject "Takedown request".

## License

Inherits the upstream pokegents license (MIT, Copyright © 2026 Thariq Ridha). See [LICENSE](./LICENSE) and [NOTICE](./NOTICE).
