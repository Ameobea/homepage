+++
title = "Fix for League of Legends Lutris Mesa DRI Driver \"Not From This Mesa Build\" Error"
date = "2023-06-18T23:22:46-07:00"
+++

## The Problem

I recently updated the packages on my Debian Linux install with `sudo apt upgrade`.

After that, I rebooted and tried to launch League of Legends through [Lutris](https://lutris.net/) as I have hundreds of times.  The client failed to launch with this error printed in the logs:

```
DRI driver not from this Mesa build ('23.1.0-devel' vs '23.1.2-1')
```

## The Cause

I [recently installed AMD ROCm](https://cprimozic.net/notes/posts/setting-up-tensorflow-with-rocm-on-7900-xtx/) using [`amdgpu-install`](https://amdgpu-install.readthedocs.io/en/latest/) so I could do some machine learning with my AMD 7900 XTX GPU.

I installed `amdgpu-install` version `5.5.50500-1`.  This seems to force a specific version of some part of Mesa that's incompatible with the one needed by Lutris, or Wine, or whatever other layer of the arcane Linux Graphics Stack is causing this issue.

## The Fix

I uninstalled ROCm by running:

```sh
sudo amdgpu-install --uninstall
```

I then rebooted, and now I'm back tearing it up on the rift.

I tried installing a newer version of `amdgpu-install`, but that failed with dozens of dependency version conflicts, so it doesn't seem like a viable fix right now.  Hopefully one or the other will be updated to make the versions compatible in the future.

I will re-install ROCm tomorrow when I get in the mood to be a productive human again.
