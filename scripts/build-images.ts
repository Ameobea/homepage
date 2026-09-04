import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const REPO_ROOT = ROOT;
const SOURCE_DIRS = ['content/blog/images', 'content/images'];
const OUT_DIR = path.join(ROOT, 'static/img');
const MANIFEST_PATH = path.join(ROOT, '.image-manifest.json');

const CONFIG = {
  widths: [420, 840, 1260, 1680],
  avif: { quality: 60 },
  webp: { quality: 86 },
};
// Output dirs are keyed on source bytes + this fingerprint, so a config change regenerates everything
const CONFIG_FINGERPRINT = createHash('sha1').update(JSON.stringify(CONFIG)).digest('hex');

const RESIZABLE = new Set(['.png', '.jpg', '.jpeg']);
const COPY_ONLY = new Set(['.svg', '.gif', '.webp']);
const CONCURRENCY = 4;

interface Entry {
  hash: string;
  name: string;
  ext: string;
  width: number;
  height: number;
  widths: number[];
}

async function* walk(dir: string): AsyncGenerator<string> {
  for (const dirent of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* walk(p);
    } else {
      const ext = path.extname(dirent.name).toLowerCase();
      if (RESIZABLE.has(ext) || COPY_ONLY.has(ext)) {
        yield p;
      }
    }
  }
}

const variantWidths = (srcWidth: number) => [
  ...new Set([...CONFIG.widths.filter((w) => w < srcWidth), Math.min(srcWidth, CONFIG.widths.at(-1)!)]),
];

const describe = async (file: string): Promise<{ key: string; entry: Entry; buf: Buffer }> => {
  const buf = await fs.readFile(file);
  const hash = createHash('sha1').update(CONFIG_FINGERPRINT).update(buf).digest('hex').slice(0, 12);
  const ext = path.extname(file).toLowerCase();
  const { width = 0, height = 0 } = await sharp(buf).metadata();
  const entry: Entry = {
    hash,
    name: path.basename(file, path.extname(file)),
    ext,
    width,
    height,
    widths: RESIZABLE.has(ext) ? variantWidths(width) : [],
  };
  return { key: path.relative(REPO_ROOT, file), entry, buf };
};

const writeAtomic = async (out: string, write: (tmp: string) => Promise<unknown>) => {
  const tmp = `${out}.tmp`;
  await write(tmp);
  await fs.rename(tmp, out);
};

const encode = async ({ entry, buf }: { entry: Entry; buf: Buffer }): Promise<number> => {
  const dir = path.join(OUT_DIR, entry.hash);
  await fs.mkdir(dir, { recursive: true });
  let produced = 0;

  const original = path.join(dir, `${entry.name}${entry.ext}`);
  if (!existsSync(original)) {
    await writeAtomic(original, (tmp) => fs.writeFile(tmp, buf));
    produced += 1;
  }

  for (const width of entry.widths) {
    for (const fmt of ['avif', 'webp'] as const) {
      const out = path.join(dir, `${entry.name}-${width}.${fmt}`);
      if (existsSync(out)) {
        continue;
      }
      const resized = sharp(buf).resize({ width, withoutEnlargement: true });
      const encoded = fmt === 'avif' ? resized.avif(CONFIG.avif) : resized.webp(CONFIG.webp);
      await writeAtomic(out, (tmp) => encoded.toFile(tmp));
      produced += 1;
    }
  }
  return produced;
};

const pool = async <T>(items: T[], fn: (item: T) => Promise<void>) => {
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < items.length) {
        await fn(items[next++]);
      }
    })
  );
};

const main = async () => {
  const start = performance.now();
  const files: string[] = [];
  for (const dir of SOURCE_DIRS) {
    for await (const file of walk(path.join(REPO_ROOT, dir))) {
      files.push(file);
    }
  }

  const described = await Promise.all(files.map(describe));
  described.sort((a, b) => a.key.localeCompare(b.key));
  const manifest = Object.fromEntries(described.map(({ key, entry }) => [key, entry]));
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  let produced = 0;
  await pool(described, async (item) => {
    const n = await encode(item);
    if (n > 0) {
      produced += n;
      console.log(`  ${item.key}: ${n} files`);
    }
  });

  await fs.mkdir(OUT_DIR, { recursive: true });
  const live = new Set(described.map(({ entry }) => entry.hash));
  let pruned = 0;
  for (const dir of await fs.readdir(OUT_DIR)) {
    if (!live.has(dir)) {
      await fs.rm(path.join(OUT_DIR, dir), { recursive: true });
      pruned += 1;
    }
  }

  const secs = ((performance.now() - start) / 1000).toFixed(1);
  console.log(
    `${files.length} source images; ${produced} files written, ${pruned} stale dirs pruned (${secs}s)`
  );
};

await main();
