# the-binding-of-agents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fork pokegents and reskin it as `the-binding-of-agents` - a TBOI-themed Claude/Codex agent dashboard. Pure cosmetic reskin: zero new backend mechanics.

**Architecture:** Hard fork of github.com/tRidha/pokegents. Go backend preserved verbatim except for identifier renames. All visual work in the React/TS frontend and `themes.json`. Sprites committed to the repo (84 PNGs sliced from Spriters Resource sheets). Ships as pre-built binaries via GoReleaser.

**Tech Stack:** Go 1.22+, React 19, Vite 6, TypeScript 5.7, Tailwind 3.4, sharp (for sprite slicing), GoReleaser, GitHub Actions.

**Spec reference:** `~/Projects/the-binding-of-agents/docs/superpowers/specs/2026-05-11-the-binding-of-agents-design.md`

**Parallel-dispatch summary** (the user prefers parallel subagents for independent work):
- Tasks 1-3 are **sequential bootstrap** (must run first, in order).
- Tasks 4 and 5 can run **in parallel** (Go backend renames vs frontend type renames - touch disjoint files).
- Tasks 6 and 7 can run **in parallel** with Tasks 4-5 (theme system and sprite manifest are independent).
- Task 8 is **maintainer-blocking** (requires human review for legal/IP scope of selected sprites).
- Tasks 9-15 mostly depend on Tasks 6-8. Within that group, Tasks 9, 12, 13, 14, 15 touch disjoint files and can run **in parallel**.
- Tasks 16 and 17 can run **in parallel** with anything in Phase 7.
- Task 18 is **final sequential verification**.

A graph appears at the end of this document under "Parallel Dispatch Playbook".

---

## File Structure

### Files modified in the fork (existing upstream files)

**Go backend** (identifier renames only):
- `dashboard/server/models.go` - `PokegentID` -> `RunID`, `PokegentSummary` -> `RunSummary`
- `dashboard/server/*.go` (all files) - `~/.pokegents/` -> `~/.the-binding-of-agents/`; route prefixes
- `boa.sh` -> renamed to `boa.sh`
- `install.sh` - paths and binary name
- `go.mod` - module path
- `scripts/fetch-pokesprite-assets.sh` - deleted

**TypeScript frontend** (where the real work lives):
- `dashboard/web/src/types.ts` - rename interfaces and field names
- `dashboard/web/src/api.ts` - rename endpoint paths and types
- `dashboard/web/src/App.tsx` - localStorage prefix, default sprite, status pill copy
- `dashboard/web/src/components/sprites.ts` - `POKEMON_SPRITES` -> `ISAAC_CHARACTERS`
- `dashboard/web/src/components/CreatureIcon.tsx` -> renamed to `CharacterIcon.tsx`
- `dashboard/web/src/components/PokeballAnimation.tsx` -> renamed to `DoorAnimation.tsx`
- `dashboard/web/src/components/TownView.tsx` -> renamed to `BasementView.tsx`
- `dashboard/web/src/components/SpritePicker.tsx` -> renamed to `CharacterPicker.tsx`
- `dashboard/web/src/components/SessionBrowser.tsx` - copy strings only
- `dashboard/web/src/components/GameModal.tsx` - retheme border
- `dashboard/web/src/styles/pokemon.css` -> renamed to `tboi.css`
- `dashboard/web/src/theme/themes.json` - adds `tboi-basement` entry
- `dashboard/web/src/theme/themeRegistry.ts` - sets active theme
- `dashboard/web/index.html` - loads Upheaval font
- `dashboard/web/package.json` - name change

### Files created in the fork (new)

**Sprite pipeline:**
- `scripts/download-tboi-sheets.sh` - maintainer-run, fetches source sheets
- `scripts/slice-tboi-sheets.ts` - maintainer-run, slices sheets into 84 PNGs
- `sprite-sources/manifest.json` - 84 bbox + slug + source_url entries
- `sprite-sources/.gitignore` - excludes `sheets/`
- `dashboard/web/public/sprites/*.png` - 84 committed character/familiar sprites

**Project metadata:**
- `DISCLAIMER.md`
- `THIRD_PARTY_NOTICES.md`
- `.github/workflows/release.yml`
- `.goreleaser.yaml`

---

## Task 1: Bootstrap the fork

**Dependencies:** none.
**Parallelizable with:** none (must come first).

**Files:**
- Create: `~/Projects/the-binding-of-agents/` (working tree from upstream)
- Modify: `~/Projects/the-binding-of-agents/.git/config` (rename origin)

- [ ] **Step 1: Clone the upstream repo into a sibling directory**

Run:
```bash
cd ~/Projects
git clone https://github.com/tRidha/pokegents.git pokegents-upstream
```

Expected: clone completes; `~/Projects/pokegents-upstream/` exists. This is the read-only reference copy. The fork already exists at `~/Projects/the-binding-of-agents/` (spec was committed there).

- [ ] **Step 2: Copy upstream contents into the fork**

The fork currently contains only `docs/superpowers/specs/` and `docs/superpowers/plans/`. Copy everything else from upstream:
```bash
cd ~/Projects/the-binding-of-agents
rsync -a --exclude='.git' --exclude='docs/' ../pokegents-upstream/ ./
```

Expected: all upstream files (dashboard/, scripts/, install.sh, README.md, etc.) appear in the fork. The `docs/` directory is preserved unchanged.

- [ ] **Step 3: Verify upstream license and capture it**

Run:
```bash
ls -la ~/Projects/pokegents-upstream/ | grep -i 'licen\|copy'
cat ~/Projects/pokegents-upstream/LICENSE 2>/dev/null || cat ~/Projects/pokegents-upstream/LICENSE.md 2>/dev/null || echo "NO LICENSE FILE FOUND"
```

Expected: a license file is found. Note the license type (MIT, Apache-2.0, BSD, GPL, etc.). **If output is `NO LICENSE FILE FOUND`, STOP this plan and surface to the user before proceeding.** An unlicensed upstream means publishing the fork is legally ambiguous.

- [ ] **Step 4: Stage upstream files and commit the import**

```bash
cd ~/Projects/the-binding-of-agents
git add -A
git status | head -30
```

Verify the staged file list contains `dashboard/server/...`, `dashboard/web/...`, `boa.sh`, `install.sh`, etc. Then commit:
```bash
git commit -m "$(cat <<'EOF'
Import pokegents upstream as fork baseline

Imports tRidha/pokegents at the upstream HEAD. Subsequent commits
diverge to retheme as the-binding-of-agents. See docs/superpowers/
specs/ for design.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds. `git log --oneline -3` shows the import commit on top of the spec commit.

- [ ] **Step 5: Take an inventory baseline**

Run:
```bash
cd ~/Projects/the-binding-of-agents
grep -rl 'pokegent\|Pokegent\|POKEGENT\|pokeball\|Pokeball\|POKEBALL\|pikachu' --include='*.go' --include='*.ts' --include='*.tsx' --include='*.css' --include='*.json' --include='*.sh' --include='*.html' --include='*.md' | sort > /tmp/boa-rename-inventory.txt
wc -l /tmp/boa-rename-inventory.txt
```

Expected: a list of every file containing Pokemon-flavored identifiers. This becomes the inventory for the rename tasks. Save the output for cross-referencing later.

---

## Task 2: Project metadata (DISCLAIMER, THIRD_PARTY_NOTICES, license inheritance)

**Dependencies:** Task 1.
**Parallelizable with:** Task 3.

**Files:**
- Create: `DISCLAIMER.md`
- Create: `THIRD_PARTY_NOTICES.md` (skeleton; fully populated in Task 8)
- Modify: `LICENSE` (rename if needed; add NOTICE line for derivative work)

- [ ] **Step 1: Write DISCLAIMER.md**

Create `~/Projects/the-binding-of-agents/DISCLAIMER.md`:
```markdown
# Disclaimer

`the-binding-of-agents` is an unofficial fan project. It is not affiliated with, endorsed by, or sponsored by Edmund McMillen, Nicalis, Studio MDHR, or any rights holder of The Binding of Isaac franchise.

Visual assets in this repository (character sprites, familiar sprites, item depictions) are derived from The Binding of Isaac: Rebirth and its expansions. They are used here under fan-project / fair-use assumptions for non-commercial purposes. All such assets remain the intellectual property of their respective rights holders.

If you are a rights holder and would like content removed, file an issue at https://github.com/<your-username>/the-binding-of-agents/issues with the subject "Takedown request". Offending content will be removed within seven days of receipt.

