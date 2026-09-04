import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { NOTES_MANIFEST, POSTS_DIR } from './paths';
import { renderMarkdown } from './markdown';

export interface Frontmatter {
  title: string;
  date: string;
  opengraph?: string;
  description?: string;
  imageUrl?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
}

export interface PostSummary {
  slug: string;
  title: string;
  date: string;
}

export interface Post extends PostSummary {
  frontmatter: Frontmatter;
  html: string;
  toc: string;
  excerpt: string;
}

export interface FeedEntry {
  title: string;
  date: string;
  url: string;
  external: boolean;
  description?: string;
}

export interface HeadMeta {
  description?: string;
  image: string | null;
  meta: { name: string; content: string }[];
}

const isoDate = (d: unknown): string => (d instanceof Date ? d.toISOString() : String(d));

// Hugo emits "2026-01-10 19:32:45 -0600 CST"; strip the zone name and make it ISO 8601
const noteDate = (d: string) => d.replace(' ', 'T').replace(/ ([+-]\d{2})(\d{2}).*$/, '$1:$2');

const byDateDesc = (a: { date: string }, b: { date: string }) =>
  Date.parse(b.date) - Date.parse(a.date);

const postPath = (slug: string) => path.join(POSTS_DIR, `${slug}.md`);

const postSlugs = () =>
  fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.slice(0, -3));

const readPost = (slug: string) => {
  const { data, content } = matter(fs.readFileSync(postPath(slug), 'utf8'));
  const frontmatter = { ...data, date: isoDate(data.date) } as Frontmatter;
  return { frontmatter, content };
};

export const listPosts = (): PostSummary[] =>
  postSlugs()
    .map((slug) => {
      const { frontmatter } = readPost(slug);
      return { slug, title: frontmatter.title, date: frontmatter.date };
    })
    .sort(byDateDesc);

export const listNotePosts = (): FeedEntry[] =>
  (JSON.parse(fs.readFileSync(NOTES_MANIFEST, 'utf8')) as {
    title: string;
    slug: string;
    date: string;
  }[]).map((n) => ({
    title: n.title,
    date: noteDate(n.date),
    url: `/notes/posts/${n.slug}/`,
    external: true,
  }));

export const listFeedEntries = (): FeedEntry[] =>
  [
    ...listPosts().map((p) => ({
      title: p.title,
      date: p.date,
      url: `/blog/${p.slug}/`,
      external: false,
    })),
    ...listNotePosts(),
  ].sort(byDateDesc);

const cache = new Map<string, Promise<Post>>();

export const getPost = (slug: string): Promise<Post> | null => {
  if (!postSlugs().includes(slug)) {
    return null;
  }

  const key = `${slug}:${fs.statSync(postPath(slug)).mtimeMs}`;
  let post = cache.get(key);
  if (!post) {
    post = (async () => {
      const { frontmatter, content } = readPost(slug);
      const rendered = await renderMarkdown(content, postPath(slug));
      return { slug, title: frontmatter.title, date: frontmatter.date, frontmatter, ...rendered };
    })();
    cache.set(key, post);
  }
  return post;
};

export const postHead = (fm: Frontmatter): HeadMeta => {
  if (fm.opengraph) {
    const og = JSON.parse(fm.opengraph);
    return { description: og.description, image: og.image ?? null, meta: og.meta ?? [] };
  }

  const meta = [{ name: 'article:published_time', content: fm.date }];
  const push = (name: string, value: unknown) => {
    if (value != null) {
      meta.push({ name, content: String(value) });
    }
  };
  push('og:image', fm.imageUrl);
  push('og:image:alt', fm.imageAlt);
  push('og:image:width', fm.imageWidth);
  push('og:image:height', fm.imageHeight);
  return { description: fm.description, image: null, meta };
};
