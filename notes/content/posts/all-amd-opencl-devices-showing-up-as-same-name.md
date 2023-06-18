+++
title = "Fix for AMD OpenCL Devices Showing Up as the Same Name"
date = "2023-06-18T14:10:17-07:00"
+++

I've been experimenting with OpenCL via [`pyopencl`](https://documen.tician.de/pyopencl/) recently.  They provide a nice interface for enumerating available devices and getting information about them, and then using them to run OpenCL code:

```txt
>>> import pyopencl as cl
>>> platform = cl.get_platforms()[0]
>>> platform.get_devices()
[
  <pyopencl.Device 'gfx1100' on 'AMD Accelerated Parallel Processing' at 0x56353125bd70>,
  <pyopencl.Device 'gfx1036' on 'AMD Accelerated Parallel Processing' at 0x5635312ec670>
]
>>>
```

There are two devices for me because I have one discrete 7900 XTX GPU as well as an integrated GPU on my 7950X CPU.  `gfx1100` is the Shader ISA [for the 7900 XTX](https://www.techpowerup.com/gpu-specs/amd-navi-31.g998), and `gfx1036` is [for the iGPU](https://www.techpowerup.com/gpu-specs/radeon-graphics-128sp.c3993).

## The Problem

At some point, `pyopencl` started returning `gfx1100` as the name for both of my devices:

```txt
>>> import pyopencl as cl
>>> platform = cl.get_platforms()[0]
>>> platform.get_devices()
[
  <pyopencl.Device 'gfx1100' on 'AMD Accelerated Parallel Processing' at 0x555cc5a8ed60>,
  <pyopencl.Device 'gfx1100' on 'AMD Accelerated Parallel Processing' at 0x555cc5b1f5f0>
]
>>> [d.hashable_model_and_version_identifier for d in platform.get_devices()]
[
  ('v1', 'Advanced Micro Devices, Inc.', 4098, 'gfx1100', 'OpenCL 2.0 '),
  ('v1', 'Advanced Micro Devices, Inc.', 4098, 'gfx1100', 'OpenCL 2.0 ')
]
>>>
```

There was no way to tell them apart.  I needed my code to only run on my 7900 XTX and not on the iGPU, and this caused the filtering my code was doing on `device.name` to not work since I had no way to tell the devices apart.

## The Cause + The Fix

It turns out that I had exported the environment variable `HSA_OVERRIDE_GFX_VERSION=11.0.0`.  I did this to support [building a custom TensorFlow package](https://cprimozic.net/notes/posts/setting-up-tensorflow-with-rocm-on-7900-xtx/) that works on the 7900 XTX with ROCm 5.5.

> It turns out that setting that environment variable causes some driver in the stack to pretend that _all_ the devices support `gfx1100` and changes their names as well.

For this OpenCL code, I wasn't using TensorFlow and so didn't need to export that anymore.  I expect that in the near future, that hack won't be necessary anymore anyway.

`unset`ting that environment variable fixed the problem, and my cards are now properly identified by OpenCL again.
