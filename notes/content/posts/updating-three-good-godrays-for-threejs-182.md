+++
title = "Updating three-good-godrays for Three.JS 0.182"
date = "2026-01-01T03:18:23-06:00"
+++

I maintain the [`three-good-godrays`](https://github.com/Ameobea/three-good-godrays) library, which adds support for volumetric raymarched screen-space godrays to Three.JS.

The most recent version of Three.JS (0.182.0) made some breaking changes to its depth packing and shadow internals that the library relied on, and it needed to be updated in order to work with it. I figured I'd create a little summary of what changes were needed for anyone else updating similar code for newer Three.JS versions.

Most of my fixes are implemented in this commit: https://github.com/Ameobea/three-good-godrays/commit/2295609acb7cadbf9415edd51bcebbab766012d5

Most of the breaking changes in Three.JS can be traced back to this PR: https://github.com/mrdoob/three.js/pull/32303

This PR is described as "modernizes the WebGLRenderer shadow mapping with several significant improvements" and it makes several distinct changes that touch many different parts of Three.JS's internals.

## Cubemaps for `PointLight`s

The first relevant change is "Native Cube Depth Texture Support for PointLight Shadows". Previously, Three.JS used a texture atlas kind of approach that stored the shadow data for the point light in a normal 2D texture. This then had to be manually transformed to get the relevant shadow data out, which my code handled.

Version 0.182 changes it to using an actual cubemap texture. I updated `three-good-godrays` to check for this case and use the built-in cubemap read functions to deal with it in that case:

```glsl
// this `USE_CUBE_SHADOWMAP` is set on the JS side if a cubemap texture is found
#if defined(USE_CUBE_SHADOWMAP)
  vec3 lightToPos = worldPos - lightPos;
  float lightDist = length(lightToPos);
  float shadowMapDepth = textureCube(shadowMap, lightToPos).r;
  float depth = lightCameraNear + (lightCameraFar - lightCameraNear) * shadowMapDepth;
  return vec2(float(lightDist > depth + 0.005), lightDist);
#else
```

## Simpler Depth Packing

Previously, Three.JS's `BasicDepthPacking` used a custom function that packed the depth value into the full RGBA range to help improve precision. This new version switches to a simpler scheme that just uses a single value. I'm not sure what the reason for this is, but anyway my code had to change.

I checked if the Three.JS release was >= 182 and if so use the simpler depth packing which is just `1.0 - depth`:

```glsl
// `USE_UNPACKED_DEPTH` is set if Three.JS version >= 182
#if defined( USE_UNPACKED_DEPTH )
  #if defined(IS_DIRECTIONAL_LIGHT)
    float depth = packedDepth.x;
  #else
  // packing uses: gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
  float depth = 1. - packedDepth.x;
  #endif
#else
  float depth = unpackRGBAToDepth(packedDepth);
#endif
```

## `OrthographicCamera` Now Default in `postprocessing` for `Pass`

The final breaking change that I needed to deal with wasn't in Three.JS itself but rather the [`postprocessing`](https://github.com/pmndrs/postprocessing) library.

It was introduced in this commit: https://github.com/pmndrs/postprocessing/commit/443043c816ba7e1c3001a615e6a36648d234a1ef

This seems to impact postprocessing versions >= 6.38.

That commit supposedly fixes an exception that happens when using Three.JS's new reversed depth mode - which is supposedly an alternative to logarithmic depth buffer that offers better precision + performance. Anyway, it changes the default camera passed to the `Pass` constructor from a simple `THREE.Camera` to a `THREE.OrthographicCamera`.

It was tricky to track this down, but the fix was as simple as just explicitly passing a `new THREE.Camera()` instead of relying on the new default:

```
-    super('GodraysCompositorPass');
+    super('GodraysCompositorPass', undefined, new THREE.Camera());
```

## Conclusion

It was rather annoying making these fixes and getting everything working, but at least it worked and `three-good-godrays` now fully works with the latest versions of both Three.JS and postprocessing.

Usually these updates aren't that bad luckily, and most of the time there's nothing that needs to be updated at all.