This project is also a derivative of [pokegents](https://github.com/tRidha/pokegents). The upstream license applies to the underlying code. See `LICENSE` and `THIRD_PARTY_NOTICES.md`.
```

- [ ] **Step 2: Write THIRD_PARTY_NOTICES.md skeleton**

Create `~/Projects/the-binding-of-agents/THIRD_PARTY_NOTICES.md`:
```markdown
# Third-Party Notices

This project incorporates third-party material. Detailed attributions follow.

## Upstream code

[pokegents](https://github.com/tRidha/pokegents) by tRidha. See `LICENSE` for the upstream license terms (inherited).

## Fonts

**Upheaval TT BRK** by Brian Kent (AEnigma Fonts). Free for non-commercial use. Source: https://www.dafont.com/upheaval.font

## Sprite assets

Sprites are extracted from The Binding of Isaac: Rebirth and its expansions, sourced from The Spriters Resource (https://www.spriters-resource.com/pc_computer/bindingofisaacrebirth/) and used under fan-project fair-use assumption. Full per-sprite attribution will be populated when the sprite manifest is finalized.

<!-- Per-sprite table populated by Task 8. Format:
| Slug | Source sheet URL | Contributor (Spriters Resource user) |
|------|------------------|--------------------------------------|
-->
```

- [ ] **Step 3: Update or supplement the inherited LICENSE**

```bash
cd ~/Projects/the-binding-of-agents
cat LICENSE | head -5
```

Expected: shows the upstream license header (MIT / Apache / etc.). The plan does NOT modify or replace this file - we inherit the upstream license verbatim. If the license requires preserving the upstream copyright notice, leave it intact. If you want to add a notice for derivative work, append a `NOTICE` file rather than editing `LICENSE`.

If the license is MIT or BSD-class, create a small `NOTICE` file:
```bash
cat > NOTICE <<'EOF'
the-binding-of-agents
Copyright (c) 2026 <your-name>

This product is a derivative of pokegents.
Copyright (c) <upstream year> tRidha.

Licensed under the terms of the upstream LICENSE file in this repository.
EOF
```

- [ ] **Step 4: Commit the metadata files**

```bash
cd ~/Projects/the-binding-of-agents
git add DISCLAIMER.md THIRD_PARTY_NOTICES.md NOTICE 2>/dev/null
git commit -m "$(cat <<'EOF'
Add DISCLAIMER and THIRD_PARTY_NOTICES skeleton

Captures fan-project framing, takedown policy, and the per-asset
attribution skeleton that Task 8 will populate after sprite manifest
is finalized.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

---

## Task 3: Rename package.json and go.mod

**Dependencies:** Task 1.
**Parallelizable with:** Task 2.

**Files:**
- Modify: `dashboard/web/package.json`
- Modify: `go.mod` (top-level)
- Modify: `dashboard/go.mod` if it exists separately

- [ ] **Step 1: Inspect current package.json**

```bash
cd ~/Projects/the-binding-of-agents
cat dashboard/web/package.json | head -10
```

Expected: shows `"name": "pokegents"` or `"name": "pokegents-dashboard"` or similar.

- [ ] **Step 2: Update the name field**

Replace the `name` key in `dashboard/web/package.json`:
```bash
cd ~/Projects/the-binding-of-agents/dashboard/web
node -e "
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('package.json', 'utf8'));
p.name = 'the-binding-of-agents';
fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n');
"
cat package.json | head -5
```

Expected: `"name": "the-binding-of-agents"` is now in `package.json`.

- [ ] **Step 3: Locate and inspect go.mod**

```bash
cd ~/Projects/the-binding-of-agents
find . -name 'go.mod' -not -path './pokegents-upstream/*'
cat $(find . -name 'go.mod' | head -1) | head -3
```

Expected: shows the upstream module path, likely `github.com/tRidha/pokegents/...` or similar.

- [ ] **Step 4: Rewrite the module path**

Identify the file (one of `./go.mod`, `./dashboard/go.mod`, `./dashboard/server/go.mod`):
```bash
GO_MOD=$(find . -name 'go.mod' | head -1)
OLD_MODULE=$(head -1 "$GO_MOD" | awk '{print $2}')
NEW_MODULE="github.com/<your-username>/the-binding-of-agents"  # set this concretely before running
echo "OLD: $OLD_MODULE"
echo "NEW: $NEW_MODULE"
```

Then sweep:
```bash
grep -rl "$OLD_MODULE" --include='*.go' --include='go.mod' --include='go.sum' . | xargs sed -i '' "s|$OLD_MODULE|$NEW_MODULE|g"
```

Note: `sed -i ''` is the macOS form; on Linux use `sed -i`.

Expected: every Go import statement and the module declaration now reference `github.com/<your-username>/the-binding-of-agents`.

- [ ] **Step 5: Verify Go build still resolves**

```bash
cd ~/Projects/the-binding-of-agents
GO_DIR=$(dirname $(find . -name 'go.mod' | head -1))
cd "$GO_DIR"
go build ./...
```

Expected: build succeeds, or fails with a clear "cannot find package" error pointing at one of the rewritten imports. If it fails, re-check the sed substitution.

- [ ] **Step 6: Commit**

```bash
cd ~/Projects/the-binding-of-agents
git add -A
git commit -m "$(cat <<'EOF'
Rename module and package to the-binding-of-agents

Updates go.mod module path and dashboard/web/package.json name to
the new project identity. Go build still resolves locally.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

---

## Task 4: Go backend identifier renames

**Dependencies:** Task 3.
**Parallelizable with:** Tasks 5, 6, 7 (Task 4 touches Go; 5 touches TS; 6 touches theme JSON/CSS; 7 touches sprite scripts - disjoint file sets).

**Files (per architecture report):**
- Modify: `dashboard/server/models.go` (lines 18-93)
- Modify: `dashboard/server/*.go` (every Go file referencing PokegentID, /api/pokegents/, ~/.pokegents/)
- Modify: `boa.sh` -> rename to `boa.sh`
- Modify: `install.sh` (binary name and paths)

The four renames in this task:
1. `PokegentID` -> `RunID` (struct field, JSON tag)
2. `PokegentSummary` -> `RunSummary` (struct type)
3. `/api/pokegents/*` -> `/api/runs/*` (route prefix)
4. `~/.pokegents/` -> `~/.the-binding-of-agents/` (storage dir)
5. `boa.sh` -> `boa.sh` (launcher script)

- [ ] **Step 1: Survey hit counts before changes**

```bash
cd ~/Projects/the-binding-of-agents
grep -rcw 'PokegentID' --include='*.go' . | grep -v ':0$'
grep -rcw 'PokegentSummary' --include='*.go' . | grep -v ':0$'
grep -rc '/api/pokegents/' --include='*.go' . | grep -v ':0$'
grep -rc '\.pokegents' --include='*.go' --include='*.sh' . | grep -v ':0$'
```

Expected: each command lists Go files with non-zero hit counts. Save the numbers; they're the "before" baseline.

- [ ] **Step 2: Rename PokegentID -> RunID across Go**

```bash
cd ~/Projects/the-binding-of-agents
grep -rl 'PokegentID' --include='*.go' . | xargs sed -i '' 's/PokegentID/RunID/g'
grep -rl '"pokegent_id"' --include='*.go' . | xargs sed -i '' 's/"pokegent_id"/"run_id"/g'
```

Verify:
```bash
grep -rn 'PokegentID\|pokegent_id' --include='*.go' .
```

Expected: zero hits.

- [ ] **Step 3: Rename PokegentSummary -> RunSummary**

```bash
cd ~/Projects/the-binding-of-agents
grep -rl 'PokegentSummary' --include='*.go' . | xargs sed -i '' 's/PokegentSummary/RunSummary/g'
grep -rn 'PokegentSummary' --include='*.go' .
```

Expected: zero hits.

- [ ] **Step 4: Rename API route prefix /api/pokegents/ -> /api/runs/**

```bash
cd ~/Projects/the-binding-of-agents
grep -rl '/api/pokegents/' --include='*.go' . | xargs sed -i '' 's|/api/pokegents/|/api/runs/|g'
grep -rn '/api/pokegents/' --include='*.go' .
```

Expected: zero hits.

- [ ] **Step 5: Rename storage directory references ~/.pokegents -> ~/.the-binding-of-agents**

```bash
cd ~/Projects/the-binding-of-agents
grep -rl '\.pokegents' --include='*.go' --include='*.sh' . | xargs sed -i '' 's|\.pokegents|\.the-binding-of-agents|g'
grep -rn '\.pokegents' --include='*.go' --include='*.sh' .
```

Expected: zero hits.

- [ ] **Step 6: Rename launcher boa.sh -> boa.sh and fix internal references**

```bash
cd ~/Projects/the-binding-of-agents
git mv boa.sh boa.sh 2>/dev/null || mv boa.sh boa.sh
grep -rl 'pokegent\.sh' --include='*.sh' --include='*.go' --include='*.md' . | xargs sed -i '' 's/pokegent\.sh/boa.sh/g'
grep -rn 'pokegent\.sh' .
```

Expected: zero hits. `boa.sh` exists and is the new launcher.

- [ ] **Step 7: Update install.sh paths and binary name**

Inspect:
```bash
cd ~/Projects/the-binding-of-agents
cat install.sh | grep -nE 'pokegents|pokegent'
```

Sweep:
```bash
sed -i '' 's/pokegents/the-binding-of-agents/g; s/pokegent/boa/g' install.sh
grep -nE 'pokegents|pokegent' install.sh
```

Expected: zero hits. Manually scan the file once to confirm nothing was over-replaced (e.g., a comment using the word "pokegents" that should now say something else).

- [ ] **Step 8: Build the Go backend to verify renames compile**

```bash
cd ~/Projects/the-binding-of-agents
GO_DIR=$(dirname $(find . -name 'go.mod' | head -1))
cd "$GO_DIR"
go build ./...
```

Expected: clean build. If failures appear, they are almost always missed identifier references - re-grep for `Pokegent` or `pokegent` and fix.

- [ ] **Step 9: Run existing Go tests**

```bash
cd ~/Projects/the-binding-of-agents
GO_DIR=$(dirname $(find . -name 'go.mod' | head -1))
cd "$GO_DIR"
go test ./...
```

Expected: tests pass (or upstream may have no tests; if so, output says "no test files"). If any test fails, inspect - it may reference an old identifier in test data.

- [ ] **Step 10: Commit**

```bash
cd ~/Projects/the-binding-of-agents
git add -A
git commit -m "$(cat <<'EOF'
Rename Go identifiers: PokegentID -> RunID, routes, storage dir

- PokegentID/pokegent_id -> RunID/run_id
- PokegentSummary -> RunSummary
- /api/pokegents/* -> /api/runs/*
- ~/.pokegents/ -> ~/.the-binding-of-agents/
- boa.sh -> boa.sh

Pure identifier rename, no logic changes. go build + go test pass.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

---

## Task 5: Frontend type and API endpoint renames

**Dependencies:** Task 3. Best run **after** Task 4 (so the frontend types match the backend renames immediately), but technically the file edits are independent if you trust the renames.

**Parallelizable with:** Tasks 4, 6, 7.

**Files:**
- Modify: `dashboard/web/src/types.ts`
- Modify: `dashboard/web/src/api.ts`
- Modify: `dashboard/web/src/App.tsx`

The five renames in this task:
1. TS interface `PokegentSummary` -> `RunSummary`
2. TS field `pokegent_id` / `pokegentId` -> `run_id` / `runId`
3. API endpoint paths `/api/pokegents/*` -> `/api/runs/*`
4. localStorage key prefix `"pokegents"` -> `"boa"`
5. Default sprite string `"pokeball"` -> `"isaac"` (in `App.tsx`)

- [ ] **Step 1: Inspect frontend hit counts**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web/src
grep -rn 'PokegentSummary\|pokegent_id\|pokegentId' --include='*.ts' --include='*.tsx' .
grep -rn '/api/pokegents/' --include='*.ts' --include='*.tsx' .
grep -rn '"pokegents"' --include='*.ts' --include='*.tsx' .
grep -rn '"pokeball"' --include='*.ts' --include='*.tsx' .
```

Expected: each command shows the lines to change.

- [ ] **Step 2: Apply renames**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web/src
grep -rl 'PokegentSummary' --include='*.ts' --include='*.tsx' . | xargs sed -i '' 's/PokegentSummary/RunSummary/g'
grep -rl 'pokegent_id' --include='*.ts' --include='*.tsx' . | xargs sed -i '' 's/pokegent_id/run_id/g'
grep -rl 'pokegentId' --include='*.ts' --include='*.tsx' . | xargs sed -i '' 's/pokegentId/runId/g'
grep -rl '/api/pokegents/' --include='*.ts' --include='*.tsx' . | xargs sed -i '' 's|/api/pokegents/|/api/runs/|g'
grep -rl '"pokegents"' --include='*.ts' --include='*.tsx' . | xargs sed -i '' 's/"pokegents"/"boa"/g'
```

- [ ] **Step 3: Update default sprite in App.tsx**

Locate the default sprite reference:
```bash
cd ~/Projects/the-binding-of-agents/dashboard/web/src
grep -n '"pokeball"' App.tsx
```

For each match that is the *default avatar fallback* (not a generic Pokemon name in a list), replace it. Per the architecture report, `App.tsx` references `"pokeball"` 3 times for the default avatar. Use:
```bash
sed -i '' 's/"pokeball"/"isaac"/g' App.tsx
grep -n '"isaac"' App.tsx
```

Expected: 3 lines now use `"isaac"`.

- [ ] **Step 4: Verify frontend type-checks**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web
npm install --no-audit --silent
npx tsc --noEmit
```

Expected: tsc completes without errors. If errors appear, they are almost always missed identifier references - re-grep.

- [ ] **Step 5: Verify the dev build still completes**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web
npm run build
```

Expected: vite build succeeds. Output bundle appears under `dist/`.

- [ ] **Step 6: Commit**

```bash
cd ~/Projects/the-binding-of-agents
git add -A
git commit -m "$(cat <<'EOF'
Rename frontend types and API paths

- PokegentSummary -> RunSummary
- pokegent_id/pokegentId -> run_id/runId
- /api/pokegents/* -> /api/runs/*
- localStorage prefix "pokegents" -> "boa"
- Default sprite "pokeball" -> "isaac"

Mirror of the Go-side renames in Task 4. tsc and vite build pass.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

---

## Task 6: Theme system foundation (palette, font, active theme)

**Dependencies:** Task 1.
**Parallelizable with:** Tasks 4, 5, 7.

**Files:**
- Modify: `dashboard/web/src/theme/themes.json`
- Modify: `dashboard/web/src/theme/themeRegistry.ts`
- Modify: `dashboard/web/src/styles/pokemon.css` -> rename to `tboi.css`
- Modify: `dashboard/web/index.html` (load Upheaval font)
- Modify: `dashboard/web/src/main.tsx` (or wherever pokemon.css is imported)

- [ ] **Step 1: Inspect current themes.json**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web/src/theme
cat themes.json
```

Expected: shows a structure with a single `"fire-red"` theme. Note the exact shape (top-level keys, nesting).

- [ ] **Step 2: Add tboi-basement entry to themes.json**

Open `dashboard/web/src/theme/themes.json` and add a sibling entry next to `"fire-red"`. The shape follows whatever `ThemeDefinition` requires; the spec proposes this content:

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

If the existing `ThemeDefinition` schema uses different keys (e.g., flat keys instead of nested), adjust accordingly. Inspect `themeTypes.ts` to confirm the schema before editing.

- [ ] **Step 3: Set active theme to tboi-basement in themeRegistry.ts**

Inspect:
```bash
cat ~/Projects/the-binding-of-agents/dashboard/web/src/theme/themeRegistry.ts
```

Identify where the active theme is selected (likely a `DEFAULT_THEME` or `ACTIVE_THEME` constant, or a function call like `getTheme('fire-red')`). Change `'fire-red'` to `'tboi-basement'`:
```bash
cd ~/Projects/the-binding-of-agents/dashboard/web/src/theme
sed -i '' "s/'fire-red'/'tboi-basement'/g" themeRegistry.ts
grep -n 'tboi-basement\|fire-red' themeRegistry.ts
```

Expected: active theme now points at `tboi-basement`; `fire-red` entry remains in `themes.json` but unused.

- [ ] **Step 4: Rename pokemon.css to tboi.css**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web/src/styles
git mv pokemon.css tboi.css 2>/dev/null || mv pokemon.css tboi.css
```

Update the import in the consuming file (likely `main.tsx` or `App.tsx`):
```bash
cd ~/Projects/the-binding-of-agents/dashboard/web/src
grep -rln 'pokemon\.css' --include='*.ts' --include='*.tsx' . | xargs sed -i '' "s|pokemon\.css|tboi.css|g"
grep -rn 'pokemon\.css' --include='*.ts' --include='*.tsx' .
```

Expected: zero hits. The import now references `tboi.css`.

- [ ] **Step 5: Update CSS variable names in tboi.css to match new palette**

Open `dashboard/web/src/styles/tboi.css`. Replace Pokemon-specific variable names with TBOI ones where they appear (the existing file uses tokens like `--theme-pc-box-*`; rename to `--theme-bestiary-*`).

Search and replace pattern map:
```bash
cd ~/Projects/the-binding-of-agents/dashboard/web/src/styles
sed -i '' 's/--theme-pc-box-/--theme-bestiary-/g' tboi.css
grep -n -- '--theme-' tboi.css | head -20
```

Manually inspect the file once. Any token name that still says "pokemon", "pc-box", "trainer", etc., should be renamed for clarity. Token *values* (hex colors) should be updated to match the palette in Step 2.

- [ ] **Step 6: Load Upheaval font in index.html**

Open `dashboard/web/index.html`. In the `<head>`, add:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<style>
  @font-face {
    font-family: 'Upheaval TT BRK';
    src: url('/fonts/upheavtt.ttf') format('truetype');
    font-display: swap;
  }
</style>
```

Then place the font file:
```bash
mkdir -p ~/Projects/the-binding-of-agents/dashboard/web/public/fonts
# Download upheavtt.ttf from https://www.dafont.com/upheaval.font and save to:
# ~/Projects/the-binding-of-agents/dashboard/web/public/fonts/upheavtt.ttf
```

The font is free for non-commercial use; the attribution is already in `THIRD_PARTY_NOTICES.md`.

- [ ] **Step 7: Verify dev server boots and the theme loads**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web
npm run dev
```

Open `http://localhost:<port>` in a browser. Verify:
1. The page loads without console errors.
2. Background is dark (basement charcoal), not Pokemon blue.
3. Text renders in Upheaval (or falls back to Press Start 2P).

Expected: visible theme change. Some elements may still look Pokemon-flavored (the components themselves haven't been retemmed yet) - that comes in later tasks.

- [ ] **Step 8: Commit**

```bash
cd ~/Projects/the-binding-of-agents
git add -A
git commit -m "$(cat <<'EOF'
Add tboi-basement theme; rename pokemon.css to tboi.css

- themes.json: new tboi-basement entry with TBOI palette
- themeRegistry.ts: active theme switched to tboi-basement
- styles/pokemon.css renamed to tboi.css; variable tokens renamed
- index.html: loads Upheaval TT BRK font

The fire-red theme entry remains in themes.json but is no longer
the default.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

---

## Task 7: Sprite manifest and slicing script

**Dependencies:** Task 1.
**Parallelizable with:** Tasks 4, 5, 6.

**Files:**
- Create: `scripts/download-tboi-sheets.sh`
- Create: `scripts/slice-tboi-sheets.ts`
- Create: `sprite-sources/manifest.json` (skeleton with ~5 example entries; Task 8 fills the rest)
- Create: `sprite-sources/.gitignore`
- Modify: `scripts/fetch-pokesprite-assets.sh` (delete)
- Modify: `dashboard/web/package.json` (add `sharp` as a dev dependency)

- [ ] **Step 1: Delete the upstream Pokemon sprite fetch script**

```bash
cd ~/Projects/the-binding-of-agents
git rm scripts/fetch-pokesprite-assets.sh
```

Expected: file removed from the index.

- [ ] **Step 2: Create sprite-sources directory and gitignore**

```bash
cd ~/Projects/the-binding-of-agents
mkdir -p sprite-sources/sheets
cat > sprite-sources/.gitignore <<'EOF'
sheets/
EOF
touch sprite-sources/sheets/.gitkeep
```

Expected: `sprite-sources/.gitignore` excludes `sheets/`. `.gitkeep` is committed so the directory exists in the repo without containing sheets.

- [ ] **Step 3: Write the manifest skeleton with 5 example entries**

Create `~/Projects/the-binding-of-agents/sprite-sources/manifest.json`:
```json
{
  "version": 1,
  "target_size": [96, 96],
  "interpolation": "nearest",
  "output_dir": "dashboard/web/public/sprites",
  "entries": [
    {
      "slug": "isaac",
      "name": "Isaac",
      "kind": "character",
      "sheet": "playable-characters-repentance.png",
      "bbox": [0, 0, 28, 40],
      "source_url": "https://www.spriters-resource.com/pc_computer/bindingofisaacrebirth/sheet/176014/",
      "license_note": "From The Binding of Isaac: Rebirth (c) Edmund McMillen / Nicalis. Fair-use fan-project, non-commercial."
    },
    {
      "slug": "magdalene",
      "name": "Magdalene",
      "kind": "character",
      "sheet": "playable-characters-repentance.png",
      "bbox": [32, 0, 28, 40],
      "source_url": "https://www.spriters-resource.com/pc_computer/bindingofisaacrebirth/sheet/176014/",
      "license_note": "From The Binding of Isaac: Rebirth (c) Edmund McMillen / Nicalis. Fair-use fan-project, non-commercial."
    },
    {
      "slug": "cain",
      "name": "Cain",
      "kind": "character",
      "sheet": "playable-characters-repentance.png",
      "bbox": [64, 0, 28, 40],
      "source_url": "https://www.spriters-resource.com/pc_computer/bindingofisaacrebirth/sheet/176014/",
      "license_note": "From The Binding of Isaac: Rebirth (c) Edmund McMillen / Nicalis. Fair-use fan-project, non-commercial."
    },
    {
      "slug": "judas",
      "name": "Judas",
      "kind": "character",
      "sheet": "playable-characters-repentance.png",
      "bbox": [96, 0, 28, 40],
      "source_url": "https://www.spriters-resource.com/pc_computer/bindingofisaacrebirth/sheet/176014/",
      "license_note": "From The Binding of Isaac: Rebirth (c) Edmund McMillen / Nicalis. Fair-use fan-project, non-commercial."
    },
    {
      "slug": "brother-bobby",
      "name": "Brother Bobby",
      "kind": "familiar",
      "sheet": "familiars-rebirth.png",
      "bbox": [0, 0, 16, 16],
      "source_url": "https://www.spriters-resource.com/pc_computer/bindingofisaacrebirth/sheet/152314/",
      "license_note": "From The Binding of Isaac: Rebirth (c) Edmund McMillen / Nicalis. Fair-use fan-project, non-commercial."
    }
  ]
}
```

The example bboxes will need verification once real sheets are downloaded (Task 8). They are placeholders that follow the schema but will be corrected when the maintainer visually inspects the sheets.

- [ ] **Step 4: Write scripts/download-tboi-sheets.sh**

Create `~/Projects/the-binding-of-agents/scripts/download-tboi-sheets.sh`:
```bash
#!/usr/bin/env bash
# Downloads source sprite sheets from The Spriters Resource into sprite-sources/sheets/.
# Maintainer-run, one-time. The downloaded sheets are gitignored.
#
# Sheets are NOT auto-discoverable; the URLs below are curated by the maintainer
# based on what's needed for the sprite manifest. Update as needed.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$REPO_ROOT/sprite-sources/sheets"
mkdir -p "$DEST"

# Source sheets (curated by maintainer). Format: <local-filename> <url-to-direct-png>.
# These direct URLs must be obtained from the Spriters Resource sheet pages.
SHEETS=(
  "playable-characters-repentance.png https://www.spriters-resource.com/resources/sheets/176/176014.png"
  "playable-characters-tainted.png   https://www.spriters-resource.com/resources/sheets/152/152315.png"
  "familiars-rebirth.png             https://www.spriters-resource.com/resources/sheets/152/152314.png"
)

for entry in "${SHEETS[@]}"; do
  read -r filename url <<< "$entry"
  out="$DEST/$filename"
  if [[ -f "$out" ]]; then
    echo "skip: $filename already present"
    continue
  fi
  echo "fetch: $filename"
  curl -fL -o "$out" "$url"
done

echo "Sheets in $DEST:"
ls -la "$DEST"
```

Make it executable:
```bash
chmod +x ~/Projects/the-binding-of-agents/scripts/download-tboi-sheets.sh
```

The URLs in the SHEETS array are illustrative - they must be verified against the actual Spriters Resource pages before running. Task 8 covers that verification.

- [ ] **Step 5: Add sharp as a dev dependency**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web
npm install --save-dev sharp tsx
```

Expected: `package.json` now lists `sharp` and `tsx` under `devDependencies`. The slicing script uses `sharp` (image manipulation) and `tsx` (run TS without a separate build step).

- [ ] **Step 6: Write scripts/slice-tboi-sheets.ts**

Create `~/Projects/the-binding-of-agents/scripts/slice-tboi-sheets.ts`:
```typescript
#!/usr/bin/env tsx
// Reads sprite-sources/manifest.json, slices each entry's bbox from its source sheet,
// scales to target size with nearest-neighbor, and writes the result PNG to output_dir.
//
// Usage:
//   npx tsx scripts/slice-tboi-sheets.ts
//
// Outputs PNGs are committed to the repo. Source sheets are gitignored.

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

interface ManifestEntry {
  slug: string;
  name: string;
  kind: string;
  sheet: string;
  bbox: [number, number, number, number]; // [x, y, w, h]
  source_url: string;
  license_note: string;
}

interface Manifest {
  version: number;
  target_size: [number, number];
  interpolation: 'nearest' | 'bilinear' | 'cubic';
  output_dir: string;
  entries: ManifestEntry[];
}

const REPO_ROOT = path.resolve(__dirname, '..');

async function main() {
  const manifestPath = path.join(REPO_ROOT, 'sprite-sources/manifest.json');
  const sheetsDir = path.join(REPO_ROOT, 'sprite-sources/sheets');

  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8')) as Manifest;
  const outDir = path.join(REPO_ROOT, manifest.output_dir);
  await fs.mkdir(outDir, { recursive: true });

  const [targetW, targetH] = manifest.target_size;
  const kernel = manifest.interpolation === 'nearest'
    ? sharp.kernel.nearest
    : manifest.interpolation === 'bilinear'
      ? sharp.kernel.lanczos2
      : sharp.kernel.lanczos3;

  let ok = 0;
  let failed = 0;
  for (const entry of manifest.entries) {
    const sheetPath = path.join(sheetsDir, entry.sheet);
    const outPath = path.join(outDir, `${entry.slug}.png`);
    const [x, y, w, h] = entry.bbox;
    try {
      await sharp(sheetPath)
        .extract({ left: x, top: y, width: w, height: h })
        .resize(targetW, targetH, { kernel, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(outPath);
      console.log(`ok  ${entry.slug}`);
      ok++;
    } catch (err) {
      console.error(`FAIL ${entry.slug}: ${err instanceof Error ? err.message : String(err)}`);
      failed++;
    }
  }
  console.log(`\nDone. ${ok} ok, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main();
```

- [ ] **Step 7: Test the slicing script with the 5-entry manifest**

This step requires the source sheets to actually exist locally. To test the pipeline without real sheets:
```bash
cd ~/Projects/the-binding-of-agents
# Create a placeholder sheet for testing (200x200 transparent PNG)
mkdir -p sprite-sources/sheets
node -e "
const sharp = require('./dashboard/web/node_modules/sharp');
sharp({ create: { width: 200, height: 200, channels: 4, background: { r: 100, g: 50, b: 50, alpha: 1 } } })
  .png().toFile('sprite-sources/sheets/playable-characters-repentance.png');
sharp({ create: { width: 200, height: 200, channels: 4, background: { r: 50, g: 100, b: 50, alpha: 1 } } })
  .png().toFile('sprite-sources/sheets/playable-characters-tainted.png');
sharp({ create: { width: 200, height: 200, channels: 4, background: { r: 50, g: 50, b: 100, alpha: 1 } } })
  .png().toFile('sprite-sources/sheets/familiars-rebirth.png');
console.log('placeholders ready');
"

# Run the slicing script
cd ~/Projects/the-binding-of-agents/dashboard/web
npx tsx ../../scripts/slice-tboi-sheets.ts
```

Expected output:
```
ok  isaac
ok  magdalene
ok  cain
ok  judas
ok  brother-bobby

Done. 5 ok, 0 failed.
```

Verify:
```bash
ls -la ~/Projects/the-binding-of-agents/dashboard/web/public/sprites/
```

Expected: 5 96x96 PNGs (`isaac.png`, `magdalene.png`, `cain.png`, `judas.png`, `brother-bobby.png`). Each is a colored square (since they were sliced from placeholder sheets) but the dimensions and presence prove the pipeline works.

- [ ] **Step 8: Remove test placeholder sprites before committing**

```bash
rm ~/Projects/the-binding-of-agents/dashboard/web/public/sprites/isaac.png
rm ~/Projects/the-binding-of-agents/dashboard/web/public/sprites/magdalene.png
rm ~/Projects/the-binding-of-agents/dashboard/web/public/sprites/cain.png
rm ~/Projects/the-binding-of-agents/dashboard/web/public/sprites/judas.png
rm ~/Projects/the-binding-of-agents/dashboard/web/public/sprites/brother-bobby.png
rm ~/Projects/the-binding-of-agents/sprite-sources/sheets/*.png
```

Real sprites are committed in Task 8.

- [ ] **Step 9: Commit**

```bash
cd ~/Projects/the-binding-of-agents
git add -A
git commit -m "$(cat <<'EOF'
Add sprite pipeline: manifest schema and slicing script

- scripts/download-tboi-sheets.sh: maintainer-run sheet fetcher
- scripts/slice-tboi-sheets.ts: sharp-based slicer, nearest-neighbor
  scale to 96x96
- sprite-sources/manifest.json: 5 example entries (full 84-entry
  manifest is built in Task 8)
- sprite-sources/.gitignore: excludes downloaded sheets
- Delete upstream scripts/fetch-pokesprite-assets.sh

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

---

## Task 8: Maintainer-run sprite curation and generation (84 entries)

**Dependencies:** Task 7.
**Parallelizable with:** Tasks 9-15 starting **after** the 84 PNGs land. The frontend tasks can use placeholder PNGs in the meantime, but production-ready output requires this task.

**This task requires human judgment.** A subagent cannot reliably curate 84 entries from spriters-resource.com without visual inspection. The agent's role is to scaffold + verify; the human picks the specific sprites and fills in correct bboxes.

**Files:**
- Modify: `sprite-sources/manifest.json` (expand to 84 entries)
- Create: `dashboard/web/public/sprites/*.png` (84 committed PNGs)
- Modify: `THIRD_PARTY_NOTICES.md` (per-sprite attribution table)

- [ ] **Step 1: Confirm the URLs in download-tboi-sheets.sh resolve**

```bash
cd ~/Projects/the-binding-of-agents
for url in $(grep -oE 'https://[^ ]*' scripts/download-tboi-sheets.sh); do
  echo -n "$url: "
  curl -sSL -I "$url" | head -1
done
```

Expected: each URL returns `HTTP/2 200` or `HTTP/1.1 200 OK`. If a URL 404s or returns HTML instead of PNG, the URL is wrong - browse to the Spriters Resource page in a browser, copy the direct PNG download link, and update `scripts/download-tboi-sheets.sh`.

- [ ] **Step 2: Download the source sheets**

```bash
cd ~/Projects/the-binding-of-agents
bash scripts/download-tboi-sheets.sh
ls -la sprite-sources/sheets/
```

Expected: 3-5 PNG files (one per sheet) in `sprite-sources/sheets/`, each multiple MB.

- [ ] **Step 3: Open each sheet in a viewer and identify the 84 sprite bboxes**

Open each downloaded sheet in an image viewer (Preview.app on macOS, or a web tool like https://pixel-ruler.app). For each sprite to include:
1. Note the sprite's position (x, y) on the sheet
2. Note the sprite's width and height
3. Record an `slug` (kebab-case, e.g., `isaac`, `tainted-isaac`, `brother-bobby`)
4. Record a `name` (display name, e.g., "Isaac", "Tainted Isaac", "Brother Bobby")
5. Record the `kind` (`character` | `tainted` | `familiar`)

Target composition (from spec):
- 17 base playable characters (Isaac, Magdalene, Cain, Judas, ???, Eve, Samson, Azazel, Lazarus, Eden, The Lost, Lilith, Keeper, Apollyon, Forgotten, Bethany, Jacob & Esau)
- 17 Tainted variants (same names, `tainted-` prefix)
- 50 familiars (curate from the familiars sheet)

This is the manual, judgment-driven part of the task.

- [ ] **Step 4: Expand manifest.json to 84 entries**

Edit `sprite-sources/manifest.json` and replace the `entries` array with all 84 entries. Maintain the schema from Task 7. Example for the first three:
```json
"entries": [
  { "slug": "isaac", "name": "Isaac", "kind": "character", "sheet": "playable-characters-repentance.png", "bbox": [0, 0, 28, 40], "source_url": "...", "license_note": "..." },
  { "slug": "magdalene", "name": "Magdalene", "kind": "character", "sheet": "playable-characters-repentance.png", "bbox": [32, 0, 28, 40], "source_url": "...", "license_note": "..." },
  { "slug": "cain", "name": "Cain", "kind": "character", "sheet": "playable-characters-repentance.png", "bbox": [64, 0, 28, 40], "source_url": "...", "license_note": "..." }
  // ... 81 more entries
]
```

Validate the JSON:
```bash
cd ~/Projects/the-binding-of-agents
python3 -c "import json; m = json.load(open('sprite-sources/manifest.json')); print(f'{len(m[\"entries\"])} entries')"
```

Expected: `84 entries`. If the count is wrong, the manifest is missing entries or has duplicates.

- [ ] **Step 5: Run the slicing pipeline**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web
npx tsx ../../scripts/slice-tboi-sheets.ts
```

Expected:
```
ok  isaac
ok  magdalene
... (84 lines)
Done. 84 ok, 0 failed.
```

If any sprite fails, the bbox is likely out of bounds. Fix the bbox in `manifest.json` and re-run.

- [ ] **Step 6: Visually inspect the output sprites**

```bash
open ~/Projects/the-binding-of-agents/dashboard/web/public/sprites
```

Verify each sprite:
1. Shows the intended character/familiar (not blank, not a cropped neighbor sprite)
2. Has transparent background (no opaque rectangle)
3. Is centered in the 96x96 frame

For sprites that look wrong, adjust the bbox in `manifest.json` and re-run Step 5. Iterate until all 84 are correct.

- [ ] **Step 7: Populate THIRD_PARTY_NOTICES.md per-sprite table**

```bash
cd ~/Projects/the-binding-of-agents
python3 <<'EOF'
import json
m = json.load(open('sprite-sources/manifest.json'))
print('| Slug | Source sheet URL |')
print('|------|------------------|')
for e in m['entries']:
    print(f'| `{e["slug"]}` | {e["source_url"]} |')
EOF
```

Copy the output and paste it into `THIRD_PARTY_NOTICES.md` under the existing sprite attribution placeholder.

- [ ] **Step 8: Commit sprites and notices**

```bash
cd ~/Projects/the-binding-of-agents
git add sprite-sources/manifest.json dashboard/web/public/sprites/ THIRD_PARTY_NOTICES.md
git status | head
git commit -m "$(cat <<'EOF'
Add 84 TBOI sprites (17 characters + 17 tainted + 50 familiars)

Sprites sliced from Spriters Resource sheets via the manifest pipeline
(scripts/slice-tboi-sheets.ts). 96x96 PNGs with nearest-neighbor scaling.
Per-sprite attribution table populated in THIRD_PARTY_NOTICES.md.

Source sheets remain gitignored in sprite-sources/sheets/.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds; `dashboard/web/public/sprites/` now contains 84 committed PNGs.

---

## Task 9: Replace POKEMON_SPRITES with ISAAC_CHARACTERS

**Dependencies:** Task 8 (need the manifest to derive the slug list) and Task 5 (need frontend renames done).
**Parallelizable with:** Tasks 10, 11, 12, 13, 14, 15.

**Files:**
- Modify: `dashboard/web/src/components/sprites.ts` (replace contents)

- [ ] **Step 1: Inspect current sprites.ts**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web/src/components
wc -l sprites.ts
head -5 sprites.ts
```

Expected: 908 lines, exports `POKEMON_SPRITES` array.

- [ ] **Step 2: Generate the new sprite slug list from manifest.json**

```bash
cd ~/Projects/the-binding-of-agents
python3 <<'EOF'
import json
m = json.load(open('sprite-sources/manifest.json'))
slugs = sorted(set(e['slug'] for e in m['entries']))
print(f"// 84 ISAAC_CHARACTERS entries from sprite-sources/manifest.json")
print(f"// Generated; do not edit by hand. Re-run: python3 scripts/regen-sprites-ts.py")
print(f"export const ISAAC_CHARACTERS: readonly string[] = [")
for s in slugs:
    print(f'  "{s}",')
print(f"] as const;")
print()
print(f"export type IsaacCharacterId = typeof ISAAC_CHARACTERS[number];")
EOF
```

This prints the new `sprites.ts` contents.

- [ ] **Step 3: Overwrite sprites.ts**

Pipe the generator output to the file:
```bash
cd ~/Projects/the-binding-of-agents
python3 <<'PYEOF' > dashboard/web/src/components/sprites.ts
import json
m = json.load(open('sprite-sources/manifest.json'))
slugs = sorted(set(e['slug'] for e in m['entries']))
print(f"// 84 ISAAC_CHARACTERS entries from sprite-sources/manifest.json")
print(f"// Generated; do not edit by hand.")
print(f"export const ISAAC_CHARACTERS: readonly string[] = [")
for s in slugs:
    print(f'  "{s}",')
print(f"] as const;")
print()
print(f"export type IsaacCharacterId = typeof ISAAC_CHARACTERS[number];")
PYEOF

wc -l dashboard/web/src/components/sprites.ts
head -5 dashboard/web/src/components/sprites.ts
```

Expected: file is ~90 lines and starts with the generated header.

- [ ] **Step 4: Find consumers of POKEMON_SPRITES and update imports**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web/src
grep -rln 'POKEMON_SPRITES' --include='*.ts' --include='*.tsx' .
```

For each file in the result, update the import and usage:
```bash
grep -rl 'POKEMON_SPRITES' --include='*.ts' --include='*.tsx' . | xargs sed -i '' 's/POKEMON_SPRITES/ISAAC_CHARACTERS/g'
grep -rn 'POKEMON_SPRITES' --include='*.ts' --include='*.tsx' .
```

Expected: zero hits.

- [ ] **Step 5: Verify type-check passes**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web
npx tsc --noEmit
```

Expected: clean. Any errors indicate stale references to `POKEMON_SPRITES` or to the old type name.

- [ ] **Step 6: Commit**

```bash
cd ~/Projects/the-binding-of-agents
git add -A
git commit -m "$(cat <<'EOF'
Replace POKEMON_SPRITES with ISAAC_CHARACTERS (84 entries)

Derived from sprite-sources/manifest.json. All call sites updated.
tsc passes.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

---

## Task 10: Rename Pokemon-named components

**Dependencies:** Task 1.
**Parallelizable with:** Tasks 9, 11, 12, 13, 14, 15.

**Files:**
- Rename: `CreatureIcon.tsx` -> `CharacterIcon.tsx`
- Rename: `PokeballAnimation.tsx` -> `DoorAnimation.tsx`
- Rename: `TownView.tsx` -> `BasementView.tsx`
- Rename: `SpritePicker.tsx` -> `CharacterPicker.tsx`

These are filename/identifier renames only - the inner logic is unchanged in this task. Visual behavior changes come in Tasks 12-14.

- [ ] **Step 1: Inventory references to each component**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web/src
for name in CreatureIcon PokeballAnimation TownView SpritePicker; do
  echo "== $name =="
  grep -rln "$name" --include='*.ts' --include='*.tsx' .
done
```

Expected: each shows a small set of files (the component itself plus its consumers).

- [ ] **Step 2: Rename CreatureIcon -> CharacterIcon**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web/src/components
git mv CreatureIcon.tsx CharacterIcon.tsx 2>/dev/null || mv CreatureIcon.tsx CharacterIcon.tsx
cd ..
grep -rl 'CreatureIcon' --include='*.ts' --include='*.tsx' . | xargs sed -i '' 's/CreatureIcon/CharacterIcon/g'
grep -rn 'CreatureIcon' --include='*.ts' --include='*.tsx' .
```

Expected: zero hits.

- [ ] **Step 3: Rename PokeballAnimation -> DoorAnimation**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web/src/components
git mv PokeballAnimation.tsx DoorAnimation.tsx 2>/dev/null || mv PokeballAnimation.tsx DoorAnimation.tsx
cd ..
grep -rl 'PokeballAnimation' --include='*.ts' --include='*.tsx' . | xargs sed -i '' 's/PokeballAnimation/DoorAnimation/g'
grep -rn 'PokeballAnimation' --include='*.ts' --include='*.tsx' .
```

Expected: zero hits.

- [ ] **Step 4: Rename TownView -> BasementView**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web/src/components
git mv TownView.tsx BasementView.tsx 2>/dev/null || mv TownView.tsx BasementView.tsx
cd ..
grep -rl 'TownView' --include='*.ts' --include='*.tsx' . | xargs sed -i '' 's/TownView/BasementView/g'
grep -rn 'TownView' --include='*.ts' --include='*.tsx' .
```

Expected: zero hits.

- [ ] **Step 5: Rename SpritePicker -> CharacterPicker**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web/src/components
git mv SpritePicker.tsx CharacterPicker.tsx 2>/dev/null || mv SpritePicker.tsx CharacterPicker.tsx
cd ..
grep -rl 'SpritePicker' --include='*.ts' --include='*.tsx' . | xargs sed -i '' 's/SpritePicker/CharacterPicker/g'
grep -rn 'SpritePicker' --include='*.ts' --include='*.tsx' .
```

Expected: zero hits.

- [ ] **Step 6: Verify type-check and build**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web
npx tsc --noEmit
npm run build
```

Expected: both succeed.

- [ ] **Step 7: Commit**

```bash
cd ~/Projects/the-binding-of-agents
git add -A
git commit -m "$(cat <<'EOF'
Rename Pokemon-named components (file + identifier rename only)

- CreatureIcon -> CharacterIcon
- PokeballAnimation -> DoorAnimation
- TownView -> BasementView
- SpritePicker -> CharacterPicker

Inner logic unchanged. Tasks 12-14 will retheme the actual behavior.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

---

## Task 11: Update hardcoded copy strings

**Dependencies:** Tasks 1, 6.
**Parallelizable with:** Tasks 9, 10, 12, 13, 14, 15.

**Files:**
- Modify: `dashboard/web/src/components/SessionBrowser.tsx` ("PC Box" -> "The Bestiary")
- Modify: `dashboard/web/src/App.tsx` (status pills SLP/ATK/OK -> REST/FIGHT/CLEAR)
- Modify: any other file with hardcoded Pokemon-flavored copy

- [ ] **Step 1: Find hardcoded copy strings**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web/src
grep -rn '"PC Box"\|"Pokegents"\|"Trainer"\|"SLP"\|"ATK"\|>OK<\|"Pokemon"' --include='*.ts' --include='*.tsx' --include='*.html' .
```

Expected: a small list of files and lines.

- [ ] **Step 2: Replace SessionBrowser copy**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web/src/components
sed -i '' 's/"PC Box"/"The Bestiary"/g' SessionBrowser.tsx
grep -n 'PC Box\|Bestiary' SessionBrowser.tsx
```

Expected: "The Bestiary" appears; "PC Box" is gone.

- [ ] **Step 3: Replace status pill labels**

Status pills appear in `App.tsx` per the architecture report. Apply:
```bash
cd ~/Projects/the-binding-of-agents/dashboard/web/src
sed -i '' 's/"SLP"/"REST"/g; s/"ATK"/"FIGHT"/g' App.tsx
# OK is harder to grep safely; inspect first:
grep -n '>OK<\|"OK"' App.tsx
```

For each `>OK<` or `"OK"` match that is the status pill (not unrelated), change to `>CLEAR<` / `"CLEAR"`:
```bash
# Targeted sed once the context is confirmed:
sed -i '' 's/>OK</>CLEAR</g' App.tsx
grep -n 'REST\|FIGHT\|CLEAR\|SLP\|ATK' App.tsx
```

Expected: REST/FIGHT/CLEAR present; SLP/ATK absent. Some OK may remain if it's not a status pill - that's fine.

- [ ] **Step 4: Replace generic Pokemon-flavored copy**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web/src
grep -rln '"Pokegents"\|"Pokegent"\|"Trainer"\|pokegents-' --include='*.ts' --include='*.tsx' --include='*.html' .
```

For each file, inspect context and replace appropriately. Most likely targets:
- `App.tsx` title text "Pokegents" -> "the binding of agents"
- Any "Trainer" reference -> drop or rename to "Player" / "Owner"

Apply targeted sed for each confirmed string. Avoid global sweeps - context-sensitive replacements are safer.

- [ ] **Step 5: Verify type-check and visual smoke**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web
npx tsc --noEmit
npm run dev
```

Open the dashboard in a browser. Confirm:
1. Status pills now show REST/FIGHT/CLEAR
2. The PC Box modal title shows "The Bestiary"
3. No remaining "Pokegents" or "Trainer" text in visible UI

- [ ] **Step 6: Commit**

```bash
cd ~/Projects/the-binding-of-agents
git add -A
git commit -m "$(cat <<'EOF'
Update hardcoded copy strings to TBOI vocabulary

- SLP/ATK/OK -> REST/FIGHT/CLEAR (status pills in App.tsx)
- "PC Box" -> "The Bestiary" (SessionBrowser.tsx)
- "Pokegents" -> "the binding of agents" (App.tsx title)
- "Trainer" -> dropped or contextually renamed

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

---

## Task 12: BasementView - swap town.png with TBOI floor plan

**Dependencies:** Tasks 8 (need a basement-floor image asset) and 10 (component rename done).
**Parallelizable with:** Tasks 9, 11, 13, 14, 15.

**Files:**
- Modify: `dashboard/web/src/components/BasementView.tsx`
- Replace asset: `dashboard/web/public/town.png` -> `dashboard/web/public/basement-floor.png`
- Modify: `dashboard/web/public/town-mask.json` -> rename to `basement-floor-mask.json` or update inline

- [ ] **Step 1: Inspect current BasementView.tsx for town.png references**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web/src/components
grep -n 'town\.png\|town-mask' BasementView.tsx
```

Expected: matches indicating where the overworld image is loaded and where the walkable-mask JSON is loaded.

- [ ] **Step 2: Source a TBOI basement floor image**

For v1, source a single basement-floor image (544x480 or similar) from:
- A Spriters Resource map sheet, or
- A community-shared TBOI room template, or
- Hand-crafted in a pixel-art editor (Aseprite, Piskel)

Save to `dashboard/web/public/basement-floor.png`. Update `THIRD_PARTY_NOTICES.md` with attribution.

If no suitable asset is available at this point, use a placeholder: a 544x480 dark-brown PNG with a grid pattern. This is a compression option per spec (the team can come back and polish).

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web/public
# Placeholder if needed:
node -e "
const sharp = require('../node_modules/sharp');
sharp({ create: { width: 544, height: 480, channels: 4, background: { r: 26, g: 20, b: 16, alpha: 1 } } })
  .png().toFile('basement-floor.png');
console.log('placeholder created');
"
```

- [ ] **Step 3: Update BasementView.tsx to reference the new asset**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web/src/components
sed -i '' 's|town\.png|basement-floor.png|g' BasementView.tsx
sed -i '' 's|town-mask\.json|basement-floor-mask.json|g' BasementView.tsx
grep -n 'basement-floor\|town' BasementView.tsx
```

- [ ] **Step 4: Rename town-mask.json**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web/public
git mv town-mask.json basement-floor-mask.json 2>/dev/null || mv town-mask.json basement-floor-mask.json
git rm town.png 2>/dev/null || rm town.png
```

The walkable-cell coordinates in `basement-floor-mask.json` may need adjustment if the new image has different walkable areas. For a placeholder image, leave the mask coordinates unchanged - they may not match perfectly but the view will render.

- [ ] **Step 5: Verify the view renders**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web
npm run dev
```

In the dashboard, toggle to BasementView. Expected: the new image displays in place of `town.png`. Agent sprites should still appear (they walk on the mask coordinates).

- [ ] **Step 6: Commit**

```bash
cd ~/Projects/the-binding-of-agents
git add -A
git commit -m "$(cat <<'EOF'
Replace TownView asset with basement-floor image

- public/town.png removed; basement-floor.png added (placeholder for v1)
- public/town-mask.json renamed to basement-floor-mask.json
- BasementView.tsx updated to load the new asset

The mask coordinates may need tuning once a final basement-floor
image is sourced (deferred to polish phase).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

---

## Task 13: DoorAnimation - implement door-opening keyframes

**Dependencies:** Task 10 (rename done).
**Parallelizable with:** Tasks 9, 11, 12, 14, 15.

**Files:**
- Modify: `dashboard/web/src/components/DoorAnimation.tsx`
- Modify: associated CSS for animation keyframes

- [ ] **Step 1: Inspect current DoorAnimation.tsx (previously PokeballAnimation)**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web/src/components
wc -l DoorAnimation.tsx
head -30 DoorAnimation.tsx
```

Expected: a small component (~50-150 lines) that renders the pokeball-open animation on collapse/expand.

- [ ] **Step 2: Replace the animation visual**

The pokeball animation renders a pokeball SVG with an "open" keyframe. For the door animation:
1. Replace the pokeball SVG with a door SVG (4-6 keyframes: closed, slightly-open, half-open, fully-open).
2. Or use a sprite sheet of door frames (TBOI doors are pixel-art assets).

For v1, the simplest implementation is a CSS keyframe animation on a pre-rendered door asset. Acquire a door spritesheet (4 frames) and save to `dashboard/web/public/sprites/door-anim.png`. The pipeline from Task 8 can slice this if added to the manifest.

Component rewrite (after sourcing the door asset):
```typescript
// dashboard/web/src/components/DoorAnimation.tsx
import React from 'react';
import './DoorAnimation.css';

interface DoorAnimationProps {
  state: 'closed' | 'opening' | 'open' | 'closing';
  onAnimationEnd?: () => void;
}

export const DoorAnimation: React.FC<DoorAnimationProps> = ({ state, onAnimationEnd }) => {
  return (
    <div
      className={`door door--${state}`}
      onAnimationEnd={onAnimationEnd}
      role="presentation"
    />
  );
};
```

And `DoorAnimation.css`:
```css
.door {
  width: 48px;
  height: 64px;
  background-image: url('/sprites/door-anim.png');
  background-size: 192px 64px; /* 4 frames horizontally */
  background-repeat: no-repeat;
  image-rendering: pixelated;
}

.door--closed { background-position: 0 0; }
.door--open   { background-position: -144px 0; }

.door--opening { animation: door-open 320ms steps(4, end) forwards; }
.door--closing { animation: door-close 320ms steps(4, end) forwards; }

@keyframes door-open {
  from { background-position: 0 0; }
  to   { background-position: -144px 0; }
}

@keyframes door-close {
  from { background-position: -144px 0; }
  to   { background-position: 0 0; }
}
```

- [ ] **Step 3: Update consumers to pass the new state prop**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web/src
grep -rn '<DoorAnimation' --include='*.tsx' .
```

For each consumer, ensure it passes a `state` prop with one of the four values. If the old pokeball component used a different API (e.g., a boolean `open` prop), adapt the consumer to compute the new state.

- [ ] **Step 4: If no door asset is available, fall back to a generic fade**

The compression option in the spec: skip custom keyframes. Replace the component body with:
```typescript
export const DoorAnimation: React.FC<DoorAnimationProps> = ({ state, onAnimationEnd }) => {
  const isOpen = state === 'open' || state === 'opening';
  return (
    <div
      className="door-fade"
      style={{ opacity: isOpen ? 1 : 0, transition: 'opacity 200ms' }}
      onTransitionEnd={onAnimationEnd}
    />
  );
};
```

This satisfies the "DoorAnimation" rename without needing a real asset. Acceptable for v1.

- [ ] **Step 5: Verify dev server renders without errors**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web
npm run dev
```

Trigger an agent collapse/expand in the UI. The animation should run without errors.

- [ ] **Step 6: Commit**

```bash
cd ~/Projects/the-binding-of-agents
git add -A
git commit -m "$(cat <<'EOF'
Implement DoorAnimation (replaces pokeball-open keyframes)

Either: full door spritesheet with 4-frame CSS animation, or a
generic fade fallback for v1 polish-deferred state.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

---

## Task 14: CharacterPicker - "WHO AM I?" layout

**Dependencies:** Tasks 9 (ISAAC_CHARACTERS list), 10 (rename), and Task 8 (sprites available).
**Parallelizable with:** Tasks 11, 12, 13, 15.

**Files:**
- Modify: `dashboard/web/src/components/CharacterPicker.tsx`

- [ ] **Step 1: Inspect current CharacterPicker.tsx**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web/src/components
cat CharacterPicker.tsx | head -50
```

Expected: a modal/picker that shows a grid of sprite options. Note the prop interface (probably `{ value, onChange, onClose }`).

- [ ] **Step 2: Rewrite the layout to evoke TBOI's character select**

Replace the picker body with:
```typescript
// dashboard/web/src/components/CharacterPicker.tsx
import React from 'react';
import { ISAAC_CHARACTERS } from './sprites';
import { PixelSprite } from './PixelSprite';
import './CharacterPicker.css';

interface CharacterPickerProps {
  value: string | null;
  onChange: (slug: string) => void;
  onClose: () => void;
}

export const CharacterPicker: React.FC<CharacterPickerProps> = ({ value, onChange, onClose }) => {
  return (
    <div className="character-picker" role="dialog" aria-labelledby="who-am-i-title">
      <h1 id="who-am-i-title" className="character-picker__title">WHO AM I?</h1>
      <div className="character-picker__grid">
        {ISAAC_CHARACTERS.map(slug => (
          <button
            key={slug}
            className={`character-picker__cell ${slug === value ? 'is-selected' : ''}`}
            onClick={() => { onChange(slug); onClose(); }}
            aria-label={slug}
          >
            <PixelSprite name={slug} />
          </button>
        ))}
      </div>
      <button className="character-picker__close" onClick={onClose}>Close</button>
    </div>
  );
};
```

And `CharacterPicker.css`:
```css
.character-picker {
  background: var(--theme-bg-primary, #1a1410);
  color: var(--theme-fg-primary, #e8d9b8);
  padding: 24px;
  font-family: 'Upheaval TT BRK', 'Press Start 2P', monospace;
}

.character-picker__title {
  text-align: center;
  font-size: 32px;
  letter-spacing: 4px;
  margin: 0 0 24px 0;
  color: var(--theme-accent-blood, #8a1a18);
}

.character-picker__grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.character-picker__cell {
  background: var(--theme-bg-secondary, #2a1f18);
  border: 2px solid var(--theme-border, #3a2d22);
  padding: 8px;
  cursor: pointer;
  transition: transform 80ms steps(2);
}

.character-picker__cell:hover {
  transform: scale(1.05);
  border-color: var(--theme-accent-soul, #c8b85a);
}

.character-picker__cell.is-selected {
  border-color: var(--theme-accent-soul, #c8b85a);
  box-shadow: 0 0 0 2px var(--theme-accent-soul, #c8b85a);
}

.character-picker__close {
  display: block;
  margin: 16px auto 0;
  background: var(--theme-bg-tertiary, #0e0a08);
  color: var(--theme-fg-primary, #e8d9b8);
  border: 2px solid var(--theme-border, #3a2d22);
  padding: 8px 24px;
  cursor: pointer;
  font-family: inherit;
}
```

If the existing component takes additional props (e.g., a search filter), preserve them.

- [ ] **Step 3: Verify type-check and render**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web
npx tsc --noEmit
npm run dev
```

Open the picker (right-click an agent card per architecture report). Expected: "WHO AM I?" title shown in Upheaval, 6-wide grid of 84 character portraits.

- [ ] **Step 4: Compression fallback**

If the custom layout is being skipped for time per the spec compression option, instead just update the header copy:
```typescript
// Minimal compression-mode replacement:
<h1>WHO AM I?</h1>
{/* existing grid below, unchanged */}
```

Document the decision in the commit message.

- [ ] **Step 5: Commit**

```bash
cd ~/Projects/the-binding-of-agents
git add -A
git commit -m "$(cat <<'EOF'
Implement CharacterPicker with TBOI 'WHO AM I?' layout

Replicates TBOI's character-select aesthetic: Upheaval title,
6-wide grid of 84 character portraits, selection highlight in
soul-gold. Theme tokens from tboi-basement palette.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

---

## Task 15: GameModal retheme

**Dependencies:** Tasks 1, 6.
**Parallelizable with:** Tasks 9, 11, 12, 13, 14.

**Files:**
- Modify: `dashboard/web/src/components/GameModal.tsx`
- Modify: associated CSS

- [ ] **Step 1: Inspect GameModal**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web/src/components
wc -l GameModal.tsx
head -40 GameModal.tsx
```

- [ ] **Step 2: Replace GBA-style border with TBOI pause-menu border**

Update the component's CSS to:
1. Use a dark stone/parchment border color from the palette
2. Use a chunky pixel border (no soft shadows)
3. Optionally add a character-portrait slot on the left (for context)

If GameModal currently uses inline styles or a CSS module, edit the file to swap the border color and any pokemon-themed backgrounds:
```bash
cd ~/Projects/the-binding-of-agents/dashboard/web/src/components
# Inspect first:
grep -nE 'border|background-color|border-color' GameModal.tsx
```

Apply targeted replacements based on what's found. For example, if the file has `border: '4px solid #2080d8'` (Pokemon blue), change to `border: '4px solid var(--theme-border, #3a2d22)'`.

- [ ] **Step 3: Verify visual smoke**

```bash
cd ~/Projects/the-binding-of-agents/dashboard/web
npm run dev
```

Open a modal (settings or PC Box). Expected: border is now TBOI-toned (brown/stone), not Pokemon-blue.

- [ ] **Step 4: Commit**

```bash
cd ~/Projects/the-binding-of-agents
git add -A
git commit -m "$(cat <<'EOF'
Retheme GameModal border to TBOI pause-menu palette

Replaces GBA-style blue border with theme tokens from tboi-basement
(stone-brown). No structural changes to the modal layout.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

---

## Task 16: GoReleaser configuration and GitHub Actions workflow

**Dependencies:** Task 3 (module path renamed).
**Parallelizable with:** Tasks 9-15, 17.

**Files:**
- Create: `.goreleaser.yaml`
- Create: `.github/workflows/release.yml`

- [ ] **Step 1: Create .goreleaser.yaml**

Write `~/Projects/the-binding-of-agents/.goreleaser.yaml`:
```yaml
version: 2

project_name: boa

before:
  hooks:
    - bash -c "cd dashboard/web && npm ci && npm run build"

builds:
  - id: boa
    main: ./dashboard/server
    binary: boa
    env:
      - CGO_ENABLED=0
    goos:
      - linux
      - darwin
      - windows
    goarch:
      - amd64
      - arm64
    ignore:
      - goos: windows
        goarch: arm64

archives:
  - id: boa
    name_template: "{{ .ProjectName }}_{{ .Version }}_{{ .Os }}_{{ .Arch }}"
    files:
      - LICENSE
      - NOTICE
      - DISCLAIMER.md
      - THIRD_PARTY_NOTICES.md
      - README.md
      - dashboard/web/dist/**/*

checksum:
  name_template: "checksums.txt"

snapshot:
  version_template: "{{ incpatch .Version }}-next"

changelog:
  sort: asc
  filters:
    exclude:
      - "^docs:"
      - "^test:"
      - "^chore:"
```

The `main:` path may need adjustment depending on where the Go entrypoint lives. If `dashboard/server` is not a `main` package, find the correct entrypoint:
```bash
cd ~/Projects/the-binding-of-agents
grep -rln 'package main' --include='*.go' .
```

Update `.goreleaser.yaml`'s `main:` field to point at the directory containing that file.

- [ ] **Step 2: Create .github/workflows/release.yml**

```bash
mkdir -p ~/Projects/the-binding-of-agents/.github/workflows
```

Write `~/Projects/the-binding-of-agents/.github/workflows/release.yml`:
```yaml
name: release

on:
  push:
    tags:
      - 'v*.*.*'

permissions:
  contents: write

jobs:
  goreleaser:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.22'

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
          cache-dependency-path: dashboard/web/package-lock.json

      - name: Run GoReleaser
        uses: goreleaser/goreleaser-action@v6
        with:
          version: latest
          args: release --clean
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 3: Validate locally with goreleaser check**

```bash
cd ~/Projects/the-binding-of-agents
# Install goreleaser if not present
which goreleaser || brew install goreleaser
goreleaser check
```

Expected: `config is valid` or a clear list of errors to fix.

- [ ] **Step 4: Optionally test a snapshot release locally**

```bash
cd ~/Projects/the-binding-of-agents
goreleaser release --snapshot --clean
ls dist/
```

Expected: `dist/` contains tar.gz archives for all configured os/arch combinations.

- [ ] **Step 5: Commit**

```bash
cd ~/Projects/the-binding-of-agents
git add .goreleaser.yaml .github/workflows/release.yml
git commit -m "$(cat <<'EOF'
Add GoReleaser config and release workflow

- .goreleaser.yaml: cross-compile for darwin/linux/windows (amd64+arm64)
- .github/workflows/release.yml: tag-triggered release pipeline

Builds the frontend with vite as a hook, then bundles the binary
with the dist/ output. Solves the upstream Go-install pain by
publishing pre-built artifacts on tag push.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

---

## Task 17: README rewrite

**Dependencies:** Tasks 1-16 (need the project to actually be a thing before documenting it).
**Parallelizable with:** Task 16.

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace README.md**

Write `~/Projects/the-binding-of-agents/README.md`:
```markdown
# the-binding-of-agents

A TBOI-themed dashboard for managing Claude / Codex AI agent sessions.

> Fork of [pokegents](https://github.com/tRidha/pokegents). All agent orchestration functionality is preserved; only the visual theme is changed. See [DISCLAIMER.md](./DISCLAIMER.md) for IP attribution.

## What it does

`the-binding-of-agents` watches your active Claude / Codex sessions on disk and renders them as a dashboard of "characters" - one Isaac per agent. You can:

- See active sessions at a glance with status pills (REST / FIGHT / CLEAR)
- Browse past sessions in The Bestiary
- Spawn new agents and assign them characters via the "WHO AM I?" picker
- Resume agents from past runs
- Watch the live activity feed per agent

## Install

Pre-built binaries are available on the [Releases](https://github.com/<your-username>/the-binding-of-agents/releases) page. Download the archive for your platform, unzip, and run:

```sh
./boa
```

Then open http://localhost:5199 in your browser.

## Build from source

Requirements: Go 1.22+, Node 18+, npm.

```sh
git clone https://github.com/<your-username>/the-binding-of-agents.git
cd the-binding-of-agents
./install.sh
```

## Disclaimer

This is a fan project. Not affiliated with Edmund McMillen, Nicalis, or any rights holder of The Binding of Isaac. See [DISCLAIMER.md](./DISCLAIMER.md) and [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

## License

Inherits the upstream pokegents license. See [LICENSE](./LICENSE).
```

- [ ] **Step 2: Commit**

```bash
cd ~/Projects/the-binding-of-agents
git add README.md
git commit -m "$(cat <<'EOF'
Rewrite README for the-binding-of-agents

Captures: what it does, install via pre-built binary, source build,
disclaimer pointers. Replaces upstream pokegents README.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

---

## Task 18: End-to-end smoke test

**Dependencies:** all preceding tasks.
**Parallelizable with:** none (final verification).

**Files:** none modified; this is verification.

- [ ] **Step 1: Clean install**

```bash
cd ~/Projects/the-binding-of-agents
rm -rf ~/.the-binding-of-agents
bash install.sh
```

Expected: the install script builds the Go binary, builds the frontend bundle, and creates `~/.the-binding-of-agents/` directories.

- [ ] **Step 2: Launch the binary**

```bash
cd ~/Projects/the-binding-of-agents
./boa.sh &
sleep 3
curl -sSI http://localhost:5199 | head -1
```

Expected: `HTTP/1.1 200 OK` from the dashboard server.

- [ ] **Step 3: Verify the UI loads**

Open http://localhost:5199 in a browser. Verify:
- [ ] Page loads without console errors
- [ ] Background is dark (basement palette, not Pokemon blue)
- [ ] Header text is in Upheaval (or falls back to Press Start 2P)
- [ ] Empty state shows TBOI flavor (no "Pokegents" string anywhere visible)

- [ ] **Step 4: Spawn a test agent**

In a separate terminal:
```bash
claude --resume-as-test  # or whatever pokegents' agent-spawn flow uses
```

Expected: a new card appears in the dashboard within ~10 seconds with:
- A character sprite (from the 84-entry pool)
- The character name displayed
- Status pill showing REST (initially)

- [ ] **Step 5: Verify every preserved feature**

For each row in the spec's preserved-functionality table, manually verify:
- [ ] Grid view shows agents
- [ ] Click an agent card -> iTerm2 focuses (or chat panel opens)
- [ ] Activity feed updates as the agent does work
- [ ] Status pill transitions REST -> FIGHT -> CLEAR
- [ ] BasementView shows the new basement-floor image
- [ ] The Bestiary modal opens and lists past agents
- [ ] CharacterPicker opens with "WHO AM I?" title

- [ ] **Step 6: Verify the GoReleaser snapshot build works locally**

```bash
cd ~/Projects/the-binding-of-agents
goreleaser release --snapshot --clean
ls dist/
```

Expected: archives for all configured platforms. Pick one and verify it extracts cleanly:
```bash
tar -tzf dist/boa_*-next_$(uname | tr '[:upper:]' '[:lower:]')_amd64.tar.gz | head
```

- [ ] **Step 7: Tag the v0.1.0-alpha release (optional)**

```bash
cd ~/Projects/the-binding-of-agents
git tag v0.1.0-alpha
git push origin v0.1.0-alpha
```

Expected: GitHub Actions runs `release.yml`; in 5-10 minutes a release appears on the Releases page with archives for every platform.

- [ ] **Step 8: Final commit (changelog entry only, if needed)**

If anything was tweaked during smoke test, commit it. Otherwise:
```bash
cd ~/Projects/the-binding-of-agents
git log --oneline | head -25
```

Expected: ~18 commits visible, one per task. The implementation is complete.

---

## Parallel Dispatch Playbook

For executors using `superpowers:subagent-driven-development` or running parallel agents directly, this graph captures the dependency structure:

```
Task 1 (bootstrap fork)
    |
    +--> Task 2 (DISCLAIMER + NOTICES) [parallel with 3]
    +--> Task 3 (package.json + go.mod) [parallel with 2]
              |
              +--> Task 4 (Go renames)       [parallel with 5, 6, 7]
              +--> Task 5 (TS renames)       [parallel with 4, 6, 7]
              +--> Task 6 (theme foundation) [parallel with 4, 5, 7]
              +--> Task 7 (sprite pipeline)  [parallel with 4, 5, 6]
                        |
                        +--> Task 8 (MAINTAINER: curate + slice 84 sprites)
                                  |
                                  +--> Task 9  (ISAAC_CHARACTERS) [parallel with 10-15]
                                  +--> Task 10 (rename components) [parallel with 9, 11-15]
                                  +--> Task 11 (copy strings)     [parallel with 9, 10, 12-15]
                                  +--> Task 12 (BasementView)     [parallel with 9, 10, 11, 13-15]
                                  +--> Task 13 (DoorAnimation)    [parallel with 9, 10, 11, 12, 14, 15]
                                  +--> Task 14 (CharacterPicker)  [parallel with 9, 10, 11, 12, 13, 15]
                                  +--> Task 15 (GameModal retheme)[parallel with 9-14]
                                            |
                                            +--> Task 16 (GoReleaser) [parallel with 17]
                                            +--> Task 17 (README)     [parallel with 16]
                                                      |
                                                      +--> Task 18 (smoke test, sequential)
```

**Dispatch waves (for parallel subagent runs):**

- **Wave 1:** Task 1 alone (sequential prerequisite).
- **Wave 2:** Tasks 2, 3 in parallel.
- **Wave 3:** Tasks 4, 5, 6, 7 in parallel (four concurrent subagents).
- **Wave 4:** Task 8 alone (maintainer-blocking; humans curate sprites).
- **Wave 5:** Tasks 9, 10, 11, 12, 13, 14, 15 in parallel (seven concurrent subagents).
- **Wave 6:** Tasks 16, 17 in parallel.
- **Wave 7:** Task 18 alone (final verification).

Between waves, the main loop reviews each subagent's diff before unblocking dependent tasks. This honors the user's "dispatch parallel agents and orchestrate results" preference while preserving correctness gates.
