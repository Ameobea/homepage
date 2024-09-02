+++
title = "A Small Change to Significantly Improve Triplanar Mapping"
date = "2024-09-01T15:25:14-07:00"
author = "Casey Primozic"
authorTwitter = "ameobea10" #do not include @
+++

Triplanar Mapping is a method I make use of all the time in my 3D projects.  Over time, I've experimented with tweaks and alterations to it with the goal of making it look better, run more performantly, and be useful in more situations.

**The main change I present here is switching from using a linear mix of texture weights from each axis to a non-linear mix.**

To explain what I mean by this, I'll just show some code.

Here's a basic triplanar mapping implementation:

```glsl
vec4 triplanarTexture(sampler2D map, vec3 pos, vec3 normal) {
  vec3 weights = abs(normal);
  weights /= (weights.x + weights.y + weights.z);

  vec4 outColor = vec4(0.);
  outColor += texture2D(map, pos.yz) * weights.x;
  outColor += texture2D(map, pos.zx) * weights.y;
  outColor += texture2D(map, pos.xy) * weights.z;
  return outColor;
}
```

And here's a modified version that uses a non-linear mix of the same texture samples:

```glsl
vec4 triplanarTexture(sampler2D map, vec3 pos, vec3 normal) {
  vec3 weights = abs(normal);
  // non-linear scaling of weights
  weights = pow(weights, 8);
  weights /= (weights.x + weights.y + weights.z);

  vec4 outColor = vec4(0.);
  outColor += texture2D(map, pos.yz) * weights.x;
  outColor += texture2D(map, pos.zx) * weights.y;
  outColor += texture2D(map, pos.xy) * weights.z;
  return outColor;
}
```

It turns out that this one-line change has a lot of impact - especially for certain types of models/scenes.

First of all, it makes the transition regions smaller and reduces the amount of visible overlap between different planes.  This is most obvious on smooth meshes like this sphere:

<iframe src="https://homepage-external-mixins.ameo.design/triplanar_mapping_enhancement.html" loading="lazy" style="width: 100%;aspect-ratio: 847/812;overflow:hidden;display: block;outline:none;border:none;box-sizing:border-box; margin-left: auto; margin-right: auto"></iframe>

The left side shows the result of triplanar mapping with default linear weights, and the right shows the result when using the `pow(weights, 8)` change above.

As you can see, there is no more visible layering of the texture.  Instead, there are some small areas where the texture faces smoothly between two different planes which looks much better.

## Performance Improvements

In addition to the visual improvements, this change also opens up the possibility for some significant performance improvements.

Applying this non-linear transformation to weights serves to drive small weights to zero and large weights to one.  This makes it possible to ignore small weights entirely in some cases since they go from making a small impact to a negligible/unnoticeable impact on the output.

So to optimize the shader, it's possible to skip some texture lookups entirely if the weight is small enough:

```glsl
vec4 triplanarTexture(sampler2D map, vec3 pos, vec3 normal) {
  vec3 weights = abs(normal);
  // non-linear scaling of weights
  weights = pow(weights, 8);
  weights /= (weights.x + weights.y + weights.z);

  vec4 outColor = vec4(0.);
  if (weights.x > 0.01) {
    outColor += texture2D(map, pos.yz) * weights.x;
  }
  if (weights.y > 0.01) {
    outColor += texture2D(map, pos.zx) * weights.y;
  }
  if (weights.z > 0.01) {
    outColor += texture2D(map, pos.xy) * weights.z;
  }
  return outColor;
}
```

This optimization would be fine to include without the non-linear weights transformation, but it would rarely activate.  In the modified version, there is much more area where individual weights end up being very close to zero.

Also, the higher the power chosen to raise the weights to, the more aggressive the sharpening will be and the more effective the optimization will become.  I usually choose as high of a power as I can that avoids any visible discontinuities in the texture.

----

And that's it!  I highly recommend giving this a try in your own projects when using triplanar mapping.  It makes an already extremely effective technique even better.
