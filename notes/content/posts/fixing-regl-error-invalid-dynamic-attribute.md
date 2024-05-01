+++
title = "Fixing `regl` Error Invalid Dynamic Attribute"
date = "2024-05-01T01:43:06-07:00"
+++

Recently when working with the [`regl`](https://github.com/regl-project/regl) WebGL wrapper library, I encountered a weird error that I didn't understand the cause of:

`(regl) invalid dynamic attribute "position" in command`

I checked my code, and I was indeed passing a `position` attribute and the data array I was using to construct the buffer looked correct.  The error also happened intermittently, happening after my application hot-reloaded.

## The Cause

It turns out that I had accidentally created two `regl` instances and was trying to use buffers allocated on one with commands created on a different one.

When my app hot-reloaded, it was incorrectly creating a new instance for the command while re-using the old buffers.

## The Fix

I corrected the issue that was causing duplicate `regl` instances from getting created, and the error went away and my app worked again!

It was a bit tricky to figure out due to the rather vague error message, though.
