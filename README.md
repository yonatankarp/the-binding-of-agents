# the-binding-of-agents

A TBOI-themed dashboard for managing Claude Code and Codex AI agent sessions.

> A hard fork of [pokegents](https://github.com/tRidha/pokegents) rethemed with The Binding of Isaac aesthetic. All agent orchestration functionality is preserved; only the visual theme and identifier vocabulary differ. See [DISCLAIMER.md](./DISCLAIMER.md) for IP attribution.

## What it does

`the-binding-of-agents` (binary name `boa`) watches your active Claude Code / Codex sessions on disk and renders them as a TBOI-themed dashboard. Each agent appears as an Isaac character — pick from the 84-strong character + familiar pool via the **"WHO AM I?"** picker.

- Active sessions with status pills: **REST** (idle) / **FIGHT** (busy) / **CLEAR** (done)
- **The Bestiary**: browse and resume past agent sessions
- TBOI Basement palette with Upheaval TT BRK font
- Inter-agent messaging via MCP (source install only — see install paths below)
- Full-text search across agent transcripts (pure-Go SQLite, works in any binary)

## Install

Two paths, depending on what you need.

### Path A: Pre-built binary (recommended for dashboard-only use)

Download the archive for your platform from the [Releases](https://github.com/yonatankarp/the-binding-of-agents/releases) page, extract it, and run the binary-mode installer from the extracted directory:

```sh
tar -xzf boa_v1.0.0_darwin_arm64.tar.gz
cd boa_v1.0.0_darwin_arm64
./install.sh --binary
boa serve
```

Then open http://localhost:7834 in your browser.

Supported platforms (v1.0):
- macOS (Apple Silicon and Intel)
- Linux (x86_64 and ARM64)

Windows binaries are not yet supported (upstream process-management primitives differ; see `.goreleaser.yaml` comment for context).

### Path B: Source install (full feature set)

Requires Go 1.22+, Node 18+, npm, and Python 3 (for sprite helpers).

```sh
git clone https://github.com/yonatankarp/the-binding-of-agents.git
cd the-binding-of-agents
BOA_DEV_BUILD=1 ./install.sh
boa dashboard start
```

The source install adds these features on top of the binary install:
- `boa launch <profile>@<project>` — spawn new agent sessions from the CLI
- `boa profiles` / `boa projects` — list and manage profiles, projects, roles
- Inter-agent messaging via the bundled MCP server (requires Node.js runtime)
- iTerm2 terminal integration on macOS (focus / spawn windows)

Source install also works on Linux today.

## Architecture

Thin fork. The Go backend handles agent-tracking, file watching, websocket streaming, and Claude Code hook integration — unchanged from upstream pokegents except for identifier renames. The React/TypeScript frontend renders the dashboard with TBOI-themed sprites, palette, and copy.

The release binary is statically linked (CGO_ENABLED=0) and uses pure-Go SQLite (`modernc.org/sqlite`), so no system dependencies are required at runtime.

Authoritative documents:
- [Design spec](./docs/superpowers/specs/2026-05-11-the-binding-of-agents-design.md)
- [Implementation plan](./docs/superpowers/plans/2026-05-11-the-binding-of-agents-implementation.md)

## Known limitations (v1.0)

- **Windows builds are disabled** — upstream pokegents has darwin/Linux-only process management. Add `windows` to `.goreleaser.yaml`'s `goos` after abstracting `state.go:1866`'s `syscall.Kill` call.
- **Binary install lacks CLI orchestration** — `boa launch`, `boa profiles`, etc. live in the bundled `boa.sh` (source-only). Binary users see only `serve` and `index` subcommands. Use a source install if you need CLI orchestration.
- **Inter-agent MCP messaging requires source install** — the MCP server lives in `mcp/server.js` and needs Node.js at runtime. Not bundled in the binary archive.
- **TBOI basement floor is a placeholder image** — a polished basement-floor.png can be swapped in later; current is a 544x480 dark-brown placeholder.

## Disclaimer

This is an unofficial fan project. Not affiliated with Edmund McMillen, Nicalis, or any rights holder of The Binding of Isaac.

- [DISCLAIMER.md](./DISCLAIMER.md) — fan-project framing and takedown policy
- [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) — per-sprite attribution and font credits

If you are a rights holder requesting content removal, file an issue with the subject "Takedown request".

## License

Inherits the upstream pokegents license (MIT, Copyright © 2026 Thariq Ridha). See [LICENSE](./LICENSE) and [NOTICE](./NOTICE).
