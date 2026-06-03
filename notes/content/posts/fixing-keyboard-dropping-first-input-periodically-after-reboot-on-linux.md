+++
title = "Fixing Keyboard Dropping First Input Periodically After Reboot on Linux"
date = "2026-06-03T00:56:20-05:00"
+++

## the problem

Whenever I rebooted my Linux PC, my keyboard would have an issue where the first keypress I input after a period of idleness was ignored.  The RGB lights would also go out in tandem with this.

This was unsurprisingly very annoying.  I could fix it by unplugging and re-plugging the keyboard.  However, having to do that every time I rebooted got tiring pretty quickly.

## the cause

It turns out that **USB auto-suspend was enabled** on my system with a timeout of 2 seconds.  So, after 2 seconds of idleness, the keyboard would go to sleep.

## the fix

It's possible to disable this behavior in a few ways.  You can set a kernel parameter to completely disable it for all USB devices.  However, ideally I'd like to keep this auto-suspend enabled for devices for which it doesn't impact anything.  On my machine, all the USB devices that I want to disable it for are tagged as "HID".

I had an LLM generate a script which sets some udev rules to disable auto-suspend for all USB devices marked as HID.  For me, it worked and the issue went away completely.  I've included it below; use it at your own risk or create your own:

```sh
#!/usr/bin/env bash
set -euo pipefail

RULE_PATH=/etc/udev/rules.d/50-usb-hid-no-autosuspend.rules

if [ "$EUID" -ne 0 ]; then
    echo "Re-running with sudo..."
    exec sudo -- "$0" "$@"
fi

echo "Writing $RULE_PATH"
cat > "$RULE_PATH" <<'EOF'
# Disable USB runtime autosuspend on any device exposing an HID interface
# (keyboards, mice, macropads, tablets, RGB controllers, etc).
# Match the interface, then write to the parent device's power/control via %p.
ACTION=="add|change", SUBSYSTEM=="usb", DEVTYPE=="usb_interface", \
  ATTR{bInterfaceClass}=="03", \
  RUN+="/bin/sh -c 'echo on > /sys%p/../power/control'"
EOF

echo "Reloading udev rules and retriggering existing USB devices..."
udevadm control --reload
udevadm trigger --action=add --subsystem-match=usb
udevadm settle

echo "Sweeping currently-attached HID devices to set power/control=on immediately..."
for dev in /sys/bus/usb/devices/*/; do
    [ -f "$dev/idVendor" ] || continue
    [ "$(cat "$dev/idVendor")" = "1d6b" ] && continue
    for iface in "$dev"*:*; do
        [ -f "$iface/bInterfaceClass" ] || continue
        if [ "$(cat "$iface/bInterfaceClass")" = "03" ]; then
            echo on > "$dev/power/control"
            break
        fi
    done
done

echo
echo "=== Verification: power/control for all non-hub USB devices ==="
printf "%-12s %-7s %-9s %-10s %s\n" "syspath" "control" "runtime" "has_HID" "product"
for dev in /sys/bus/usb/devices/*/; do
    [ -f "$dev/idVendor" ] || continue
    [ "$(cat "$dev/idVendor")" = "1d6b" ] && continue
    has_hid=no
    for iface in "$dev"*:*; do
        [ -f "$iface/bInterfaceClass" ] || continue
        [ "$(cat "$iface/bInterfaceClass")" = "03" ] && has_hid=yes
    done
    printf "%-12s %-7s %-9s %-10s %s\n" \
        "$(basename "$dev")" \
        "$(cat "$dev/power/control" 2>/dev/null || echo -)" \
        "$(cat "$dev/power/runtime_status" 2>/dev/null || echo -)" \
        "$has_hid" \
        "$(cat "$dev/product" 2>/dev/null || echo -)"
done

echo
echo "Expected: every row with has_HID=yes shows control=on."
echo "The udev rule additionally handles future hotplug events."
```
