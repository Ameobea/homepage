+++
title = "Fixing WHEA_UNCORRECTABLE_ERROR Bluescreen with Windows + Linux Dual Boot"
date = "2025-04-15T14:50:19-07:00"
+++

## The Problem

I dual-boot multiple Linux installs along with Windows.  At some point, possibly coinciding with an update to one of my Linux installs, my Windows partition failed to boot with a bluescreen error showing a `WHEA_UNCORRECTABLE_ERROR` error message.  I tried booting multiple times with no success.

Most info I found online about this error seemed to indicate that it was related to hardware issues, but I hadn't made any hardware changes recently and my Linux installs continued to boot and work fine.

## The Fix

My boot setup is a bit unique since the Linux partition I use primarily isn't the one that manages the bootloader.

**To fix the problem, I booted into the Linux install that controls the bootloader and ran `sudo update-grub`.**

After doing that and rebooting, my Windows partition booted and worked fine without any further changes necessary.
