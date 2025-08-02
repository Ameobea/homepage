+++
title = "Fixing Google Chrome Using Wrong GPU on Linux"
date = "2025-08-01T19:53:24-05:00"
+++

Well, here's another chapter in the saga of graphics and GPU issues with Google Chrome on Linux.

I have a 7900 XTX GPU, and I think at least part of these issues are a result of AMD GPU drivers being pretty messed up on Linux.

## The Problem

One day after updating my packages and rebooting my system, WebGL web apps were running at very low FPS in my Google Chrome browser.  It was _really_ slow - like sub-10 FPS when I usually get 165.

## The Cause

After some debugging, I realized that my integrated GPU was being used instead of my dedicated GPU.  I figured this out using the `radeontop` application, which has an argument to pick which GPU you're recording performance for.  My integrated GPU had zero usage, but the integrated GPU was maxed out.

## The Fix

I eventually noticed this line in the output from the `google-chrome` process:

`[14533:14533:0801/194836.930457:ERROR:ui/ozone/platform/wayland/gpu/wayland_surface_factory.cc:233] '--ozone-platform=wayland' is not compatible with Vulkan. Consider switching to '--ozone-platform=x11' or disabling Vulkan`

I then tried launching Chrome with this argument:

```txt
google-chrome --ozone-platform=x11
```

And that fixed the problem.  It went back to using my discrete GPU and WebGL performance went back to normal.

I use Wayland for my desktop environment.  I don't know why this is necessary, but whatever I guess.

I do have Vulkan enabled in `chrome://flags` but that's required for me to avoid other issues I get with my max FPS getting limited.

Note that I tried setting "Preferred Ozone platform" to X11 in `chrome://flags` but it had no effect.  The fix only worked when using the argument when launching Chrome.

Anyway, this exact of flags and configs makes Chrome work well for me on my system.  I dread the day when one something gets changed to break this delicate balance.
