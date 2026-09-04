import { h } from 'hastscript';
import { SKIP, visit } from 'unist-util-visit';
import type { Element, ElementContent, Root } from 'hast';
import type { VFile } from 'vfile';
import { MAX_DISPLAY_WIDTH } from '$lib/images';
import { buildPicture, resolveLocalImage } from './images';
import script from '$lib/image-compare/image-compare.js?raw';

const isImg = (node: ElementContent): node is Element =>
  node.type === 'element' && node.tagName === 'img';

/**
 * Rewrites `<image-compare value="40"><img …/><img …/></image-compare>` into a draggable split view
 * of the two images. Blog pages aren't hydrated, so the handler script is inlined once per document
 * instead of going through SvelteKit's client bundle.
 */
export const rehypeImageCompare = () => (tree: Root, file: VFile) => {
  let used = false;
  visit(tree, 'element', (node, index, parent) => {
    if (node.tagName !== 'image-compare' || !parent || index === undefined) {
      return;
    }
    const imgs = node.children.filter(isImg);
    if (imgs.length !== 2) {
      console.warn(`${file.basename}: <image-compare> needs exactly two <img> children`);
      return;
    }

    const entries = imgs.map((img) => resolveLocalImage(String(img.properties.src ?? ''), file));
    const layers = imgs.map((img, i) => {
      const entry = entries[i];
      return entry ? buildPicture(entry, String(img.properties.alt ?? '')) : img;
    });
    const maxWidth = Math.min(MAX_DISPLAY_WIDTH, ...entries.map((e) => e?.width ?? Infinity));
    const pos = Number(node.properties.value ?? 50);

    parent.children[index] = h(
      'div.image-compare',
      { style: `--pos: ${pos}%; max-width: ${maxWidth}px` },
      [
        ...layers,
        h('div.image-compare-handle', {
          role: 'slider',
          tabIndex: 0,
          ariaLabel: 'Image comparison slider',
          ariaValueMin: 0,
          ariaValueMax: 100,
          ariaValueNow: pos,
        }),
      ]
    );
    used = true;
    return SKIP;
  });

  if (used) {
    tree.children.push(h('script', { type: 'module' }, script));
  }
};
