---
title: 'Building a Statically Linked `wasm-opt` for Continuous Deployment'
date: '2019-12-07'
---

## UPDATE 2021-06-26

Binaryen, the repository that contains `wasm-opt`, actually builds `wasm-opt` for alpine/statically linked as part of its [CI Pipeline](https://github.com/WebAssembly/binaryen/runs/2919351777?check_suite_focus=true).  Stealing their code for that, here's a very simple script that handles building `wasm-opt` statically, no extra work required:

```bash
# Start a Docker container for doing the build
docker run -w /src -dit --name alpine -v $PWD:/src node:lts-alpine

# Create a helper script file to make running commands inside the alpine container easier
echo 'docker exec alpine "$@";' > ./alpine.sh
chmod +x ./alpine.sh

# Prepare build environment + install dependencies
./alpine.sh apk update
./alpine.sh apk add build-base cmake git python3 clang ninja
./alpine.sh pip3 install -r requirements-dev.txt

# Build
rm -f CMakeCache.txt CMakeFiles
./alpine.sh cmake . -G Ninja -DCMAKE_CXX_FLAGS="-static" -DCMAKE_C_FLAGS="-static" -DCMAKE_BUILD_TYPE=Release -DBUILD_STATIC_LIB=ON -DCMAKE_INSTALL_PREFIX=install
./alpine.sh ninja install

# Copy our built `wasm-opt` binary out
docker cp alpine:/src/install/bin/wasm-opt .

# Clean up the docker container
docker kill alpine && docker rm alpine
```

That's it!  Verifying that the generated `wasm-opt` binary is actually statically linked:

```bash
> file ./wasm-opt
./wasm-opt: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, with debug_info, not stripped
```

----

Here's the original blog post for posterity:

When deploying WebAssembly assets to production for use in the web browser, `wasm-opt` is an extremely valuable tool for generating Wasm binaries that are as small and performant as possible. However, since it like most Wasm tooling is still quite new and not yet commonplace, installing it and making use of it in an automated fashion can be a bit tricky.

## Background on `wasm-opt`

If you've not used it before, `wasm-opt` is a tool from the [Binaryen](https://github.com/WebAssembly/binaryen) project that performs optimizations directly on WebAssembly bytecode. It performs a range of [optimization passes](https://github.com/WebAssembly/binaryen/tree/master/src/passes) including things like dead code elimination, inlining, and constant propagation. Since it both takes as input and outputs normal WebAssembly bytecode, it can optimize WebAssembly blobs created by any toolchain - Rust, C++, AssemblyScript, etc. - in the same way.

## The Problem

Currently, if you want to make use of `wasm-opt` as part of a continuous deployment workflow, there are a few challenges that you have to overcome. There are no `apt` packages or PPAs that provide `wasm-opt` in an easy-to-install fashion, so it is necessary to build it from source.

Binaryen and `wasm-opt` are C++ projects, meaning that they link to the `libc` and `libc++` of the operating system on which they were compiled. If you try to run it on a machine with different versions of those libraries, you will get an error like this:

```
./wasm-opt: /usr/lib/x86_64-linux-gnu/libstdc++.so.6: version `GLIBCXX_3.4.20' not found (required by ./wasm-opt)
./wasm-opt: /usr/lib/x86_64-linux-gnu/libstdc++.so.6: version `CXXABI_1.3.9' not found (required by ./wasm-opt)
./wasm-opt: /usr/lib/x86_64-linux-gnu/libstdc++.so.6: version `GLIBCXX_3.4.22' not found (required by ./wasm-opt)
./wasm-opt: /usr/lib/x86_64-linux-gnu/libstdc++.so.6: version `GLIBCXX_3.4.21' not found (required by ./wasm-opt)
```

The problem can be illustrated more clearly by listing the dynamically linked libraries for the normally-built `wasm-opt` binary:

```
» ldd ./bin/wasm-opt
        linux-vdso.so.1 (0x00007fff47dc4000)
        libstdc++.so.6 => /usr/lib/x86_64-linux-gnu/libstdc++.so.6 (0x00007f22e9daa000)
        libm.so.6 => /lib/x86_64-linux-gnu/libm.so.6 (0x00007f22e9a0c000)
        libgcc_s.so.1 => /lib/x86_64-linux-gnu/libgcc_s.so.1 (0x00007f22e97f4000)
        libpthread.so.0 => /lib/x86_64-linux-gnu/libpthread.so.0 (0x00007f22e95d5000)
        libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f22e91e4000)
        /lib64/ld-linux-x86-64.so.2 (0x00007f22ea9af000)
```

The versions of those libraries that your CI/CD servers are running likely won't match those of the machine you compile them on and may change as Docker images are updated or the underlying operating systems are patched, so it's impossible to be sure you'll have a compatible `wasm-opt` image. One potential workaround is to re-build `wasm-opt` from source every time your CI runs, but that causes build times to skyrocket and potentially costs a lot of money if hosted CI is being used.

## The Solution

Luckily, there's a solution to the library version mis-match problem: **static linking**. By default, the C++ linker _dynamically links_ to the system's `libc` and `libc++`, which is great because it means only a single copy of the library has to be loaded into memory for every program that uses it. However, it's possible to specify that we want to _statically link_ it instead, embedding the libraries into the generated binary.

Since Binaryen uses CMake to build, all that is required is to add a single line to the `CMakeLists.txt` file. Find the line containing this text:

```
target_link_libraries(wasm-opt ${CMAKE_THREAD_LIBS_INIT})
```

and replace it with this line:

```
target_link_libraries(wasm-opt -pthread -static-libgcc -static-libstdc++)
```

You can also apply the following patch file with `git apply patch.diff` to have the same effect, although it's not guaranteed to work as Binaryen is changed going forward:

```diff
diff --git a/CMakeLists.txt b/CMakeLists.txt
index c040425a2..59761379c 100644
--- a/CMakeLists.txt
+++ b/CMakeLists.txt
@@ -262,7 +262,8 @@ set(wasm-opt_SOURCES
   src/tools/wasm-opt.cpp
 )
 add_executable(wasm-opt ${wasm-opt_SOURCES} ${binaryen_objs})
-target_link_libraries(wasm-opt ${CMAKE_THREAD_LIBS_INIT})
+target_link_libraries(wasm-opt -pthread -static-libgcc -static-libstdc++)
 set_property(TARGET wasm-opt PROPERTY CXX_STANDARD 14)
 set_property(TARGET wasm-opt PROPERTY CXX_STANDARD_REQUIRED ON)
 install(TARGETS wasm-opt DESTINATION ${CMAKE_INSTALL_BINDIR})
```

This tells CMake to pass flags to the linker indicating that we want a build that statically links those `libc` and `libc++` libraries into the generated binary.

Now, we can build the project like normal and generate a `wasm-opt` binary that can run on (mostly) any Linux version out there:

```bash
» mkdir build && cd build
» cmake ..
» make -j8 wasm-opt # Replace 8 with your CPU's core count
» ./bin/wasm-opt --version
wasm-opt 1.39.1-66-g6f55457c3
```

For my own CI/CD pipelines, I just put that binary in a webserver and pull it down every time the CI runs. The ~200 milliseconds it takes to retrieve over the network beats having to build it fresh by a long shot.

## Extra - Applying This Strategy Elsewhere

This same process works for many other C/C++ projects as well, but not all. Sometimes, complicated build processes or external dependencies are incompatible with static linking, so it's not guaranteed to work.

### Statically Linking Rust Applications

For tools written in Rust, however, it's usually possible to do this to an even more effective degree. Rust supports building with [musl libc](https://doc.rust-lang.org/edition-guide/rust-2018/platform-and-target-support/musl-support-for-fully-static-binaries.html), a fully static version of `libc`, out of the box. That means that many of the useful tools for working with Wasm that are written in Rust such as [twiggy](https://github.com/rustwasm/twiggy), [wasm-snip](https://github.com/rustwasm/wasm-snip), and others can be built as statically linked binaries with basically no effort at all:

```
» rustup target add x86_64-unknown-linux-musl
» cargo install --target x86_64-unknown-linux-musl twiggy
```

This generates a completely static binary that can be ran on pretty much any Linux as well:

```
» ldd `which twiggy`
        not a dynamic executable
```
