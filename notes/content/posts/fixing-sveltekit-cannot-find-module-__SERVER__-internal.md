+++
title = "Fixing Sveltekit Failed to Load URL __SERVER__/internal.js"
date = "2024-04-30T12:36:56-08:00"
+++

I was working on a new SvelteKit project with Svelte 5 recently, and I kept getting an error that prevented anything from loading in the browser:

```txt
[vite] Pre-transform error: Failed to load url __SERVER__/internal.js (resolved id: /Users/casey/osu-embeddings/frontend/.svelte-kit/generated/server/internal.js) in /Users/casey/osu-embeddings/frontend/node_modules/@sveltejs/kit/src/runtime/server/index.js. Does the file exist?
[vite] Error when evaluating SSR module /node_modules/@sveltejs/kit/src/runtime/server/index.js: failed to import "__SERVER__/internal.js"
|- Error: Cannot find module '__SERVER__/internal.js' imported from '/Users/casey/osu-embeddings/frontend/node_modules/@sveltejs/kit/src/runtime/server/index.js'
    at nodeImport (file:///Users/casey/osu-embeddings/frontend/node_modules/vite/dist/node/chunks/dep-DkOS1hkm.js:55067:25)
    at ssrImport (file:///Users/casey/osu-embeddings/frontend/node_modules/vite/dist/node/chunks/dep-DkOS1hkm.js:54976:30)
    at eval (/Users/casey/osu-embeddings/frontend/node_modules/@sveltejs/kit/src/runtime/server/index.js:5:37)
    at async instantiateModule (file:///Users/casey/osu-embeddings/frontend/node_modules/vite/dist/node/chunks/dep-DkOS1hkm.js:55036:9)
```

## The Cause

It turns out that I had a broken symlink in my `static/` directory. I had cloned the project down to a new computer, and the file only existed on the old one.

## The Fix

I created a file at the location pointed to by the broken symlink which made it valid. Then, when I re-started the server, things worked.

It's possible that this was a fluke and some other thing happened which caused this error, but if you're seeing it and have symlinks in your project, it might be worth looking into that.
