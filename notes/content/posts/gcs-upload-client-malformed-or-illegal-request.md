+++
title = "Fixing GCS REST API Error \"Your client has issued a malformed or illegal request\""
date = "2023-07-01T09:39:30-07:00"
+++

We ran into this error at my job at [Osmos](https://osmos.io/). We upload files to GCS using their [JSON-based REST API](https://cloud.google.com/storage/docs/json_api/v1). Everything was working just fine until we tried uploading a large-ish file of ~2.5GB.

We upload to this API route: `https://storage.googleapis.com/upload/storage/v1/b/bucket-name/o?name=file_name.csv&uploadType=media`

## The Problem

When we tried to upload the data, we got a HTML page as a response with a 400 error code and this unhelpful error message:

```txt
400. That's an error.

Your client has issued a malformed or illegal request.  That's all we know.
```

## The Fix

We were about to fix the issue by adding a `Content-Length` header to the request. It seems that for some requests, it isn't necessary, but it is for others.

The interface that we use to make this request the [`reqwest`](https://docs.rs/reqwest/latest/reqwest/) library from Rust to make the HTTP request. We use a Rust stream as the body, which may contribute to the issue.

For this particular case, we do know the size of the data ahead of time so we can provide the `Content-Length` header accurately. However, for cases where large amounts of data needs to be uploaded to GCS as a stream without a known size ahead of time, I'm not sure what the solution is.
