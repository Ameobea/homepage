import fs from 'node:fs';
import path from 'node:path';
import { h } from 'hastscript';
import { SKIP, visit } from 'unist-util-visit';
import type { Element, Root } from 'hast';
import type { VFile } from 'vfile';
import { IMAGE_MANIFEST, REPO_ROOT } from './paths';
import {
  MAX_DISPLAY_WIDTH,
  fallbackSrc,
  originalUrl,
  sizesFor,
  srcset,
  type ImageEntry,
} from '$lib/images';

let manifest: Record<string, ImageEntry> | null = null;

const loadManifest = () => {
  if (!manifest) {
    if (!fs.existsSync(IMAGE_MANIFEST)) {
      throw new Error(`${IMAGE_MANIFEST} not found; run \`bun run images\` first`);
    }
    manifest = JSON.parse(fs.readFileSync(IMAGE_MANIFEST, 'utf8'));
  }
  return manifest!;
};

/** Looks up an image by its path relative to the repo root, e.g. `content/images/face.jpg`. */
export const getImageEntry = (key: string): ImageEntry => {
  const entry = loadManifest()[key];
  if (!entry) {
    throw new Error(`image not in manifest: ${key}`);
  }
  return entry;
};

/** All images under a repo-relative directory prefix, keyed by the remainder of their path. */
export const imagesUnder = (prefix: string): Record<string, ImageEntry> =>
  Object.fromEntries(
    Object.entries(loadManifest())
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, entry]) => [key.slice(prefix.length), entry])
  );

const isLocalSrc = (src: string) =>
  !/^([a-z][a-z0-9+.-]*:)?\/\//i.test(src) && !src.startsWith('/') && !src.startsWith('data:');

export const buildImage = (entry: ImageEntry, alt: string): Element => {
  const original = originalUrl(entry);
  const common = {
    alt,
    width: entry.width,
    height: entry.height,
    loading: 'lazy',
    decoding: 'async',
  };
  if (entry.widths.length === 0) {
    return h('img.post-img', { src: original, ...common });
  }

  const displayWidth = Math.min(entry.width, MAX_DISPLAY_WIDTH);
  const sizes = sizesFor(MAX_DISPLAY_WIDTH);
  return h('a.post-img-link', { href: original, target: '_blank', rel: 'noopener' }, [
    h('picture.post-img', { style: `max-width: ${displayWidth}px` }, [
      h('source', { type: 'image/avif', srcSet: srcset(entry, 'avif'), sizes }),
      h('img', {
        src: fallbackSrc(entry, MAX_DISPLAY_WIDTH),
        srcSet: srcset(entry, 'webp'),
        sizes,
        ...common,
      }),
    ]),
  ]);
};

/**
 * Replaces `<img>` elements whose `src` is a path relative to the markdown file with responsive
 * `<picture>` markup pointing at the variants produced by `scripts/build-images.ts`.
 */
export const rehypeLocalImages = () => (tree: Root, file: VFile) => {
  const entries = loadManifest();
  visit(tree, 'element', (node, index, parent) => {
    if (node.tagName !== 'img' || !parent || index === undefined) {
      return;
    }
    const src = decodeURIComponent(String(node.properties.src ?? ''));
    if (!src || !isLocalSrc(src)) {
      return;
    }

    const key = path.relative(REPO_ROOT, path.resolve(path.dirname(file.path), src));
    const entry = entries[key];
    if (!entry) {
      console.warn(`${path.basename(file.path)}: image not in manifest, leaving as-is: ${key}`);
      return;
    }
    const alt = String(node.properties.alt || entry.name.replace(/[-_]+/g, ' '));
    parent.children[index] = buildImage(entry, alt);
    return SKIP;
  });
};
