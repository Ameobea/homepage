import fs from 'node:fs';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ out: 'build' }),
    paths: { assets: process.env.ASSET_PREFIX ?? '', relative: false },
    prerender: {
      concurrency: 6,
      handleHttpError: ({ path, message }) => {
        // The crawler doesn't resolve directory URLs to static/<path>/index.html (the Hugo notes site
        // synced into static/notes); /blog/<slug>/images/ is a post referencing an image that doesn't
        // exist on disk (already warned about by the markdown pipeline)
        if (
          fs.existsSync(`static${path.replace(/\/?$/, '/')}index.html`) ||
          /^\/blog\/[^/]+\/images\//.test(path)
        ) {
          return;
        }
        throw new Error(message);
      },
    },
  },
};
