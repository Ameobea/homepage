import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: preprocess(),

  kit: {
    inlineStyleThreshold: 2048,
    adapter: adapter({ precompress: true }),
    prerender: {
      concurrency: 6,
    },
  },
  vitePlugin: {
    experimental: {
      inspector: {
        holdMode: true,
      },
      prebundleSvelteLibraries: true,
    },
  },
};

export default config;
