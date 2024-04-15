+++
title = "Fixing Svelte VS Code `e.children.findLastIndex` Is Not a Function"
date = "2024-04-15T16:21:08-07:00"
+++

## The Problem

I recently created a new SvelteKit project using the Svelte 5 preview and kept getting an error at the beginning of every Svelte component:

![A screenshot of VS Code showing an error at the first character of a Svelte file, marked with a red squiggly line.  The error message reads "e.children.findLastIndex is not a function svelte"](https://i.ameo.link/c3g.jpg)

The error was `e.children.findLastIndex is not a function (svelte)`. It was showing up even on the basic SvelteKit skeleton starter project as soon as I added a `<style></style>` block.

## The Fix

I looked around online, and I didn't see anyone having this problem. This led me to believe that it was likely an issue with my local environment or configuration.

I looked in my VS Code configuration and found this line:

```json
{
  "svelte.language-server.runtime": "/Users/casey/.nvm/versions/node/v16.13.0/bin/node"
}
```

I didn't remember setting that or why I did it. However, once I removed it and reloaded my VS Code, the error went away!

So if you're having this issue yourself:

- Check for a config option similar to this in your VS Code settings.json and delete it if you find one
- Try updating your Node.JS to a new version. I'm using version 21.1.0 myself.
