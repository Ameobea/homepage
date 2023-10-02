+++
title = "Fixing `HSA_STATUS_ERROR_OUT_OF_RESOURCES` Error with Stable Diffusion"
date = "2023-10-01T22:45:34-07:00"
+++

I've been using Stable Diffusion XL via the Automatic1111 web UI to generate PBR textures for use in my Three.JS projects, as [I've written about previously](https://cprimozic.net/notes/posts/generating-textures-for-3d-using-stable-diffusion/).  Everything was going great until at random, the generation started crashing at 100% and I got this error in my console:

`:0:rocdevice.cpp            :2786: 58285575154 us: 154003: [tid:0x7f59ee1216c0] Callback: Queue 0x7f583ec00000 Aborting with error : HSA_STATUS_ERROR_OUT_OF_RESOURCES: The runtime failed to allocate the necessary resources. This error may also occur when the core runtime library needs to spawn threads or create internal OS-specific events. Code: 0x1008 Available Free mem : 13386 MB
./webui.sh: line 254: 154003 Aborted                 (core dumped) "${python_cmd}" "${LAUNCH_SCRIPT}" "$@"`

My GPU didn't seem to be close to running out of memory, I hadn't changed anything notable with my system or with stable diffusion; I was stumped.

I tried several things which didn't work:

 - Updating ROCm from 5.5 to 5.7
 - Rebooting my computer multiple times
 - Closing all other running applications
 - Disabling all my stable diffusion extensions and resetting all settings to default

## The Solution

What finally fixed it was pulling the latest automatic1111 stable diffusion web UI and using that.  I'm now able to generate images without issue again.

So yeah - if you're getting this issue or one like it, pulling the latest code for that and see if it fixes it.
