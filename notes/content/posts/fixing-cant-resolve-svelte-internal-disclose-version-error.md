+++
title = "Fixing \"can't resolve 'svelte/internal'\" Error After Upgrading `svelte`"
date = "2023-08-24T17:00:08-07:00"
+++

I bumped several of the dependencies for one of my projects.  It uses Svelte and Webpack, and makes use of `svelte-loader` to facilitate importing `.svelte` files.

I upgraded Svelte from v3.57.0 to v4.2.0, and bumped `svelte-loader`, `svelte-preprocess`, `prettier-plugin-svelte`, and many other libraries to their latest versions as well.

After the upgrade, my Webpack dev server started up but failed to load with many errors like these displayed in the console:

```txt
ERROR in ./src/welcomePage/DemoTile.svelte 2:0-28:25
Module not found: Error: Can't resolve 'svelte/internal' in '/home/casey/web-synth/src/welcomePage'
 @ ./src/welcomePage/WelcomePage.svelte 27:0-55 118:17-25 132:17-25 146:17-25 160:17-25 495:34-42
 @ ./src/welcomePage/WelcomePage.ts 3:0-49 14:10-23
 @ ./src/engine_bg.js 17:0-124 639:2-19 643:2-22 647:2-19 651:2-21
 @ ./src/engine.js 2:0-31 2:0-31
 @ ./src/index.tsx 14:13-31

ERROR in ./src/welcomePage/DemoTile.svelte 30:0-42
Module not found: Error: Can't resolve 'svelte/internal/disclose-version' in '/home/casey/web-synth/src/welcomePage'
 @ ./src/welcomePage/WelcomePage.svelte 27:0-55 118:17-25 132:17-25 146:17-25 160:17-25 495:34-42
 @ ./src/welcomePage/WelcomePage.ts 3:0-49 14:10-23
 @ ./src/engine_bg.js 17:0-124 639:2-19 643:2-22 647:2-19 651:2-21
 @ ./src/engine.js 2:0-31 2:0-31
 @ ./src/index.tsx 14:13-31

ERROR in ./src/welcomePage/WelcomePage.svelte 2:0-24:25
Module not found: Error: Can't resolve 'svelte/internal' in '/home/casey/web-synth/src/welcomePage'
 @ ./src/welcomePage/WelcomePage.ts 3:0-49 14:10-23
 @ ./src/engine_bg.js 17:0-124 639:2-19 643:2-22 647:2-19 651:2-21
 @ ./src/engine.js 2:0-31 2:0-31
 @ ./src/index.tsx 14:13-31

ERROR in ./src/welcomePage/WelcomePage.svelte 26:0-42
Module not found: Error: Can't resolve 'svelte/internal/disclose-version' in '/home/casey/web-synth/src/welcomePage'
 @ ./src/welcomePage/WelcomePage.ts 3:0-49 14:10-23
 @ ./src/engine_bg.js 17:0-124 639:2-19 643:2-22 647:2-19 651:2-21
 @ ./src/engine.js 2:0-31 2:0-31
 @ ./src/index.tsx 14:13-31
```

## The Fix

I found the fix in a [Github issue thread](https://github.com/sveltejs/svelte-loader/issues/234#issuecomment-1607058996) after extensive searching.

In my Webpack config file `webpack.config.js`, I had this code:

```js
    alias: {
      svelte: path.dirname(require.resolve('svelte/package.json')),
    },
```

I don't remember why I put it there originally; probably copy-pasted from a README of template.

> In any case, this code is broken after updating from Svelte 3->4 when using Webpack and needs to be updated.

Here was the diff I applied:

```diff
diff --git b/webpack.base.js a/webpack.base.js
index e73c6d2..da52655 100644
--- b/webpack.base.js
+++ a/webpack.base.js
@@ -74,7 +74,7 @@ const config = {
     extensions: ['.ts', '.tsx', '.js', '.jsx', '.wasm', '.svelte', '.mjs'],
     modules: [path.resolve('./node_modules'), path.resolve('.')],
     alias: {
-      svelte: path.dirname(require.resolve('svelte/package.json')),
+      svelte: path.resolve('node_modules', 'svelte/src/runtime'),
     },
     conditionNames: ['require', 'node', 'svelte'],
   },
```

After re-starting the webpack dev server, everything works just fine!
