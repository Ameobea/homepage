+++
title = "Fixing Nginx Reverse Proxy Server Not Compressing gltf/glb Files"
date = "2023-10-24T03:39:17-07:00"
+++

I've been building some [interactive sketches/games](https://github.com/ameobea/sketches-3d) in Three.JS, and I wanted to deploy it on my server. I export the models used by the level from Blender in glTF format, which is a modern, well-supported, and commonly used format for this. Specifically, I exported the models as a .glb file.

## The Problem

When I loaded my levels in the browser, I noticed that the .glb file wasn't getting compressed with gzip. This was a problem because the file is quite large - over 4MB - and glb is a format that should benefit greatly from compression.

For my particular server setup, I use NGINX as a reverse proxy to a different Apache2 server hosting the raw files. Somewhere along the line, the compression was not taking place for some reason.

## NGINX Config Changes

There were a few things causing this issue for me.

First, I had to add some MIME type definitions to my NGINX server manually to tell it that gltf/glb files are compressible. I added this to my `nginx.conf` file:

```txt
  gzip_proxied any;
  gzip_types text/plain text/css ... ... model/gltf model/gltf-binary;
  brotli_types text/plain text/css ... ... model/gltf model/gltf-binary;
```

This gives a list of MIME types that NGINX will treat as compressible. I also added some entries to the `mime.types` file to instruct it to map .gltf and .glb files to those mime types:

```txt
  model/gltf                            gltf;
  model/gltf-binary                     glb;
```

However, even after doing that, it still wasn't working. The `gzip_proxied` directive should be causing it to compress any compressible responses from the upstream Apache2 server even if they weren't compressed natively, but it wasn't happening.

## Apache2 Config Changes

> It turns out that I also needed to make a config change on the upstream Apache2 server to get it to work.

NGINX bases its checks on whether or not to compress a proxied response based on the `Content-Type` header of that response, which is set by the upstream. It turns out that the upstream Apache2 server serving the .glb file didn't know about its MIME type, so I had to add config entries there as well to map the extension to the MIME type:

```txt
  AddType model/gltf .gltf
  AddType model/gltf-binary .glb
```

After doing that, the Apache2 upstream server properly set the `Content-Type: model/gltf-binary` header on the response, even though it didn't compress it. Then, the NGINX reverse proxy server saw that content type and matched it to the compressible MIME types I configured earlier and properly compressed it before forwarding it to the user.

After compressing with gzip, my glb response size went down from 4.2MB to under 1MB; very much worth the effort!
