import fs from 'node:fs';
import path from 'node:path';
import { h } from 'hastscript';
import { SKIP, visit } from 'unist-util-visit';
import type { Element, Properties, Root } from 'hast';
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

/**
 * Manifest entry for an `src` written relative to the markdown file; null for remote/absolute URLs
 * and (with a warning) for local paths the image build didn't produce.
 */
export const resolveLocalImage = (src: string, file: VFile): ImageEntry | null => {
  const decoded = decodeURIComponent(src);
  if (!decoded || !isLocalSrc(decoded)) {
    return null;
  }
  const key = path.relative(REPO_ROOT, path.resolve(path.dirname(file.path), decoded));
  const entry = loadManifest()[key];
  if (!entry) {
    console.warn(`${file.basename}: image not in manifest, leaving as-is: ${key}`);
    return null;
  }
  return entry;
};

const imgAttrs = (entry: ImageEntry, alt: string) => ({
  alt,
  width: entry.width,
  height: entry.height,
  loading: 'lazy',
  decoding: 'async',
});

/** Responsive `<picture>` for a manifest entry, or a bare `<img>` for formats that are only copied. */
export const buildPicture = (entry: ImageEntry, alt: string, props: Properties = {}): Element => {
  if (entry.widths.length === 0) {
    return h('img', { src: originalUrl(entry), ...imgAttrs(entry, alt), ...props });
  }
  const sizes = sizesFor(MAX_DISPLAY_WIDTH);
  return h('picture', props, [
    h('source', { type: 'image/avif', srcSet: srcset(entry, 'avif'), sizes }),
    h('img', {
      src: fallbackSrc(entry, MAX_DISPLAY_WIDTH),
      srcSet: srcset(entry, 'webp'),
      sizes,
      ...imgAttrs(entry, alt),
    }),
  ]);
};

export const buildImage = (entry: ImageEntry, alt: string): Element => {
  if (entry.widths.length === 0) {
    return buildPicture(entry, alt, { className: ['post-img'] });
  }
  const displayWidth = Math.min(entry.width, MAX_DISPLAY_WIDTH);
  return h('a.post-img-link', { href: originalUrl(entry), target: '_blank', rel: 'noopener' }, [
    buildPicture(entry, alt, { className: ['post-img'], style: `max-width: ${displayWidth}px` }),
  ]);
};

/**
 * Replaces `<img>` elements whose `src` is a path relative to the markdown file with responsive
 * `<picture>` markup pointing at the variants produced by `scripts/build-images.ts`.
 */
export const rehypeLocalImages = () => (tree: Root, file: VFile) => {
  visit(tree, 'element', (node, index, parent) => {
    if (node.tagName !== 'img' || !parent || index === undefined) {
      return;
    }
    const entry = resolveLocalImage(String(node.properties.src ?? ''), file);
    if (!entry) {
      return;
    }
    const alt = String(node.properties.alt || entry.name.replace(/[-_]+/g, ' '));
    parent.children[index] = buildImage(entry, alt);
    return SKIP;
  });
};
