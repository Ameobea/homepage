+++
title = "Fixing rust-analyzer to work with `uuid_unstable` for v7 UUIDs"
date = "2023-10-02T20:28:57-07:00"
+++

Recently, one of my coworkers added code that uses v7 UUIDs.  v7 UUIDs are a new type of UUID that contains a timestamp along with randomness, making them useful for DB primary keys and similar things.

However, that code broke my rust-analyzer install for local development.  I already was running rust nightly locally, so there was some other issue.  It said that `Uuid::new_v7()` wasn't a function even though the `v7` feature was enabled for the `uuid` crate and it was at the latest version.

Looking at the code, it seems that the UUID v7 functions are only available if the `uuid_unstable` feature is set:

```rs
#[cfg(all(uuid_unstable, feature = "v7"))]
mod v7;
```

We already had a `.cargo/config.toml` file in our workspace root that had this config in it to enable that cfg item:

```toml
[build]
# required to enable the v7 feature in the uuid crate
# https://docs.rs/uuid/latest/uuid/#unstable-features
rustflags = ["--cfg", "uuid_unstable"]
```

However, rust-analyzer wasn't picking that up and was showing errors in the code during development.

## The Fix

I added these two items to my VS code config:

```json
{
  "rust-analyzer.check.extraEnv": {
    "RUSTFLAGS": "--cfg uuid_unstable"
  },
  "rust-analyzer.cargo.extraEnv": {
    "RUSTFLAGS": "--cfg uuid_unstable"
  },
}
```

After setting those and reloading VS code, rust-analyzer properly finds that function, the error goes away, and I have inline documentation for it as well:

![A screenshot of inline documentation showing up on hover for the `Uuid::new_v7()` function in VS Code while editing some Rust code](https://i.ameo.link/bj4.png)
