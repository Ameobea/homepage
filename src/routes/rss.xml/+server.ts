import { getPost, listFeedEntries } from '$lib/server/posts';

export const prerender = true;

const SITE_URL = 'https://cprimozic.net';

const escapeXml = (s: string) =>
  s.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);

export const GET = async () => {
  const entries = await Promise.all(
    listFeedEntries().map(async (entry) => {
      if (entry.external) {
        return entry;
      }
      const slug = entry.url.split('/').filter(Boolean).at(-1)!;
      return { ...entry, description: (await getPost(slug))!.excerpt };
    })
  );

  const items = entries
    .map(({ title, date, url, description }) => {
      const link = `${SITE_URL}${url}`;
      const desc = description ? `<description>${escapeXml(description)}</description>` : '';
      return `<item><title>${escapeXml(title)}</title><link>${link}</link><guid>${link}</guid><pubDate>${new Date(date).toUTCString()}</pubDate>${desc}</item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>cprimozic.net Blog</title>
<link>${SITE_URL}</link>
<description>Personal website of Casey Primozic / ameo</description>
${items}
</channel>
</rss>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml' } });
};
