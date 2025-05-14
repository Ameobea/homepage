+++
title = "Fixing Google Chrome WebGL Low Frame Rate After Turning Monitors Off on Linux"
date = "2025-05-14T15:00:57-05:00"
+++

## The Problem

I have two monitors: my main one at 165hz and a side monitor at 60hz. When I first boot up my computer, I'm able to run web-based games and visualizations at full 165hz on my main monitor.

However, after I turn my monitors off for the night and then get back on the next morning, all my WebGL-based applications are locked to 60 FPS or lower (and they feel stuttery and generally worse than even what I'd expect from stable 60 FPS)

### Attempted Fixes

I've tried closing all chrome windows/tabs and re-starting it, tried using a different version of chrome (google-chrome-unstable and I even tried Microsoft Edge), tried launching chrome with a variety of different flags and settings, but nothing works. The only fix is to log out and log back in from scratch, which is a hassle since I have to set everything back up.

I'm running Wayland. If I log in with X, then things run at like 40FPS average from the start. I'm using an AMD GPU with amdgpu drivers.

Other non-browser graphics apps work fine and run at the correct frame rate. Firefox doesn't have this particular issue, but there are other issues I run into with input handling among other things that make me really want to avoid using it here unless necessary.

I tried launching Chrome with a variety of different flags including various combinations of `--ozone-platform=wayland`, `--enable-features=UseOzonePlatform`, `--use-angle=gl`, and `--enable-features=VaapiVideoDecodeLinuxGL` but all of these resulted in either no change or complete loss of hardware acceleration for WebGL.

## The Real Fix

**After messing around for a while, I discovered that I could fix the problem entirely by enabling Vulkan in the Chrome settings via <chrome://flags/>**:

![A screenshot of the Google Chrome settings showing the Vulkan option toggled to enabled.](https://i.ameo.link/d1h.png)

I could have sworn that this was broken in the past so I wasn't able to do it, but now it works fine and completely fixed my issue.
