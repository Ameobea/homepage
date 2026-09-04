import { assets } from '$app/paths';

export interface ImageEntry {
  hash: string;
  name: string;
  ext: string;
  width: number;
  height: number;
  widths: number[];
}

export const MAX_DISPLAY_WIDTH = 840;

export const variantUrl = (entry: ImageEntry, suffix: string) =>
  `${assets}/img/${entry.hash}/${entry.name}${suffix}`;

export const originalUrl = (entry: ImageEntry) => variantUrl(entry, entry.ext);

export const srcset = (entry: ImageEntry, fmt: string) =>
  entry.widths.map((w) => `${variantUrl(entry, `-${w}.${fmt}`)} ${w}w`).join(', ');

export const fallbackSrc = (entry: ImageEntry, targetWidth: number) =>
  variantUrl(entry, `-${entry.widths.find((w) => w >= targetWidth) ?? entry.widths.at(-1)}.webp`);

export const sizesFor = (maxWidth: number) => `(max-width: ${maxWidth}px) 100vw, ${maxWidth}px`;
