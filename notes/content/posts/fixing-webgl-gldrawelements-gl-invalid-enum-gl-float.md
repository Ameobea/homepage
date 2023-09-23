+++
title = "Fixing WebGL/Three.JS `GL_INVALID_ENUM : glDrawElements: type was GL_FLOAT` error"
date = "2023-09-23T11:25:33-07:00"
+++

## The Problem

I was working on some procedural dynamic LOD terrain in Three.JS.  As part of this, I was manually constructing indexed `BufferGeometry` instances.  Things were working alright, but when I added in a depth pre-pass I started getting errors like this in the console and the terrain failed to render:

```txt
GL ERROR :GL_INVALID_ENUM : glDrawElements: type was GL_FLOAT
```

The code I had looked something like this:

```ts
const vertices = new Float32Array((segments + 1) * (segments + 1) * 3);
const indices = new Float32Array(segments * segments * 6);

// ... compute terrain and populate vertices and indices ...

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
geometry.setIndex(new THREE.BufferAttribute(indices, 1));

const mesh = new THREE.Mesh(geometry, material);
```

## The Cause

This error is caused because I accidentally used a `Float32Array` to store the indices, but I should have used an integer array type.  I'm not sure why it originally worked and then stopped working when I added the depth pre-pass though.

## The Fix

I switched the code creating the arrays to this:

```ts
const vertices = new Float32Array((segments + 1) * (segments + 1) * 3);
const indexCount = segments * segments * 6;
const u16Max = 65_535;
const indices = indexCount > u16Max ? new Uint32Array(indexCount) : new Uint16Array(indexCount);
```

and left the rest of the code the same.

After doing this, the error went away and the terrain rendered correctly again!
