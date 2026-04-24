+++
title = "Fixing Rust LLD Linker Undefined Symbol Error"
date = "2026-04-23T19:04:37-05:00"
+++

## the problem

After upgrading my Rust toolchain to the latest nightly, I started getting errors when building a WebAssembly project of mine:

```
error: linking with `rust-lld` failed: exit status: 1
  |
  = note:  "rust-lld" "-flavor" "wasm" "--export" "create_terrain_gen_ctx" "--export" "free" "--export" "gen_heightmap" "--export" "malloc" "--export" "set_params" "--export=__heap_base" "--export=__data_end" "-z" "stack-size=1048576" "--stack-first" "--no-demangle" "--no-entry" "<2 object files omitted>" "<sysroot>/lib/rustlib/wasm32-unknown-unknown/lib/libpanic_abort-*.rlib" "/home/casey/dream/src/viz/wasm/target/wasm32-unknown-unknown/release/deps/{libcommon-a24e0de9c9a36cad,librand_pcg-96aa495088ea06d3,librand-dd7ab4b12369f67a,librand_core-5f1e6ad6780daf68,libopensimplex_noise_rs-29c02d98fe844459,libnanoserde-5b273dd919df410e}.rlib" "<sysroot>/lib/rustlib/wasm32-unknown-unknown/lib/{libstd-*,libdlmalloc-*,libcfg_if-*,librustc_demangle-*,libstd_detect-*,libhashbrown-*,librustc_std_workspace_alloc-*,libminiz_oxide-*,libadler2-*,libunwind-*,liblibc-*,librustc_std_workspace_core-*,liballoc-*,libcore-*,libcompiler_builtins-*}.rlib" "-L" "<sysroot>/lib/rustlib/wasm32-unknown-unknown/lib/self-contained" "-o" "/home/casey/dream/src/viz/wasm/target/wasm32-unknown-unknown/release/deps/terrain.wasm" "--gc-sections" "--no-entry" "-O3"
  = note: some arguments are omitted. use `--verbose` to show all linker arguments
  = note: rust-lld: error: /home/casey/dream/src/viz/wasm/target/wasm32-unknown-unknown/release/deps/terrain.terrain.1508d28c2e9bb756-cgu.0.rcgu.o: undefined symbol: log_error
          rust-lld: error: /home/casey/dream/src/viz/wasm/target/wasm32-unknown-unknown/release/deps/terrain.terrain.1508d28c2e9bb756-cgu.0.rcgu.o: undefined symbol: log_error
```

The place in my code causing these issues was this:

```rs
mod imports {
  #[link(wasm_import_module = "env")]
  extern "C" {
    #[allow(dead_code)]
    pub fn log_msg(msg: *const u8, len: usize);
    pub fn log_error(msg: *const u8, len: usize);
  }
}
```

It's the same pattern I've used to import functions from JS into my Rust WebAssembly modules since I first started working with Rust + Wasm several years ago.  I'd compile + instantiate my Wasm module with those imports at runtime like this:

```typescript
WebAssembly.compile(bytes as Uint8Array<ArrayBuffer>).then(module =>
  WebAssembly.instantiate(module, {
    env: {
      log_error: (ptr: number, len: number) =>
        void getEngine().then(engine => {
          const memory = new Uint8Array((engine.exports.memory as WebAssembly.Memory).buffer);
          const buf = memory.slice(ptr, ptr + len);
          const str = new TextDecoder().decode(buf);
          console.error(str);
        }),
      log_msg: (ptr: number, len: number) =>
        void getEngine().then(engine => {
          const memory = new Uint8Array((engine.exports.memory as WebAssembly.Memory).buffer);
          const buf = memory.slice(ptr, ptr + len);
          const str = new TextDecoder().decode(buf);
          console.log(str);
        }),
    },
  })
)
```

## the cause

I hadn't changed anything in that code in a long time nor had I updated my `lld` linker, so the issue was almost certainly the updated rust toolchain.

Apparently, at some point, Rust changed its behavior wrt. the default import and you now have to manually specify the Wasm import module to pull those imports instead of having it default to `env` like before.

## the fix

I just added one line to add a magic directive to tell it to pull these imports from `env`:

```rs
#[cfg(target_arch = "wasm32")]
mod imports {
  #[link(wasm_import_module = "env")]
  extern "C" {
    #[allow(dead_code)]
    pub fn log_msg(msg: *const u8, len: usize);
    pub fn log_error(msg: *const u8, len: usize);
  }
}
```

After that, the build and functionality worked like normal.
