import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeKatex from 'rehype-katex';
import rehypeShiki from '@shikijs/rehype';
import rehypeStringify from 'rehype-stringify';
import { toc } from 'mdast-util-toc';
import { toHast } from 'mdast-util-to-hast';
import { toHtml } from 'hast-util-to-html';
import { toString as hastToString } from 'hast-util-to-string';
import { h, s } from 'hastscript';
import { SKIP, visit } from 'unist-util-visit';
import { VFile } from 'vfile';
import type { Element, Root as HastRoot } from 'hast';
import type { BundledLanguage } from 'shiki';
import { rehypeLocalImages } from './images';
import { rehypeImageCompare } from './imageCompare';

const EXCERPT_LENGTH = 400;

const SHIKI_LANGS: BundledLanguage[] = [
  'rust',
  'typescript',
  'javascript',
  'bash',
  'python',
  'glsl',
  'sql',
  'diff',
  'cpp',
  'yaml',
  'wasm',
  'toml',
  'asm',
  'ruby',
  'css',
  'html',
  'json',
];

const headerLinkIcon = () =>
  s(
    'svg',
    {
      ariaHidden: 'true',
      height: 20,
      version: '1.1',
      viewBox: '0 0 16 16',
      width: 20,
      style: 'stroke: rgb(220, 220, 220);',
    },
    [
      s('path', {
        fillRule: 'evenodd',
        d: 'M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z',
      }),
    ]
  );

const rehypeStripComments = () => (tree: HastRoot) => {
  visit(tree, 'comment', (_node, index, parent) => {
    if (parent && index !== undefined) {
      parent.children.splice(index, 1);
      return index;
    }
  });
};

/** Rewrites the custom elements used in a few posts into plain HTML. */
const rehypeCustomElements = () => (tree: HastRoot) => {
  visit(tree, 'element', (node, index, parent) => {
    if (node.tagName !== 'collapsible-nn-viz' || !parent || index === undefined) {
      return;
    }

    const preset = node.properties.preset;
    const src = `https://nn.ameo.dev/?constrainedLayout=1${preset ? `&preset=${preset}` : ''}`;
    parent.children[index] = h(
      'details.nn-viz',
      { open: node.properties.defaultexpanded === 'true' },
      [
        h('summary', 'Click to open demo'),
        h('iframe', { src, loading: 'lazy', title: 'Neural network visualization demo' }),
      ]
    );
    return SKIP;
  });
};

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype, { allowDangerousHtml: true })
  // KaTeX runs before raw HTML is expanded so it only sees remark-math output, not pre-rendered
  // KaTeX markup that some posts embed directly
  .use(rehypeKatex, { strict: 'ignore', fleqn: true })
  .use(rehypeRaw)
  .use(rehypeStripComments)
  .use(rehypeSlug)
  .use(rehypeAutolinkHeadings, {
    behavior: 'prepend',
    properties: (el: Element) => ({
      className: ['anchor', 'before'],
      ariaLabel: `${hastToString(el)} permalink`,
    }),
    content: () => headerLinkIcon(),
  })
  .use(rehypeImageCompare)
  .use(rehypeLocalImages)
  .use(rehypeCustomElements)
  .use(rehypeShiki, {
    theme: 'laserwave',
    langs: SHIKI_LANGS,
    langAlias: { nasm: 'asm' },
    fallbackLanguage: 'text',
  })
  .use(rehypeStringify);

const excerpt = (tree: HastRoot): string => {
  let text = '';
  visit(tree, 'element', (node) => {
    if (node.tagName === 'p' && text.length < EXCERPT_LENGTH) {
      text += `${hastToString(node)} `;
    }
  });
  text = text.trim();
  if (text.length <= EXCERPT_LENGTH) {
    return text;
  }
  const cut = text.slice(0, EXCERPT_LENGTH);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
};

export interface RenderedMarkdown {
  html: string;
  toc: string;
  excerpt: string;
}

export const renderMarkdown = async (
  markdown: string,
  filePath: string
): Promise<RenderedMarkdown> => {
  const file = new VFile({ path: filePath, value: markdown });
  const mdast = processor.parse(file);
  const tocList = toc(mdast, { tight: true }).map;
  const hast = await processor.run(mdast, file);
  return {
    html: processor.stringify(hast, file),
    toc: tocList ? toHtml(toHast(tocList)) : '',
    excerpt: excerpt(hast),
  };
};
