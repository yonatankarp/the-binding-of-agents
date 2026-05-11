# the-binding-of-agents - Design Spec

**Date:** 2026-05-11
**Status:** Draft, pending user review
**Source brainstorm:** session `2026-05-11-1352-the-binding-of-agents-pokegents-fork-design`

## 1. Overview

A hard fork of [pokegents](https://github.com/tRidha/pokegents) (an agent orchestration dashboard for Claude/Codex sessions, themed around Pokemon) rethemed with The Binding of Isaac aesthetic. The fork is a **pure cosmetic reskin**: zero new backend mechanics, zero new game-like systems. The Go backend is preserved verbatim except for identifier renames. All TBOI work lives in the React/TypeScript frontend and the theme registry that already ships with pokegents.

Releases ship as pre-built binaries (cross-platform) so end users do not need Go or Node toolchains, fixing a pain point that exists upstream.

## 2. Goals (in scope for v1)

1. Visually distinct TBOI-themed agent dashboard.
2. Preserve 100% of pokegents' existing agent-tracking functionality.
3. Ship pre-built release binaries via GoReleaser.
4. Honest IP handling via `DISCLAIMER.md` and `THIRD_PARTY_NOTICES.md`.
5. Stay drop-in compatible with the Claude Code hooks pokegents already integrates with.

## 3. Non-goals (explicitly deferred)

- No new gameplay mechanics. No `items_collected`, floor progression, hearts, devil/angel deals, run-end/death state, seed tracking, or character-specific behaviors.
- No theme variants beyond the single `tboi-basement` palette. Caves / Depths / Womb / Sheol / Cathedral palettes can come in a future phase.
- No richer Bestiary tracking. "The Bestiary" is a label-only rename of the existing PC Box / `SessionBrowser`. Per-agent encounter logs, tool-as-item tracking, and tool-to-TBOI-item mapping are explicit phase-2 candidates, not v1.
- No upstream contributions back to pokegents. This is a hard fork.
- No sound effects.
- No mobile or responsive layout work.
- No new Go fields, no new Go endpoints, no new Go logic. Only renames.

## 4. Architecture

```
the-binding-of-agents/
|-- dashboard/
|   |-- server/                  # Go backend, identifiers renamed only
|   |   |-- models.go            # AgentState struct, RunID instead of PokegentID
|   |   `-- ...                  # all other Go files unchanged in logic
|   `-- web/
|       |-- public/sprites/      # 84 committed PNGs (96x96, nearest-neighbor scaled)
|       `-- src/
|           |-- components/      # renamed + rethemed
|           |-- theme/
|           |   |-- themes.json  # adds tboi-basement entry
|           |   `-- themeRegistry.ts
|           `-- styles/
|               `-- tboi.css     # replaces pokemon.css
|-- scripts/
|   |-- download-tboi-sheets.sh  # one-time, maintainer-run
|   `-- slice-tboi-sheets.ts     # one-time, slices sheets per manifest
|-- sprite-sources/
|   |-- manifest.json            # 84 bbox + source entries
|   `-- sheets/                  # downloaded source sheets, .gitignored
|-- .github/workflows/
|   `-- release.yml              # GoReleaser cross-compile
|-- DISCLAIMER.md
|-- THIRD_PARTY_NOTICES.md
`-- README.md
```

### Component model

The Go backend remains the single source of truth for agent state. It watches `~/.the-binding-of-agents/{agents,running,status,messages}/` with `fsnotify`, broadcasts state via SSE / WebSocket, and manages `claude --resume` subprocesses with iTerm2 integration. The React frontend connects, renders agent cards, and provides UI for spawning / resuming / browsing agents. None of this changes; we change what it *looks like*.

## 5. Preserved functionality (Option A guarantee)

Every pokegents agent-tracking feature is preserved 1:1. Confirmation table:

| Feature | Upstream component | v1 treatment |
|---|---|---|
| Grid view of active agents | `GridContainer` | Retheme only |
| Agent card (sprite + name + status + activity feed) | `AgentCard` | Retheme only |
| Click card -> focus iTerm2 terminal | `/api/sessions/{id}/focus` | Unchanged |
| Embedded chat panel | `ChatPanel` | Retheme only |
| Spawn new agent (name/profile/role/project) | `LaunchModal` | Retheme only |
| Browse past agents | `SessionBrowser` | Rename + retheme |
| Live SSE state updates | Go backend | Unchanged |
| Card preview phases (thinking/tool/streaming/...) | `CardPreview` | Unchanged |
| Activity feed | `ActivityItem` | Unchanged |
| Status pills | `AgentCard` | Copy rename only |
| Inter-agent MCP messaging | Node MCP server | Unchanged |
| Town view minimap | `TownView` -> `BasementView` | Retheme only |
| Sprite picker | `SpritePicker` -> `CharacterPicker` | Rename + retheme |
| Drag-and-drop grid ordering | `grid-layout.json` | Unchanged |
| Collapse/expand per card | `PokeballAnimation` -> `DoorAnimation` | Animation reskin |
| Profile system (roles, projects) | Go backend | Unchanged |
| Onboarding modal | `OnboardingModal` | Retheme only |
| Settings panel | `SettingsPanel` | Retheme only |
| Theme system | `themeRegistry` | Extended |

## 6. Identifier and copy rename map

### Go and TS identifier renames

| Pokemon term | TBOI term | Surface |
|---|---|---|
| `PokegentID` | `RunID` | Go struct field, TS interface, route params |
| `PokegentSummary` | `RunSummary` | TS interface in `types.ts` |
| `~/.pokegents/` | `~/.the-binding-of-agents/` | Storage dir |
| `/api/pokegents/*` | `/api/runs/*` | All Pokemon-flavored routes |
| `boa.sh` | `boa.sh` | Shell launcher script |

`AgentState` keeps its name (it is an agent-management concept, not Pokemon).

### Component renames

| Current | New | Notes |
|---|---|---|
| `CreatureIcon.tsx` | `CharacterIcon.tsx` | Default sprite `pokeball` -> `isaac` |
| `PokeballAnimation.tsx` | `DoorAnimation.tsx` | Tear-glow burst on agent spawn; door close/open on collapse/expand |
| `TownView.tsx` | `BasementView.tsx` | Replace `town.png` with TBOI basement floor plan |
| `SessionBrowser.tsx` | (filename unchanged) | UI copy: "PC Box" -> "The Bestiary" |
| `SpritePicker.tsx` | `CharacterPicker.tsx` | Picks from `ISAAC_CHARACTERS` instead of `POKEMON_SPRITES` |
| `PixelSprite.tsx` | (unchanged) | Already generic |
| `GameModal.tsx` | (unchanged) | Retheme border to TBOI pause-menu style |
| `pokemon.css` | `tboi.css` | All `--theme-*` tokens; remap to palette below |

### Copy strings

| Current | New |
|---|---|
| "PC Box" | "The Bestiary" |
| "Pokegents" / "Trainer" | drop; cards display character names directly |
| "5 active ___" | "5 active characters" |
| `SLP` (idle) | `REST` |
| `ATK` (busy) | `FIGHT` |
| `OK` (done) | `CLEAR` |
| `pokeball` (default avatar) | `isaac` |

### Sprite pool

`POKEMON_SPRITES` (908 Gen 8 Pokemon) is replaced by `ISAAC_CHARACTERS` containing 84 entries:

- 17 base playable characters (Isaac, Magdalene, Cain, Judas, ???, Eve, Samson, Azazel, Lazarus, Eden, The Lost, Lilith, Keeper, Apollyon, Forgotten, Bethany, Jacob & Esau)
- 17 Tainted variants of the above
- ~50 familiars (Brother Bobby, Sister Maggy, Lump, Demon Baby, Brimstone Baby, Lil' Brimstone, etc.)

Hash-based assignment from `SessionID` is preserved unchanged.

## 7. Theme palette and font

Adds a single `tboi-basement` entry to `dashboard/web/src/theme/themes.json` alongside the existing `fire-red`:

```json
"tboi-basement": {
  "label": "The Basement",
  "fonts": {
    "display": "'Upheaval TT BRK', 'Press Start 2P', monospace",
    "body":    "'Upheaval TT BRK', system-ui, sans-serif",
    "mono":    "ui-monospace, monospace"
  },
  "colors": {
    "bg-primary":   "#1a1410",
    "bg-secondary": "#2a1f18",
    "bg-tertiary":  "#0e0a08",
    "fg-primary":   "#e8d9b8",
    "fg-secondary": "#a89876",
    "accent-blood": "#8a1a18",
    "accent-soul":  "#c8b85a",
    "accent-tear":  "#6a8aa8",
    "border":       "#3a2d22",
    "state-rest":   "#4a6a8a",
    "state-fight":  "#8a1a18",
    "state-clear":  "#5a7a3a"
  },
  "effects": {
    "card-shadow":      "0 2px 0 #0e0a08",
    "pixelated-render": true,
    "scanline-opacity": 0.05
  }
}
```

**Font:** Upheaval TT BRK (Brian Kent), free for non-commercial use. Loaded via webfont; attribution in `THIRD_PARTY_NOTICES.md`. Falls back to `Press Start 2P` (already loaded in upstream) if the file fails to load.

**Theme switching UI:** Not required in v1 since only one theme ships. The registry retains pokegents' existing `fire-red` entry but the UI hardcodes `tboi-basement` as the active theme. Switching can be wired up later if more variants are added.

## 8. Sprite pipeline

### Source

[The Spriters Resource - The Binding of Isaac: Rebirth](https://www.spriters-resource.com/pc_computer/bindingofisaacrebirth/) hosts organized sprite sheets for playable characters, familiars, enemies, and bosses across all DLC. The maintainer downloads the relevant sheets once.

### Pipeline (one-time, maintainer-run)

1. `scripts/download-tboi-sheets.sh` curls the chosen source sheets into `sprite-sources/sheets/` (gitignored).
2. `sprite-sources/manifest.json` lists the 84 sprite entries with bounding boxes and target slugs.
3. `scripts/slice-tboi-sheets.ts` reads the manifest, slices each sheet using `sharp`, scales each tile to **96x96 PNG with nearest-neighbor interpolation** (preserves pixel-art fidelity, matches existing grid cell dimensions), writes to `dashboard/web/public/sprites/<slug>.png`.
4. Output PNGs are committed to the repo. Source sheets stay in `sprite-sources/sheets/` (gitignored).
5. `THIRD_PARTY_NOTICES.md` lists every sprite source URL + attribution.

### Manifest entry schema

```json
{
  "slug": "isaac",
  "name": "Isaac",
  "kind": "character",
  "sheet": "playable-characters-repentance.png",
  "bbox": [0, 0, 28, 40],
  "scale_to": [96, 96],
  "source_url": "https://www.spriters-resource.com/pc_computer/bindingofisaacrebirth/sheet/176014/",
  "license_note": "Sprite from The Binding of Isaac: Rebirth (c) Edmund McMillen / Nicalis. Used under fan-project fair-use assumption; takedown-responsive."
}
```

### Sprite pool composition (84 entries)

- `kind: character` for 17 base characters
- `kind: tainted` for 17 Tainted variants
- `kind: familiar` for ~50 familiars

The frontend treats all entries equivalently (just keys into the sprite filesystem). `kind` is metadata for the manifest only.

## 9. Visual aesthetic per UI surface

| Surface | Treatment |
|---|---|
| Spawn / recall animation | Door close / open keyframes (4-6 frames) replacing pokeball flash |
| Overworld view | `BasementView` with TBOI floor-plan layout; active agents appear as character sprite in rooms |
| Game modal frame | TBOI pause-menu border (dirty parchment / stone), optional character portrait slot on the left |
| Character picker | "WHO AM I?" header in Upheaval; 6-wide grid of character portraits matching TBOI's character-select layout |
| Status pills | `REST` (blue) / `FIGHT` (blood-red) / `CLEAR` (soul-green) |
| The Bestiary (archive) | Existing `SessionBrowser` grid, rethemed only; entries display sprite + character name + last-seen |
| Activity feed | Plain text rendering preserved; typewriter animation explicitly deferred to phase 2 |

## 10. Distribution

- `goreleaser` invoked from `.github/workflows/release.yml` on git tag push.
- Targets: `darwin/amd64`, `darwin/arm64`, `linux/amd64`, `linux/arm64`, `windows/amd64`.
- Release artifacts include the Go binary plus a pre-built `dashboard/web/dist/` bundle. Users download, unzip, run `./boa`, open `http://localhost:5199`.
- No Homebrew tap in v1.

## 11. Licensing and attribution

- **Inherit pokegents' license.** **Verification required before publishing the fork.** This is the one outstanding research item; the brainstorm research did not confirm pokegents' license. Action: read the upstream `LICENSE` file at fork time. If MIT / Apache / BSD-class, inherit and add a NOTICE. If GPL or AGPL, the fork is bound by the same terms. If unlicensed, contact the maintainer or do not publish.
- `THIRD_PARTY_NOTICES.md`: attribution for every TBOI sprite (linking back to The Spriters Resource pages) and for Upheaval TT BRK.
- `DISCLAIMER.md`: fan-project wording. Not affiliated with Edmund McMillen, Nicalis, Studio MDHR, or The Spriters Resource. Sprites used under fan-project / fair-use assumption for non-commercial use. Takedown-responsive: file an issue and offending sprites are removed within a stated timeframe.

## 12. Effort estimate

| Phase | Estimate |
|---|---|
| Fork + Go identifier renames | ~1 day |
| Sprite pipeline (download + manifest + slice) | ~2-3 days |
| Theme + palette + Upheaval font load | ~1 day |
| Component retheming (~35-40 .tsx/.css files) | ~3-5 days |
| `CharacterPicker` "WHO AM I?" custom layout | ~1 day |
| `DoorAnimation` | ~1 day |
| `BasementView` floor-plan replacement | ~2 days |
| GoReleaser workflow | ~half day |
| Testing + polish | ~2 days |
| `DISCLAIMER.md` + `THIRD_PARTY_NOTICES.md` | ~1 hour |
| **Total** | **~2-3 weeks** focused work |

### Compression options (if time-pressed)

- Skip `BasementView` replacement; keep `TownView` with a swapped `town.png` (basement-room background). Saves ~2 days.
- Skip custom door-opening animation; use a generic fade. Saves ~1 day.
- Skip custom "WHO AM I?" layout; reuse existing picker with TBOI sprites and a changed header string. Saves ~1 day.

Together, these compressions ship in ~1.5 weeks instead of ~2-3.

## 13. Open questions for review

1. **License verification.** Read `tRidha/pokegents/LICENSE` at fork time. If incompatible with a public derivative work, surface before publishing.
2. **Familiar list curation.** The 50 familiars to include are not enumerated in this spec; the manifest curation step (Phase 2 of section 8) will lock the exact list when the maintainer downloads sheets. Spec invariant: total pool size = 84.
3. **Tool-to-TBOI-item mapping (deferred).** Listed only as a phase-2 hook for if/when Bestiary tracking is reopened. No design work in v1.

## 14. References

- Upstream: https://github.com/tRidha/pokegents
- Sprite source: https://www.spriters-resource.com/pc_computer/bindingofisaacrebirth/
- Font (Upheaval TT BRK): https://www.dafont.com/upheaval.font
- Brainstorm capture: `~/obsidian/claude-brain/raw/sessions/2026-05-11-1352-the-binding-of-agents-pokegents-fork-design.md`
