+++
title = "Fix for Broken Boot After Failed amdgpu-dkim Install"
date = "2023-06-08T17:35:41-07:00"
+++

I [recently upgraded](https://cprimozic.net/notes/posts/upgrading-5700xt-to-7900xtx/) to the 7900 XTX GPU which was a totally issue-free experience.  Then today, I tried to install [AMD ROCm](https://docs.amd.com/category/ROCm_v5.5) so I could try out [AMD's TensorFlow fork](https://github.com/ROCmSoftwarePlatform/tensorflow-upstream) that works with AMD GPUs.

I ran into a lot of issues with this that resulted in my computer not being able to boot for a while.  I eventually figured it out, but it was quite a struggle.

It started after I downloaded and ran [`amdgpu-install`](https://docs.amd.com/bundle/ROCm-Installation-Guide-v5.5/page/How_to_Install_ROCm.html) - AMD's tool for installing drivers and other software for use with their hardware.

I ran a variety of different commands with that - `sudo amdgpu-install --usecase=rocm`, `sudo amdgpu-install --uninstall`, `sudo amdgpu-install --usecase=graphics,rocm` through different stages of debugging stuff.

The install itself failed because the kernel version needed by the `amdgpu-dkim` component of ROCm (5.x) was different than my Kernel version (6.3) so the module build failed.  `amdgpu-dkim` is a kernel module for amdgpu, and I didn't and still don't really understand how or if it differs from the `amdgpu` kernel module that comes built-in to the kernel.

## Symptoms

At some point, I rebooted my computer.  When I tried to reboot, the boot hung at the `dmesg` output which is displayed before my desktop environment pops up.  I looked into a few red herring errors in the logs that turned out to have nothing to do with the failure to boot.

I eventually figured out a way to get the boot to work: Pressing the "e" key on the grub menu option and adding `nomodeset` to the list of boot args.

Although it did boot and most things worked alright, it was clear that nothing was GPU accelerated.  Only one of my three monitors worked, Xorg had high CPU usage since it was clearly not accelerating anything with the GPU, and `glxgears` was running with software rasterizer.

## The Cause

At some point, I ran `lsmod | grep gpu` to try to figure out if maybe there was some weird alternate kernel module running that was dropped by `amdgpu-install` which was conflicting with the kernel's built-in one.

However, what I saw was that there were _no_ kernel modules at all for `amdgpu`.

## The Fix

After a good bit of googling, I found a [blog post written in Japanese](https://github.com/KeenS/KeenS.github.io/blob/5004f414f38c12c5d05f9d4c191c63232ef7f99b/content/post/Ubuntudeamdgpunodoraibainsuto_runishippaishitaatoGPUgatsukaenakunattatokinotaishohou.md?plain=1#L14) which talks about this exact situation.

> It turns out that when the `amdgpu-dkim` kernel module build fails, a file `/etc/modprobe.d/blacklist-amdgpu.conf` will get created.  This results in the `amdgpu` kernel module getting forced to not load during boot and results in the boot failing (unless the `nomodeset` boot param is set).

After deleting that file, the computer booted normally.

I've given up on getting ROCm working for now, but might give it another go in the future.  I have a hope that it will maybe work without installing the kernel module which caused all of these issues, but we'll see!
