#!/usr/bin/env bash
# the-binding-of-agents installer — browser dashboard, no shell rc mutation.
#
# Modes:
#   ./install.sh             Source mode (default): installs a shim that
#                            sources boa.sh. Builds the dashboard binary
#                            and frontend when BOA_DEV_BUILD=1 is set.
#   ./install.sh --binary    Binary mode: installs a shim that execs the
#                            pre-built `boa` binary shipped alongside this
#                            script (goreleaser archive layout). Skips all
#                            source build steps.
set -euo pipefail

MODE="source"
for arg in "$@"; do
  case "$arg" in
    --binary) MODE="binary" ;;
    --help|-h)
      cat <<USAGE
Usage: $0 [--binary]

  (no flag)   Install from a source checkout. Set BOA_DEV_BUILD=1 to also
              build the Go dashboard binary and the React/ACP bundles.
  --binary    Install from an extracted goreleaser archive. Validates the
              pre-built ./boa binary and dashboard/web/dist/ are present
              and installs a shim that execs the binary directly.

Environment:
  BOA_DATA              Storage dir (default: ~/.the-binding-of-agents)
  BOA_DEV_BUILD=1       Source-mode: build Go + npm bundles in-place.
  POKEGENTS_INSTALL_CWD Override the default project cwd.
  POKEGENTS_SHIM_DIR    Override the shim install dir (default ~/.local/bin).
USAGE
      exit 0
      ;;
    *)
      echo "unknown argument: $arg (try --help)" >&2
      exit 2
      ;;
  esac
done

BOA_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BOA_DATA="${BOA_DATA:-$HOME/.the-binding-of-agents}"
INSTALL_CWD="${POKEGENTS_INSTALL_CWD:-$PWD}"
SHIM_DIR="${POKEGENTS_SHIM_DIR:-$HOME/.local/bin}"
SHIM_PATH="$SHIM_DIR/boa"
COMPAT_SHIM_PATH="$SHIM_DIR/the-binding-of-agents"

log() { printf '%s\n' "$*"; }
warn() { printf '⚠ %s\n' "$*" >&2; }
err() { printf '✗ %s\n' "$*" >&2; }
have() { command -v "$1" >/dev/null 2>&1; }
json_escape() {
  python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$1"
}

log "Installing the-binding-of-agents from $BOA_ROOT"
log "Install mode:    $MODE"
log "Data directory:  $BOA_DATA"
log "Default project: $INSTALL_CWD"
log ""

if ! have python3; then
  echo "python3 is required for the installer" >&2
  exit 1
fi

# Binary-mode pre-flight: refuse early if the expected archive layout is missing,
# so users get a clear error rather than a half-broken install.
if [[ "$MODE" == "binary" ]]; then
  missing=0
  if [[ ! -x "$BOA_ROOT/boa" ]]; then
    err "Missing or non-executable binary: $BOA_ROOT/boa"
    missing=1
  fi
  if [[ ! -f "$BOA_ROOT/dashboard/web/dist/index.html" ]]; then
    err "Missing frontend bundle: $BOA_ROOT/dashboard/web/dist/index.html"
    missing=1
  fi
  if [[ $missing -ne 0 ]]; then
    err "--binary expects to run from an extracted goreleaser archive."
    err "Expected layout: <archive-root>/boa and <archive-root>/dashboard/web/dist/."
    exit 1
  fi
  log "✓ Binary archive layout verified"
fi

mkdir -p "$BOA_DATA"/{profiles,projects,roles,history,running,status,messages,logs,grid-profiles,activity,activity-lastread,ephemeral,ephemeral-pending,agents}
log "✓ Data directories ready"

if [[ ! -f "$BOA_DATA/config.json" ]]; then
  cat > "$BOA_DATA/config.json" <<JSON
{
  "port": 7834,
  "dashboard_open_mode": "browser",
  "default_interface": "chat",
  "default_backend": "claude",
  "default_project": "current",
  "default_role": "implementer",
  "skip_permissions": true,
  "iterm2_restore_profile": "Default",
  "editor_open_command": "code {path}",
  "browser_open_command": "open -a \"Google Chrome\" {url}"
}
JSON
  log "✓ Default config installed"
else
  log "· Config already exists; onboarding can repair preferences"
fi

if [[ ! -f "$BOA_DATA/backends.json" ]]; then
  cat > "$BOA_DATA/backends.json" <<JSON
{
  "version": 2,
  "backends": {
    "claude": {
      "name": "Claude",
      "type": "claude-acp",
      "default": true,
      "default_model": "sonnet-4-6",
      "models": {
        "sonnet-4-6": { "name": "Sonnet 4.6", "model": "claude-sonnet-4-6" },
        "opus-4-7": { "name": "Opus 4.7", "model": "claude-opus-4-7" },
        "opus-4-6": { "name": "Opus 4.6 (1M)", "model": "claude-opus-4-6[1m]" },
        "haiku-4-5": { "name": "Haiku 4.5", "model": "haiku" }
      }
    },
    "codex": {
      "name": "Codex",
      "type": "codex-acp",
      "default_model": "default",
      "models": {
        "default": { "name": "Provider default", "model": "" }
      },
      "env": {}
    }
  }
}
JSON
  log "✓ Default provider backends installed"
fi

install_role() {
  local name="$1" title="$2" emoji="$3" prompt="$4"
  local path="$BOA_DATA/roles/$name.json"
  [[ -f "$path" ]] && return 0
  cat > "$path" <<JSON
{
  "title": $(json_escape "$title"),
  "emoji": $(json_escape "$emoji"),
  "system_prompt": $(json_escape "$prompt"),
  "skip_permissions": null
}
JSON
}

