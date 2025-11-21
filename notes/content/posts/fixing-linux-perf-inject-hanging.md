+++
title = "Fixing Linux Perf Inject Hanging"
date = "2025-11-18T11:38:39-06:00"
+++

## The Problem

I was working on optimizing some WebAssembly, and wanted to use the Linux `perf` utility to profile Google Chrome to analyze where the most time was getting spent in my code at the assembly level.

I was following a guide to do this: <https://v8.dev/docs/linux-perf>

There is one step that involves processing some artifacts generated during the profiling process. This involves running the following command:

```
perf inject --jit --input=perf.data --output=perf.data.jitted;
```

When I ran this command, it would start but then hang indefinitely. It seemed to be making no progress even after several minutes of running, and there was no noticeable CPU activity to indicate it was doing work.

## The Cause

I eventually figured out that `perf` has a `-v` flag which enables verbose logging. When I re-ran the `perf inject` command with this flag included, I saw that `perf` was trying to download hundreds (maybe more) of debug info files for some of the symbols in the binary I was profiling.

I was running a normal out-of-the box Google Chrome browser without any debug info attached. It's possible that this wouldn't happen in the case that a profiling build of Chrome was used that included debug symbols built-in.

I'm not sure if these requests were timing out, getting throttled/rate-limited, or if they were just taking a long time to return. However, the result was that they were being processed very slowly and I had no idea if/when they would finish.

## The Fix

For my particular case, I didn't have any need to download this debug info, whether it was even working or not; the code I was interested in was JIT-compiled WebAssembly.

I found that this automatic debug symbol downloading was controlled by an environment variable: `DEBUGINFOD_URLS`

On my system, this was set to `https://debuginfod.debian.net` by default.

I was able to fix the problem by re-running the `perf inject` command with the environment variable cleared like this:

```
DEBUGINFOD_URLS= perf inject -v --jit --input=perf.data --output perf.data.jitted
```

This fix made the `perf inject` command finish in less than a second, yielding me a `perf.data.jitted` file that I could then analyze directly with `perf report` like normal.
