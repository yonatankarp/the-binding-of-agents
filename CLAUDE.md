# the-binding-of-agents

This is a hard fork of [pokegents](https://github.com/tRidha/pokegents), rethemed with The Binding of Isaac aesthetic. The Go backend is preserved verbatim except for identifier renames; all visual work is in the React/TS frontend and the theme registry.

## Authoritative documents

- **Spec:** `docs/superpowers/specs/2026-05-11-the-binding-of-agents-design.md`
- **Plan:** `docs/superpowers/plans/2026-05-11-the-binding-of-agents-implementation.md`
- **Fan-project framing:** `DISCLAIMER.md`
- **Attribution:** `THIRD_PARTY_NOTICES.md`

## Working pattern

- This project is in active build-out per the implementation plan.
- Identifiers: this repo renames `Pokegent` -> `Run`, storage `~/.pokegents/` -> `~/.the-binding-of-agents/`, routes `/api/pokegents/*` -> `/api/runs/*`.
- Theme system uses the upstream `themeRegistry`; the active theme is `tboi-basement`.
- All ~84 sprite assets live committed under `dashboard/web/public/sprites/`.

For backend behavior questions, consult the upstream pokegents codebase as a working reference - the Go modules in `dashboard/server/` operate identically to upstream after the rename pass.
