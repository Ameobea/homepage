+++
title = "Compiling the Boundary-First-Flattening Library to Wasm"
date = "2025-08-04T01:47:56-05:00"
+++

Here is an account of the process I developed to get the [`boundary-first-flattening`](https://github.com/GeometryCollective/boundary-first-flattening) library building for use on the web via WebAssembly.

Boundary First Flattening (I refer to it as BFF throughout this article) is a powerful algorithm and library for "surface parameterization" - or projecting 3D surfaces into 2D. It also includes built-in support for other parts of a full UV unwrapping pipeline like bin-packing texture islands into a square. I was using it for my [Geotoy](https://3d.ameo.design/geotoy) project - a browser-based, Shadertoy-inspired web app for procedural geometry.

Getting this library compiled to Wasm was a very tricky process, mostly because BFF relies on some underlying linear algebra and math libraries to function. These both require some special tweaks and modifications of their own to compile to Wasm. Specifically, it uses [SuiteSparse](https://github.com/DrTimothyAldenDavis/SuiteSparse) - which in turn requires a [BLAS](https://www.netlib.org/blas/) + [LAPACK](https://www.netlib.org/lapack/) implementation.

## Building OpenBLAS for Wasm

I was lucky here in that someone else had already done most of the hard work for compiling a BLAS implementation (OpenBLAS) to Wasm. It was done to support a Wasm version of an open-source speech recognition project called [Kaldi](https://github.com/kaldi-asr/kaldi).

They were kind enough to provide some pretty detailed notes: https://github.com/msqr1/kaldi-wasm2

These include some instructions compiling OpenBLAS for Wasm specifically. I followed them mostly, but had to tweak the compilation flags a bit in order to include LAPACK in the build as well (which is required for SuiteSparse).

Here's an overview:

- Clone [OpenBLAS](https://github.com/OpenMathLib/OpenBLAS) and check out commit `5ef8b19`
- Source your Emscripten `emsdk` installation, then build with this:

```sh
make CC=emcc FC=emcc HOSTCC=gcc \
    TARGET=RISCV64_GENERIC \
        ONLY_CBLAS=1 NOFORTRAN=1 NO_LAPACK=0 NO_LAPACKE=0 \
        C_LAPACK=1 BUILD_WITHOUT_LAPACK=1 USE_THREAD=0 \
        BUILD_BFLOAT16=0 BUILD_COMPLEX16=0 BUILD_COMPLEX=0 \
         CFLAGS="-O3 -ffast-math -msimd128 -mavx"
```

This should run for a while and then spit out a `.a` file containing the built library in the current directory.

I end up getting errors at the end like `unable to find library -lgfortran`, but it seems to be late enough in the build that it doesn't matter. As long as you wind up with a `libopenblas_riscv64_generic-r0.3.28.a` file in the openblas root dir, everything should be good.

Install with:

```
mkdir /home/YOURUSERNAME/blas-build
PREFIX=/home/YOURUSERNAME/blas-build NO_SHARED=1 make install
```

(Note that `~` doesn't seem to work in paths in CMake as a shorthand for home directory; you have to provide the full explicit path in order for it to work.)

## Building SuiteSparse

As I mentioned before, SuiteSparse depends on both BLAS and LAPACK. The OpenBLAS build from before (as configured) includes LAPACK symbols as well.

However, try as I might, I couldn't get CMake's built-in support for finding and configuring BLAS to work. I ended up having to update the CMakeLists.txt and add these lines right before `if ( SUITESPARSE_USE_SYSTEM_GRAPHBLAS )` (line 116):

```cmake
set(BLAS_LIBRARIES "/home/YOURUSERNAME/blas-build/lib/libopenblas.a")
set(LAPACK_LIBRARIES ${BLAS_LIBRARIES})
```

^ This overrides the default behavior of trying to search all over for any kind of valid BLAS/LAPACK implementation it can find and points it directly to the one we just built instead.

I also had to apply this additional patch to get rid of some conflicting symbols that were getting re-defined for some reason from OpenBLAS/LAPACK:

```diff
diff --git a/SuiteSparse_config/SuiteSparse_config.h b/SuiteSparse_config/SuiteSparse_config.h
index 7d7d3f3f6..b073183f1 100644
--- a/SuiteSparse_config/SuiteSparse_config.h
+++ b/SuiteSparse_config/SuiteSparse_config.h
@@ -612,11 +612,11 @@ int SuiteSparse_version     // returns SUITESPARSE_VERSION
 #define SUITESPARSE_BLAS_DSCAL      SUITESPARSE_BLAS ( dscal  , DSCAL  )
 #define SUITESPARSE_BLAS_DNRM2      SUITESPARSE_BLAS ( dnrm2  , DNRM2  )

-#define SUITESPARSE_LAPACK_DPOTRF   SUITESPARSE_BLAS ( dpotrf , DPOTRF )
-#define SUITESPARSE_LAPACK_DLARF    SUITESPARSE_BLAS ( dlarf  , DLARF  )
-#define SUITESPARSE_LAPACK_DLARFG   SUITESPARSE_BLAS ( dlarfg , DLARFG )
-#define SUITESPARSE_LAPACK_DLARFT   SUITESPARSE_BLAS ( dlarft , DLARFT )
-#define SUITESPARSE_LAPACK_DLARFB   SUITESPARSE_BLAS ( dlarfb , DLARFB )
+// #define SUITESPARSE_LAPACK_DPOTRF   SUITESPARSE_BLAS ( dpotrf , DPOTRF )
+// #define SUITESPARSE_LAPACK_DLARF    SUITESPARSE_BLAS ( dlarf  , DLARF  )
+// #define SUITESPARSE_LAPACK_DLARFG   SUITESPARSE_BLAS ( dlarfg , DLARFG )
+// #define SUITESPARSE_LAPACK_DLARFT   SUITESPARSE_BLAS ( dlarft , DLARFT )
+// #define SUITESPARSE_LAPACK_DLARFB   SUITESPARSE_BLAS ( dlarfb , DLARFB )

 // double complex
 #define SUITESPARSE_BLAS_ZTRSV      SUITESPARSE_BLAS ( ztrsv  , ZTRSV  )
```

This isn't necessary to get the build to work, but it's necessary to prevent runtime errors when using the final boundary-first-flattening library.

Now, SuiteSparse can be built with:

```sh
mkdir build && cd build

emcmake cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_C_COMPILER=emcc -DCMAKE_CXX_COMPILER=em++ -DEMSCRIPTEN=True -DBUILD_SHARED_LIBS=OFF -DBUILD_STATIC_LIBS=ON -DCHOLMOD_USE_CUDA=OFF -DSUITESPARSE_USE_CUDA=OFF "-DSUITESPARSE_ENABLE_PROJECTS=suitesparse_config;amd;colamd;cholmod" -DSUITESPARSE_USE_FORTRAN=OFF -DBLA_STATIC=ON -DBLAS_VENDOR=OpenBLAS -DBLA_VENDOR=OpenBLAS -DSUITESPARSE_USE_OPENMP=OFF -DCMAKE_FIND_DEBUG_MODE=OFF -DBLA_F95=OFF ..

emmake make -j12
```

At some point, the build will freak out and break with errors about undefined symbols and conflicting function declarations. HOWEVER, it should have gotten far enough along to produce some nice .a files in places like `build/AMD/libamd.a`.

These are what we're really after, and as long as you have a `build/CHOLMOD/libcholmod.a` you should be golden.

Once the build finishes, the output static library .a files need to be moved somewhere that Emscripten can find them.

I discovered that emscripten will look at this location in its search path, which is nice and isolated:

```txt
/home/YOURUSERNAME/emsdk/upstream/emscripten/cache/sysroot/usr/local/lib/
```

I created that directory and then copied the following files into there:

- `/home/YOURUSERNAME/blas-build/lib/libopenblas.a` to `libopenblas.a` and also to `liblapack.a`
  - _it should be duplicated to both locations, as this library contains symbols for both BLAS and LAPACK but the build system looks for both separately_
- `SuiteSparse/build/AMD/libamd.a` to `libAMD.a`
- `SuiteSparse/build/CAMD/libcamd.a` to `libcamd.a`
- `SuiteSparse/build/CCOLAMD/libccolamd.a` to `libccolamd.a`
- `SuiteSparse/build/CHOLMOD/libcholmod.a` to `libcholmod.a`
- `SuiteSparse/build/SuiteSparse_config/libsuitesparseconfig.a` to `libsuitesparseconfig.a`

## Building `boundary-first-flattening`

I had to make some changes to the CMake config for the BFF library itself to get it building with Wasm.

(Full diff I applied: https://github.com/GeometryCollective/boundary-first-flattening/commit/680a2fd384f736b7300f73126796dd0001970294)

I edited `cmake/FindSuiteSparse.cmake` and updated the list of suitesparse libraries to this:

```cmake
## Default behavior if user doesn't use the COMPONENTS flag in find_package(SuiteSparse ...) command
if(NOT SuiteSparse_FIND_COMPONENTS)
	list(APPEND SuiteSparse_FIND_COMPONENTS AMD CAMD CCOLAMD COLAMD CHOLMOD suitesparseconfig)  ## suitesparse and metis are not searched by default (special case)
endif()
```

This removes some of the libraries which aren't needed (and aren't actually built with the given config) and adds in the `suitesparseconfig` library explicitly which seemed to be missing.

I also edited the root `CMakeLists.txt` file to add these three lines before the `# suitesparse` section:

```cmake
include_directories("/home/casey/SuiteSparse/CHOLMOD/Include")
include_directories("/home/casey/SuiteSparse/SuiteSparse_config")
include_directories("/home/YOURUSERNAME/blas-build/include")
```

^ these just help the compiler find the header files for SuiteSparse and BLAS/LAPACK that it needs in order to build.

### Code Fixes

There were also a few fixes I had to make to the BFF source code itself to make it work.

I had to update several files to add imports for `#include <cstdint>` (this was required for me to even be able to build the library without emscripten). I imagine it has something to do with C++ compiler versions.

There's one issue in the `boundary-first-flattening` library that caused runtime issues when compiling for 32 bit targets (like Wasm). It was caused by assuming that `size_t` matches the integer sizes used by some underlying SuiteSparse `SparseMatrix`es.

In reality, those SuiteSparse matrix indices were always 64 bits even on 32-bit targets, but `size_t` was dropping to 32. This predictably created a lot of issues when casting pointers and copying memory around.

I fixed it by patching this file: https://github.com/GeometryCollective/boundary-first-flattening/commit/680a2fd384f736b7300f73126796dd0001970294#diff-1d5499e970a46aba46111951b7a9f6b526989e47973b06d12d6fdd02f0826e76

### Building

Once those CMake config files and code changes were applied, I built the library like this:

```sh
mkdir build && cd build

# This configures it to just build a `libbff.a` file.  This might be all that
# you need for your specific use case.
emcmake cmake -DBFF_BUILD_GUI=OFF -DBFF_BUILD_CLI=OFF -DCMAKE_BUILD_TYPE=Release ..

# You can also configure it to compile the CLI to Wasm, but this has limited utility:
emcmake cmake -DBFF_BUILD_GUI=OFF -DBFF_BUILD_CLI=ON -DCMAKE_BUILD_TYPE=Release ..

# Then run the build
emmake make -j12
```

## Custom Wrapper Library

There's not a ton of value in having the raw CLI itself compiled to Wasm, and the `libbff.a` file exposes a C++ interface that isn't directly exposed to Wasm.

A more useful solution is to create a custom wrapper library that exposes some high-level bindings to JS.

I set up one that handles this. It exposes a single `unwrapUVs` function which takes input mesh positions and vertices along with a few params controlling the BFF algorithm. It then computes the projection and returns a class holding the unwrapped UVs and new vertices and indices.

You can find the full implementation in this commit: https://github.com/GeometryCollective/boundary-first-flattening/commit/680a2fd384f736b7300f73126796dd0001970294#diff-67e14663983ede25ad744af48bbd4faff5ba01e893c956c0e49d10a4cc25eefd

_One thing to note is that I have a little extra script in the `Justfile` to inject a line into the generated JS module so it can be import as an ES Module._

The only other piece I have is a little TypeScript shim to handle the async initialization of the UV unwrap module, move data in and out of Wasm, and handle errors: https://github.com/Ameobea/sketches-3d/blob/main/src/viz/wasm/uv_unwrap/uvUnwrap.ts

If you're interested in running this yourself, I've included the whole thing with the Emscripten-generated Wasm and JS file along with the TypeScript shim here: https://github.com/Ameobea/sketches-3d/tree/main/src/viz/wasm/uv_unwrap

## Results

After all that work, you're rewarded with a fully-functional BFF implementation that can handle the whole process of generating valid UVs for arbitrary input meshes:

![A screenshot of a mesh rendered in Geotoy. It looks like a sphere with some holes drilled in it that has been split in half sideways. The sphere is textured with a debug texture showing UV coordinates across different parts of its surface](https://i.ameo.link/d7v.png)

I'm afraid I won't be able to provide support to people if they run into trouble with this method or have issues getting this to work for their own use cases. As you can probably see, this whole thing is quite brittle and required a ton of hacks and workarounds to get working.

That being said, I hope this writeup serves as a decent guide or starting point and helps people make use of the amazing `boundary-first-flattening` library in the browser.
