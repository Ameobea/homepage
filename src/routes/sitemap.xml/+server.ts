import { listPosts } from '$lib/server/posts';

export const prerender = true;

const SITE_URL = 'https://cprimozic.net';
const EXCLUDED = new Set(['/404/']);

const pageRoutes = Object.keys(import.meta.glob('/src/routes/**/+page.svelte'))
  .map((file) => file.replace(/^\/src\/routes/, '').replace(/\+page\.svelte$/, ''))
  .filter((route) => !route.includes('[') && !EXCLUDED.has(route));

export const GET = () => {
  const urls = [...pageRoutes, ...listPosts().map((p) => `/blog/${p.slug}/`)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `<url><loc>${SITE_URL}${url}</loc></url>`).join('\n')}
</urlset>`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
