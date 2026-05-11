#!/usr/bin/env tsx
// Reads sprite-sources/manifest.json, downloads each entry's source_url, resizes
// to target size with nearest-neighbor, and writes the result PNG to output_dir.
//
// Idempotent: skip if output PNG already exists.
//
// Usage (from dashboard/web/):
//   npm run fetch-sprites
//
// Output PNGs are committed to the repo. Manifest is committed; sprite-sources/cache/ is gitignored.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

interface ManifestEntry {
  slug: string;
  name: string;
  kind: 'character' | 'tainted' | 'familiar';
  source_url: string;
  wiki_page: string;
  license_note: string;
}

interface Manifest {
  version: number;
  target_size: [number, number];
  interpolation: 'nearest';
  output_dir: string;
  entries: ManifestEntry[];
}

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, { headers: { 'User-Agent': 'the-binding-of-agents/0.1 (sprite fetch)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

async function main() {
  const manifestPath = path.join(REPO_ROOT, 'sprite-sources/manifest.json');
  const cacheDir = path.join(REPO_ROOT, 'sprite-sources/cache');
  await fs.mkdir(cacheDir, { recursive: true });

  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8')) as Manifest;
  const outDir = path.join(REPO_ROOT, manifest.output_dir);
  await fs.mkdir(outDir, { recursive: true });

  const [targetW, targetH] = manifest.target_size;

  let ok = 0, failed = 0, skipped = 0;
  for (const entry of manifest.entries) {
    const outPath = path.join(outDir, `${entry.slug}.png`);
    try {
      // Skip if output already exists (idempotent)
      try { await fs.stat(outPath); skipped++; console.log(`skip ${entry.slug} (already exists)`); continue; } catch {}

      const cachePath = path.join(cacheDir, `${entry.slug}.png`);
      let buf: Buffer;
      try {
        buf = await fs.readFile(cachePath);
      } catch {
        buf = await fetchBuffer(entry.source_url);
        await fs.writeFile(cachePath, buf);
      }

      await sharp(buf)
        .resize(targetW, targetH, { kernel: sharp.kernel.nearest, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(outPath);
      console.log(`ok   ${entry.slug}`);
      ok++;
    } catch (err) {
      console.error(`FAIL ${entry.slug}: ${err instanceof Error ? err.message : String(err)}`);
      failed++;
    }
  }
  console.log(`\nDone. ${ok} ok, ${skipped} skipped, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main();
