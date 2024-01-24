+++
title = "Rust Tonic Request/Response Size Limit Footgun"
date = "2023-06-03T18:26:33-07:00"
+++

I recently encountered a bug in one of our services at my job at [Osmos](https://osmos.io/). Our service is written in Rust and connects to [GCP PubSub](https://cloud.google.com/pubsub) via its gRPC interface.

We were running into errors in our logs like this:

```txt
Error, message length too large: found 5360866 bytes, the limit is: 4194304 bytes
```

The service in question had been running for over 2 years without seeing this issue before, and the message size limits shown are smaller than the PubSub message size cap of 10MB.

## Root Cause

After a good bit of investigation, we discovered that the error message was actually coming from [inside `tonic`](https://github.com/hyperium/tonic/blob/1934825ff52bff26bb88b709aee9ac73d3ea51c0/tonic/src/codec/decode.rs#L184).

`tonic` is a popular Rust gRPC client and server. We use it extensively, including for the GCP PubSub client.

> It turns out that we'd recently upgraded to `tonic` version 0.9. This release included a breaking change that adds size limits of 4MB by default when decoding messages.

This is what was causing the bug. As far as I can tell, these limits are in place to prevent DOS attacks on gRPC servers, so it's probably a good idea to have them. Before, the limits were either very high or nonexistent, so we never ran into this issue in the past.

`tonic` is still on major version 0, so as per semver, minor version bumps can introduce breaking changes. `tonic` did also include this [in their changelog](https://github.com/hyperium/tonic/blob/master/CHANGELOG.md#v090-2023-03-31), so they didn't do anything wrong in this case in my opinion.

That being said, it was a very unexpected break and I figured I'd write this up to maybe show up in search results for other people hitting this issue.

## The Fix

The fix was simple - just specify a higher limits for message decoding and encoding:

```rust
SubscriberClient::new(auth_service)
  .accept_compressed(CompressionEncoding::Gzip)
  // added these two following lines
  .max_decoding_message_size(256 * 1024 * 1024)
  .max_encoding_message_size(256 * 1024 * 1024)
```

## Conclusion

This bug actually made me realize that things have gotten a lot more stable in the Rust async ecosystem since I started using it extensively ~3 years ago.

There used to be lots of showstopping bugs, annoying incompatibilities, and stuff like that. Now, things are stable to the point where bugs like this are out of the ordinary - and this bug wasn't even technically `tonic`'s fault.
