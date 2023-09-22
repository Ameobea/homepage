+++
title = "Fixing \"Could Not Load Openssl\" Mastodon Build Error"
date = "2023-09-22T11:15:03-07:00"
+++

While trying to update [my Mastodon server](https://mastodon.ameo.dev/) to the latest v4.2.0 release, I kept running into build failures when running `docker-compose` build.  I got errors like this in the logs:

```txt
#20 27.04 Bundler 2.4.10 is running, but your lockfile was generated with 2.4.13. Installing Bundler 2.4.13 and restarting using that version.
#20 27.21 There was an error installing the locked bundler version (2.4.13), rerun with the `--verbose` flag for more details. Going on using bundler 2.4.10.
#20 27.29 Could not load OpenSSL.
#20 27.29 You must recompile Ruby with OpenSSL support.
```

It was very confusing since the official CI builds seemed to be working fine.  Nevertheless, there were [multiple](https://github.com/mastodon/mastodon/issues/26888) [issues](https://github.com/techulus/push-github-action/issues/8) opened about this, so it's something people were running into.

I bisected this build issue to commit https://github.com/mastodon/mastodon/commit/b749de766f5a6158fd0b5f3c3201943083fc7979 which bumps the tag of the Docker `node` image from Debian bullseye to bookworm.

I dug into it further.  I tried to repro the build failure on my desktop, but it works there; it only fails when building on the server on which I run my Mastodon instance.

**After more investigation, I found that the hashes of the `ruby-jemalloc` image used by the build process are different between the server and my local desktop**

Server:

```
[
    {
        "Id": "sha256:c9d180a360e5d39e463cbb202eb10bc4e6d44af3f6ba53fbd26874027aea9ec9",
        "RepoTags": [
            "ghcr.io/moritzheiber/ruby-jemalloc:3.2.2-slim"
        ],
        "RepoDigests": [
            "ghcr.io/moritzheiber/ruby-jemalloc@sha256:9f452d67da4ffdc9abc103015ca447f442d324946a78cefcea9d35f558ce9a93"
        ],
        "Parent": "",
        "Comment": "buildkit.dockerfile.v0",
        "Created": "2023-06-05T07:47:27.743594335Z",
```

Desktop:

```
[
    {
        "Id": "sha256:6bebe65ca9cf60a9d55145104943af2493c46a593c36d9ada11f0940db7a280e",
        "RepoTags": [
            "ghcr.io/moritzheiber/ruby-jemalloc:3.2.2-slim"
        ],
        "RepoDigests": [
            "ghcr.io/moritzheiber/ruby-jemalloc@sha256:9a1487af836fada451d706b4b9b4f17a42e82cab5bcef1d77cb577134473f9a6"
        ],
        "Parent": "",
        "Comment": "buildkit.dockerfile.v0",
        "Created": "2023-09-18T09:01:47.627305986Z",
```

My guess is that whoever maintains that `ruby-jemalloc` image force-pushed a new version of the package to the same tag.  My server has the old version cached, and my desktop picked up the new one.

## The Fix

I ran `docker image rm ghcr.io/moritzheiber/ruby-jemalloc:3.2.2-slim` on the server.  This cleared out that old stale `ruby-jemalloc` image, re-fetched the new one, and fixed my build.

So yeah - there's a workaround for that @NahNick and @CSDUMMI.  The issue isn't technically on mastodon's side, and it should go away the next time they upgrade their ruby version (as long as the `ruby-jemalloc` maintainer doesn't do this again in the future).
