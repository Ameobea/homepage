+++
title = "Changing Linux Select to Paste Menu `fcitx` Keyboard Shortcut"
date = "2024-01-16T21:09:46-08:00"
+++

For a long time - at least a couple of years - I've been cursed with an issue on my KDE Plasma Linux desktop where my PgUp key doesn't work.  Instead of scrolling up in my terminal or editor, it pops open a menu with the title "Select to paste" and a listing of my most recent clipboard entries:

![A screenshot of the fcitx menu with the title "select to paste" and a listing of my six most recent clipboard entries](https://i.ameo.link/bt4.png)

I tried briefly a couple of times to fix this and get my page up to work again but to no avail.  Today, I finally figured it out.

## The Cause

I figured out that the menu getting opened is from a project called `fcitx` which is some utility for input handling on Linux.  I found it by doing a code search on Github for the [title of the menu](https://github.com/fcitx/fcitx/blob/master/src/module/clipboard/clipboard.c#L372) - the only identifying information I could see.

The problem remained that I couldn't find the shortcut anywhere in my system settings, though, so I had no idea how to disable it.

## The Fix

After much digging, I finally found a part of the system settings which controlled Fcitx.  Then, hidden two levels deep in sub-menus, I found the "Trigger Key for Clipboard History List" setting which was set to PgUp:

![Screenshot of Linux KDE Plasma system settings for Input Method with the submenu for Addon config -> Clipboard opened showing the setting "Trigger Key for Clipboard History List" which was causing my problems](https://i.ameo.link/bt5.png)

When I hit the "Defaults" button, it restored the shortcut to Ctrl + ; and suddenly I remembered how it got broken in the first place.

I wanted to use the control + semicolon shortcut for VS Code, so I switched the existing shortcut in my settings to something random (PgUp, apparently) and promptly forgot about it.  Then, KDE Plasma must have moved that setting in some system update (or maybe I just missed it all these times).

Anyway, I changed the trigger key shortcut to ctrl + alt + shift + { and the problem is solved for good this time :)
