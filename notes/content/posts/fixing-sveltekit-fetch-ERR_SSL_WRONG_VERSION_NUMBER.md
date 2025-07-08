+++
title = "Fixing Sveltekit `fetch` error `ERR_SSL_WRONG_VERSION_NUMBER` with NGINX reverse proxy"
date = "2025-07-08T02:51:18-05:00"
+++

## The Problem

I am using SvelteKit and importing a WebAssembly module on the server side inside a `+page.server.ts` file like this:

```ts
const WasmPromise = import('src/viz/wasmComp/geoscript_repl').then(
  async (engine) => {
    await engine.default(fetch('/geoscript_repl_bg.wasm'));
    return engine;
  }
);
```

It works when I run for local development, but it fails when running on my VPS in production. Some notes about my deployment environment:

- I'm Sveltekit's `adapter-node`
- I'm deploying the Sveltekit app inside Docker behind an NGINX reverse proxy

This Wasm module as built using `wasm-bindgen` for Rust, and it needs the path to the Wasm to be explicitly provided since it's running on the server side rather than the client.

The `fetch('/geoscript_repl_bg.wasm')` call was the one that was failing. This is the error that I got in the Sveltekit logs:

```txt
TypeError: fetch failed
    at Object.fetch (node:internal/deps/undici/undici:11372:11)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async fetch (file:///app/build/server/index.js:4467:80) {
  cause: [Error: 40AC6882457F0000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:../deps/openssl/openssl/ssl/record/ssl3_record.c:354:
  ] {
    library: 'SSL routines',
    reason: 'wrong version number',
    code: 'ERR_SSL_WRONG_VERSION_NUMBER'
  }
}
```

## The Cause

The issue seems to be due to the fact that my NGINX server was setting the `X-Forwarded-Proto` header to `https`. This is correct behavior, but the Sveltekit node adapter was setting the protocol on the internal request for the Wasm module to HTTPs because of it.

Here's the code responsible for that: https://github.com/sveltejs/kit/blob/96ce0f9735c4d1a1d467c1f9641e91b5858eea93/packages/adapter-node/src/handler.js#L185

## The Fix

Luckily, there's a way to override this auto-detection behavior. By setting an `ORIGIN` environment variable when running the Sveltekit server, I can force these internal requests to get made back to localhost with HTTP rather than HTTPS:

`ORIGIN="http://127.0.0.1:5814" node ./build/index.js`

This successfully resolved the issue for me, and my server-side Wasm worked in production.
