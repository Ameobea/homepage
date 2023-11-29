+++
title = "Fixing Svelte Seo `Cannot find module './transformers/\"application/ld+json\">${'`"
date = "2023-11-28T23:25:56-08:00"
+++

## The Problem

After upgrading `svelte-seo` to the latest version (1.5.4 at the time of writing this), I encountered this error when trying to run my SvelteKit dev server:

```txt
Error while preprocessing /home/casey/dream/node_modules/svelte-seo/index.svelte - Cannot find module './transformers/"application/ld+json">${'
Require stack:
- /home/casey/dream/node_modules/svelte-preprocess/dist/autoProcess.js
- /home/casey/dream/node_modules/svelte-preprocess/dist/index.js
Error while preprocessing /home/casey/dream/node_modules/svelte-seo/index.svelte - Cannot find module './transformers/"application/ld+json">${'
Require stack:
- /home/casey/dream/node_modules/svelte-preprocess/dist/autoProcess.js
- /home/casey/dream/node_modules/svelte-preprocess/dist/index.js
```

## The Fix

**The issue turned out to be that my `svelte` version was too old.**

I upgraded `svelte` to the latest version (`svelte  ^3.50.1  →  ^4.2.7`), re-started the dev server, and the issue went away.
