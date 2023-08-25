+++
title = "Fixing \"performance is not defined\" Issue with Svelte/SvelteKit"
date = "2023-08-25T00:32:30-07:00"
+++

## The Issue

When building my SvelteKit project, I get lots of errors like this in my console:

```txt
ERROR in ./src/graphEditor/nodes/CustomAudio/MIDIToFrequency/MIDIToFrequencySmallView.svelte
Module build failed (from ./node_modules/svelte-loader/index.js):
ReferenceError: performance is not defined
    at now (/home/casey/web-synth/node_modules/svelte/compiler.cjs:7:31)
    at new Stats (/home/casey/web-synth/node_modules/svelte/compiler.cjs:47:21)
    at compile (/home/casey/web-synth/node_modules/svelte/compiler.cjs:45535:16)
    at injectVarsToCode (/home/casey/web-synth/node_modules/svelte-preprocess/dist/transformers/typescript.js:85:45)
    at mixedImportsTranspiler (/home/casey/web-synth/node_modules/svelte-preprocess/dist/transformers/typescript.js:257:26)
    at transformer (/home/casey/web-synth/node_modules/svelte-preprocess/dist/transformers/typescript.js:336:11)
    at transform (/home/casey/web-synth/node_modules/svelte-preprocess/dist/autoProcess.js:46:12)
    at async /home/casey/web-synth/node_modules/svelte-preprocess/dist/autoProcess.js:117:29
    at async script (/home/casey/web-synth/node_modules/svelte-preprocess/dist/autoProcess.js:147:33)
    at async process_single_tag (/home/casey/web-synth/node_modules/svelte/compiler.cjs:45984:21)
    at async Promise.all (index 0)
    at async replace_in_code (/home/casey/web-synth/node_modules/svelte/compiler.cjs:45708:23)
    at async process_tag (/home/casey/web-synth/node_modules/svelte/compiler.cjs:46001:26)
    at async preprocess (/home/casey/web-synth/node_modules/svelte/compiler.cjs:46059:25)
```

They're originating from within the Svelte compiler.

## The Cause

Svelte/SvelteKit [dropped support](https://github.com/sveltejs/kit/pull/4922) for NodeJS v14.  I still had this old version going locally which caused the build to fail because it was trying access stuff that wasn't available in that version.

## The Fix

I upgraded to NodeJS v18 which is much newer and works fully with Svelte/SvelteKit:

```bash
nvm use 18.9.0
```

You might have to use a different method to do this if you've got Node installed differently on your system, but yeah after doing that the build went through fine for me.
