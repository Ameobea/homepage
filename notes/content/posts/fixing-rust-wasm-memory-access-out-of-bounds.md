+++
title = "Fixing Rust+WebAssembly Memory Access Out of Bounds Errors in Debug Mode"
date = "2024-12-23T12:18:52-06:00"
+++

## The Problem

In my project built with Rust compiled to WebAssembly, I started seeing errors like this that caused a crash - but only when it was compiled in debug mode:

```txt
wavetable.wasm-011dbbd6:0x17b89 Uncaught RuntimeError: memory access out of bounds
    at wavetable.wasm._ZN9wavetable2fm7effects14EffectInstance10from_parts17h321e4433e1216e56E (wavetable.wasm-011dbbd6:0x17b89)
    at wavetable.wasm._ZN9wavetable2fm7effects11EffectChain10set_effect17h969349e414104e9eE (wavetable.wasm-011dbbd6:0x1ba60)
    at wavetable.wasm.fm_synth_set_effect (wavetable.wasm-011dbbd6:0x314d3)
    at FMSynthAWP.port.onmessage (FMSynthAWP.js:171:37)
```

When compiling in release mode, the code ran just fine.

The decompiled debug-mode Wasm at the point of the crash looked like this:

```wat
...
(local $var833 i32)
(local $var834 i32)
(local $var835 i32)
global.get $__stack_pointer
local.set $var22
i32.const 1767008
local.set $var23
local.get $var22
local.get $var23
i32.sub
local.set $var24
local.get $var24
global.set $__stack_pointer
local.get $var24
local.get $var1
i32.store offset=20 // <- this is the instruction which produced the invalid access
```

## The Cause

The only thing going on in this function up to that point is that it's bumping the stack pointer down to make space for the local variables used by the function.

When I hovered over the `$__stack_pointer` variable in Chrome Devtools, I saw that it currently had this value stored:

```txt
type: "i32"
value: -792224
```

The stack pointer is definitely not supposed to be negative.

So the actual thing going on here was actually a stack overflow. That constant `1767008` earlier on in the function was how much stack space the function was trying to request - around 1.75 MB. This was more than what was available, and that caused the stack pointer to go negative and produce an invalid memory access when trying to read it.

This tracked with the code for the function itself. Within it, I was initializing some large buffers in memory using code like this:

```rs
let buffer = Box::new(CircularBuffer::new());
```

That `CircularBuffer` type was very large and stored the entire buffer inside itself directly without any indirection:

```rs
pub struct CircularBuffer<const LENGTH: usize> {
  buffer: [f32; LENGTH],
  /// Points to the index that the most recently added value was written to
  head: usize,
}
```

When Rust initializes `Box`es in debug mode, it first creates the value on the stack and then copies it to the heap. In release mode, this copy is optimized out in most cases, so the large value are written directly into the allocated memory. That's why this stack overflow only happens in debug mode.

_A bit of a side note_:

It used to be possible to work around this issue by using the unstable `box` syntax in Rust to force the stack-to-heap copy to not occur, like this:

```rs
let buffer = box CircularBuffer::new();
```

However, `box` syntax has since been [removed](https://github.com/rust-lang/rust/issues/49733#issuecomment-1399427237) with no plans on bringing it back.

The comment linked above mentions some alternatives that would bring the same functionality back (they call it "placement new"). But as far as I can tell, as of writing this (Dec. 2024) none of these alternatives are available yet - stable or otherwise.

## A Workaround

I found two different fixes for this issue.

The first one is to manually bump the stack size to work around it. This can be done by editing the `.cargo/config.toml` file in your project's workspace:

```toml
[target.wasm32-unknown-unknown]
rustflags = [
  "-C", "link-args=-z stack-size=15000000",
]
```

However, this has the effect of increasing the stack size for release mode as well which isn't necessary.

I tried to configure it to only increase it in dev mode, which required me to enable the `profile-rustflags` feature for my workspace. After doing that, I got compilation errors for some of my dependencies which complained about the `-z stack-size` argument not being supported by my linker, which didn't happen before.

I'm not sure what was going on with that, but I decided to stop trying this approach and go for what turned out to be a better solution.

## A Better Fix

Rather than work around the problem by just increasing the stack size, I decided to solve the underlying problem that caused it by just reducing the amount of data being written to the stack.

To do this, I explicitly implement the optimization that `box` syntax/placement new would provide by allocating uninitialized memory and then writing my data into it manually. This requires a bit of unsafe code, but looks something like this:

```rs
let mut buffer: Box<MaybeUninit<CircularBuffer<_>>> =
  Box::new_uninit();
let buf_ptr = buffer.as_mut_ptr();
unsafe {
  let inner = &mut (*buf_ptr).buffer;
  inner.fill(0.);
  (*buf_ptr).head = 0;
}
let buffer = unsafe { buffer.assume_init() };
```

For my situation, there was an even better solution.

Since every single field of the struct I was initializing gets filled with data which has a bit representation of all zeroes, I can use a shortcut to initialize my buffer:

```rs
let feedback_buffer: Box<CircularBuffer<_>> =
  unsafe { Box::new_zeroed().assume_init() };
```

I can just ask for the memory to be pre-filled with all zeroes from the allocator and leave it at that!

Once I made this change and fixed a couple of other places where I was initializing some large boxed values on the stack, the invalid memory access errors went away and my program started working in debug mode again.
