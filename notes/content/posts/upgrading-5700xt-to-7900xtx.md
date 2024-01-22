+++
title = "Upgrading from a 5700 XT to 7900 XTX on Linux"
date = "2023-06-07T22:06:45-07:00"
+++

Just today, I switched to the 7900 XTX GPU. I mostly just wanted an upgrade, but I also secretly hoped it would fix a lot of the weird GPU-related issues I've had over the past years.

The 5700 XT is a rather buggy GPU as far as I can tell - especially on Linux which is my only OS on my desktop. I've run into [multiple](https://gitlab.freedesktop.org/drm/amd/-/issues/2173#note_1595510) [bugs](https://gitlab.freedesktop.org/drm/amd/-/issues/1915#note_1597223) with drivers and other mysterious green-screen crashes:

![Photo of a computer with three monitors.  Two of the monitors are entirely green, and the rightmost monitor is black.  The monitors are on a black desk, there's a window with the blinds closed behind it, and there are some art prints on the wall along with one on the desk.](https://i.ameo.link/azq.jpg)

I opted to go for another AMD card rather than switch to NVIDIA despite the crashes. I had decent reason to believe that the crashes were mostly limited to teh 5700 family cards, and I hoped that the 9000 series would be safe. The card is quite close in performance to the comparable NVIDIA card, but a couple hundred dollars cheaper.

## Results

> This turned out to be the easiest ~~and most successful~~ GPU upgrades I've ever done. ~~No issues whatsoever so far.~~

~~There were zero issues through the whole thing. I actually replaced my computer's PSU as well with a 1000 watt unit, and even with that it all went perfectly.~~

There were _zero_ software changes I needed to do. I rebooted it after installing the new card and everything worked perfectly. No driver issues at all, ~~no crashes so far~~, 10/10.

My [radeontop](https://github.com/clbr/radeontop) doesn't know what model the card is, but it works just fine for measuring its utilization.

![Screenshot of radeontop output in a terminal for 7900 XTX GPU.  Shows the card name as UNKNOWN_CHIP bus 03 with some bars, utilization percentages, and values for things like Graphics Pipe, Vertex Group + Tesselator, Texture Addresser, etc.](https://i.ameo.link/b6i.png)

So yeah - here's to hoping the driver bugs and crashes don't come back at some point in the future, but I'm very happy with everything so far.

---

> EDIT 2023-06-18:
>
> I've been getting blackscreen crashes and kernel panics. They mostly tend to happen when I'm AFK, but still very annoying and an issue for sure.
>
> One is a very specific issue that seems to happen only if you have >=2 monitors plugged in that have significant differences between them in frame rate and/or resolution: <https://gitlab.freedesktop.org/drm/amd/-/issues/2609>
>
> The black-screen no-log full computer reboots are still happening as well. No idea what's causing them.

> EDIT 2023-08-15:
>
> Well, I did a few `sudo apt full-upgrade`s and reboots later, and... my crashes just stopped!
>
> I don't know what happened, but for the past ~month I've not had a single driver crash even with heavy gaming in an 85 degree Fahrenheit apartment.
