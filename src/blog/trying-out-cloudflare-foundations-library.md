---
title: "Trying Out Cloudflare's `foundations` Library for Rust"
date: '2024-03-06'
---

A couple of months ago, I happened across the [announcement blog post](https://blog.cloudflare.com/introducing-foundations-our-open-source-rust-service-foundation-library) from Cloudflare for their newly released [`foundations`](https://github.com/cloudflare/foundations) library for Rust services.  It looked very useful and interesting, and I mentally marked it down as something I'd check out when a good opportunity came up.

Well, that opportunity recently came around, so I went ahead and tried it out!  I set up a small, self-contained, green-field Rust project from scratch built with `foundations` from the very beginning.  That service is now running in successfully in production, and I feel like I can give some informed thoughts about `foundations` and what it's like to use it in practice.

## Background + Overview

<div class="note padded">
At a high level, <code>foundations</code> is a modular set of tools and utilities for building networked services/microservices in Rust.
</div>

The idea is to provide a re-usable and common toolkit containing the common pieces of functionality you'll need again and again when building server-side applications in Rust.  These include things like logging, metrics, tracing, security, settings, and more - a full list is available in their well-written [docs](https://docs.rs/foundations/latest/foundations/).  There are a few modules that have some support for working on the client side, but largely the focus is on server-side applications.

Rather than providing a monolithic application platform or protocol-specific framework, its features are mostly independent and are set up manually by the programmer.  There's nothing in `foundations` for things like HTTP servers or gRPC endpoints; it's all a bit more granular than that.

## Initial Impressions + Observations

One of the first things I noticed while using this library was that

<div class="good padded">
<code>foundations</code> really is extremely modular and doesn't lie about being incrementally adoptable in existing codebases.
</div>

Every individual piece of functionality in the library is neatly split up and exposed behind a variety of well-documented feature flags.  I opted to disable all the default features and explicitly opt-in to all the functionality I wanted one by one.  While doing this, I was impressed by how I ran into no compilation issues or other problems while setting it up.

I've worked with feature-flagged code in Rust in the past, and it's very easy to introduce compilation failures or incompatibilities with certain combinations of feature flags.  `foundations` has theirs set up very well, though, and I had no issues like that at all.

<div class="note padded">
Another thing I noticed is that <code>foundations</code> seems somewhat slanted towards enterprise use-cases compared to standalone applications or side projects.
</div>

Some of the features like tracing, syscall sandboxing, and others are mostly useful for larger dev teams maintaining dozens-hundreds of services.  That being said, I thing `foundations` is still very useful for smaller projects or solo developers (like I was for this project).  The previously mentioned modularity means you if one of the features isn't useful to you, you can easily choose to just not use it.

## Settings + CLI

One of the first things I set up with `foundations` was its settings file support.  This is for things like runtime parameters or config values.  `foundations` handles auto-generating a YAML file from your settings spec that will be loaded at runtime.

The code for setting that up for my application looks like this:

```rs
#[settings]
pub(crate) struct ServerSettings {
  /// Telemetry settings.
  pub(crate) telemetry: TelemetrySettings,

  /// Port that the HTTP server will listen on.
  #[serde(default = "default_u16::<4510>")]
  pub port: u16,
  /// Osu! OAuth client ID
  pub osu_client_id: u32,
  /// Osu! OAuth client secret
  pub osu_client_secret: String,
}
```

And generates a YAML file that looks like this:

```yml
---
# Telemetry settings.
telemetry:
  # <... many auto-generated settings for `foundations` telemetry ...>
# Port that the HTTP server will listen on.
port: 4510
# Osu! OAuth client ID
osu_client_id: 0
# Osu! OAuth client secret
osu_client_secret: ""
```

Overall, it all made sense and setting it up was pretty easy.  As you can see, I had quite minimal needs for settings for my application, and it all worked as expected out of the box.

It makes use of `serde`, so all of the settings must be de/serializable.  This also leads to my main complaint about the settings module:

<div class="bad padded">
Setting default values for settings is pretty clunky and not supported out of the box.
</div>

For many settings, I I ended up pulling in a helper crate called [`serde_default_utils`](https://docs.rs/serde_default_utils/latest/serde_default_utils/) to accomplish that.  Another option is to manually implement `Default` for your settings struct and provide defaults for all fields explicitly.

The only other complaint I had is that

<div class="bad padded">
Settings can't be set/overridden by environment variable
</div>

This is more of an opinion, and I know there are people out there that dislike the use of environment variables for settings, but I personally find that it's often a very useful feature to have.

There's an [open issue](https://github.com/cloudflare/foundations/issues/21) suggesting adding support for environment variable support in settings, and the library authors seem open to adding it, so there's a decent chance this support will come in the future.

## Logging

## Telemetry

### Metrics

### Tracing

https://github.com/cloudflare/foundations/issues/9#issuecomment-1938596027

## Other Components
