+++
title = "Fixing Anker USB Hub Not Connecting to M1 Mac"
date = "2023-11-06T12:02:42-08:00"
+++

I have an Anker USB hub that I use with my work laptop - an M1 Mac Pro. I use it to plug in two USB-A peripherals (mouse and keyboard) as well as to plug in a HDMI monitor. The hub itself connects to my laptop via USB-C. In addition to the hub, I also have a second HDMI monitor, a USB-C internet adapter, wired headphones, and my charging cable connected to the laptop.

![A photograph of an Anker USB hub with two USB-A cables plugged into it in the front as well as an HDMI cable plugged into it in the back.  It has a circular white light on the front right which is illuminated.](https://i.ameo.link/bn2.jpg)

## The Problem

I've been having an issue where the USB hub refuses to connect to the laptop after plugging it in after first setting it up for the day. When I plug the hub into the laptop, nothing will happen for a few seconds. Then, the white circular light on the hub will start blinking indefinitely and the hub will still not connect and none of the peripherals plugged into it nor the monitor are usable.

This happens in spurts of a few days/weeks, seemingly randomly. In the past, I've fixed the problem to repeatedly un-plugging and re-plugging the hub - sometimes several times over the course of 15+ minutes - until it finally decides to connect.

## The Fix

I've since figured out a more consistent fix for this issue.

I plug both the hub and my second HDMI monitor into the right side of my laptop, and the plugs are right next to each other:

![A close-up photograph of a black USB-C cable and a black HDMI cable plugged into the upper right side of an M1 Macbook Pro side by side.  There is a small sliver of monitor with the file tree of VS Code open visible on the right side.](https://i.ameo.link/bn3.jpg)

I figured out that if I disconnect the HDMI cable plugged directly into the laptop and then unplug and re-plug the USB hub, it will almost always connect successfully after less than a minute. Then, I can re-connect the HDMI cable without issue and use both my monitors as well as my external mouse and keyboard with no problems.

I don't know why this happens; it might be some bug with my USB hub, some issue with the M1 Mac itself with my specific peripheral configuration, some static electricity or interference thing going on - who knows. I do know that I've ended up burning multiple hours waiting for this stuff to connect over the past couple of years and I'm happy to have finally figured out a solution.
