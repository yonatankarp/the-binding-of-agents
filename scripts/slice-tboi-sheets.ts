#!/usr/bin/env tsx
// Reads sprite-sources/manifest.json, slices each entry's bbox from its source sheet,
// scales to target size with nearest-neighbor, and writes the result PNG to output_dir.
//
// Usage:
//   cd ~/Projects/the-binding-of-agents/dashboard/web
//   NODE_PATH="$(pwd)/node_modules" ./node_modules/.bin/tsx ../../scripts/slice-tboi-sheets.ts
//
// NODE_PATH is required because this script lives at the repo root but its
// dependencies (sharp, tsx) are installed inside dashboard/web. Node resolves
// modules relative to the script's directory by default; NODE_PATH overrides
// that so the dashboard/web/node_modules tree is found.
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
  interpolation: 'nearest';
  output_dir: string;
  entries: ManifestEntry[];
}

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

async function main() {
  const manifestPath = path.join(REPO_ROOT, 'sprite-sources/manifest.json');
  const sheetsDir = path.join(REPO_ROOT, 'sprite-sources/sheets');

  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8')) as Manifest;
  const outDir = path.join(REPO_ROOT, manifest.output_dir);
  await fs.mkdir(outDir, { recursive: true });

  const [targetW, targetH] = manifest.target_size;
  const kernel = sharp.kernel.nearest;

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