install_role implementer "Implementer" "🛠️" "You are an implementer agent. Make focused code changes, follow existing patterns, validate your work, and report changed files plus validation commands. Coordinate before touching shared hotspots and do not revert others' edits."
install_role reviewer "Reviewer" "👀" "You are a code reviewer agent. Review changes for correctness, edge cases, consistency, and spec adherence. Be specific and actionable."
install_role researcher "Researcher" "🧪" "You are a research agent. Explore, investigate, and summarize findings with evidence before recommending changes."
install_role pm "PM" "📋" "You are a product manager agent. Clarify requirements, sequence work, and coordinate agents. Do not write code unless explicitly asked."
log "✓ Default roles ready"

if [[ ! -f "$BOA_DATA/projects/current.json" ]]; then
  cat > "$BOA_DATA/projects/current.json" <<JSON
{
  "title": $(json_escape "$(basename "$INSTALL_CWD")"),
  "color": [100, 180, 255],
  "iterm2_profile": "",
  "cwd": $(json_escape "$INSTALL_CWD"),
  "add_dirs": [],
  "context_prompt": ""
}
JSON
  log "✓ Default project installed: current → $INSTALL_CWD"
else
  log "· Default project already exists"
fi

if [[ -d "$BOA_ROOT/hooks" ]]; then
  chmod +x "$BOA_ROOT"/hooks/*.sh 2>/dev/null || true
fi

mkdir -p "$SHIM_DIR"
if [[ "$MODE" == "binary" ]]; then
  # Binary-mode shim: no boa.sh orchestration layer in the archive, so the
  # shim just sets BOA_ROOT (used by Go's web-dir resolution + by the chat
  # ACP launcher in chat_acp.go) and execs the binary directly. Subcommands
  # exposed: `serve`, `index` (whatever the Go binary supports).
  cat > "$SHIM_PATH" <<SHIM
#!/usr/bin/env sh
set -e
export BOA_ROOT=$(printf '%q' "$BOA_ROOT")
export BOA_DATA=\${BOA_DATA:-$(printf '%q' "$BOA_DATA")}
if [ ! -x "\$BOA_ROOT/boa" ]; then
  echo "the-binding-of-agents binary missing at \$BOA_ROOT/boa" >&2
  exit 1
fi
exec "\$BOA_ROOT/boa" "\$@"
SHIM
else
  cat > "$SHIM_PATH" <<SHIM
#!/usr/bin/env zsh
set -e
export BOA_ROOT=$(printf '%q' "$BOA_ROOT")
export BOA_DATA=\${BOA_DATA:-$(printf '%q' "$BOA_DATA")}
if [[ ! -f "\$BOA_ROOT/boa.sh" ]]; then
  echo "the-binding-of-agents install is missing boa.sh at \$BOA_ROOT" >&2
  exit 1
fi
source "\$BOA_ROOT/boa.sh"
if [[ \$# -eq 0 ]]; then
  boa dashboard open
elif [[ "\$1" == "launch" ]]; then
  shift
  boa "\$@"
else
  boa "\$@"
fi
SHIM
fi
chmod +x "$SHIM_PATH"
ln -sf "$SHIM_PATH" "$COMPAT_SHIM_PATH"
log "✓ CLI shim installed: $SHIM_PATH"
log "✓ Compatibility alias installed: $COMPAT_SHIM_PATH"

# Source-mode only: optionally build the dashboard binary + frontends.
# Binary mode already validated the pre-built artifacts above.
if [[ "$MODE" == "source" ]]; then
  if [[ ! -x "$BOA_ROOT/dashboard/the-binding-of-agents-dashboard" || ! -d "$BOA_ROOT/dashboard/web/dist" || ! -d "$BOA_ROOT/dashboard/acp-fork/dist" ]]; then
    if [[ "${BOA_DEV_BUILD:-}" == "1" ]] && have go && have npm; then
      log ""
      log "Building dashboard for source checkout..."
      (cd "$BOA_ROOT/dashboard" && CGO_CFLAGS="-DSQLITE_ENABLE_FTS5" go build -o the-binding-of-agents-dashboard .) && log "✓ Dashboard server built"
      (cd "$BOA_ROOT/dashboard/web" && npm ci --silent && npm run build) && log "✓ Dashboard web built"
      (cd "$BOA_ROOT/dashboard/acp-fork" && npm ci --silent && if [[ -f tsconfig.json ]]; then npm run build; else test -f dist/index.js; fi) && log "✓ ACP adapter ready"
    else
      warn "Dashboard binary/assets are missing. Install from a release artifact (./install.sh --binary), or run with BOA_DEV_BUILD=1 for source builds."
    fi
  fi
fi

log ""
log "Install complete. No shell rc files were modified."
if [[ ":$PATH:" != *":$SHIM_DIR:"* ]]; then
  log "Add $SHIM_DIR to PATH later if desired, or run directly:"
  log "  $SHIM_PATH"
fi

if [[ "$MODE" == "binary" ]]; then
  log ""
  log "Start the dashboard server with:"
  log "  $SHIM_PATH serve"
  log "Then open http://localhost:7834 in your browser."
else
  log "Open the browser dashboard with:"
  log "  $SHIM_PATH dashboard open"
  log ""
  log "If the server is not already running, start it first with:"
  log "  $SHIM_PATH dashboard start"
fi
