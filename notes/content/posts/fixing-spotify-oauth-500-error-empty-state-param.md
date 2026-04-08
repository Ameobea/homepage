+++
title = "Fixing Spotify OAuth 500 \"Oops! Something went wrong\" Error"
date = "2026-04-07T21:21:08-08:00"
+++

## The Problem

When trying to complete the OAuth flow for my web app [spotifytrack.net](https://spotifytrack.net/), I started getting sent to an error page with a 500 status code and the following unhelpful message:

```txt
Oops! Something went wrong, please try again or check out our help area.
```

The app had been running successfully for years with no changes to the OAuth configuration. The error was easily reproducible just by visiting the `/authorize` URL directly. It persisted after trying incognito windows, different browsers, different devices, logging out and back in, etc.

Looking at the my service's logs, it seemed to only be affecting my account; other users were still able to complete the OAuth flow and generate tokens successfully. Maybe other accounts were running into it as well, but I couldn't easily tell.

The authorize URL I was using looked like this:

```txt
https://accounts.spotify.com/authorize?client_id=...&response_type=code&redirect_uri=...&scope=user-top-read&state=
```

## The Fix

**The issue was the empty `state` parameter at the end of the URL.**

Spotify's OAuth `/authorize` endpoint apparently can't handle an empty `state` and returns a 500 error. Setting any non-empty placeholder value for `state` makes the flow work as expected.

This is definitely a bug on Spotify's side, but that's the workaround if you run into it.
