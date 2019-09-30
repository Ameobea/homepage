---
title: 'Using Rayon for Simple Parallelization of SQL Queries in Rust'
date: '2019-09-30'
---

While working on the API backend for my [Spotifytrack](https://github.com/ameobea/spotify-homepage) application, I encountered a situation where I needed to fetch two separate pieces of data from the database and combine them both into the response. The SQL queries that returned them could sometimes be non-trivial and take nearly a second to complete, and running them both in series was causing a noticeable wait period in the UI while waiting for them to complete. Since there were no dependencies shared between them, ther was no reason that they shouldn't be able to run at the same time. The code looked like this:

```rs
let artist_res = db_util::get_artist_stats(&user, &conn, spotify_access_token)?;
let artist_stats = match artist_res {
    Some(stats) => stats,
    None => return Ok(None),
};

let track_res = db_util::get_track_stats(&user, &conn, spotify_access_token)?;
let track_stats = match track_res {
    Some(stats) => stats,
    None => return Ok(None),
};
```

My first thought when looking to parallelize something is usually to use [rayon](https://github.com/rayon-rs/rayon), an incredibly powerful library that is well-known for how easy it makes safe parallelization. However, I'd only used it in the context of its support for parallel iterators which operate by spawning a threadpool and using work stealing to distribute jobs between the threads. For this use case, I only had two tasks that I wanted to run simultaneously, and converting them into an iterable would require objects of the same type to iterate over. I could have done that by creating an enum with all of the items as variants or boxing them, but that seemed like a suboptimal solution.

## Solution: rayon::join

Then, I found the `rayon::join` function in the docs. To quote from those docs, "Conceptually, calling join() is similar to spawning two threads, one executing each of the two closures. However, the implementation is quite different and incurs very low overhead." Seems just about perfect! Without rayon, my solution would be to spawn two threads, create a channel or a pair of channels to receive their results over, `.join()` them, and pull the results out of the channel. However, Rayon handles all of this transparently. The code that I came up with looks like this:

```rs
let (artist_stats, track_stats) = match rayon::join(
    || db_util::get_artist_stats(&user, conn, spotify_access_token),
    || db_util::get_track_stats(&user, conn2, spotify_access_token),
) {
    (Err(err), _) | (Ok(_), Err(err)) => return Err(err),
    (Ok(None), _) | (_, Ok(None)) => return Ok(None),
    (Ok(Some(artist_stats)), Ok(Some(track_stats))) => (artist_stats, track_stats),
};
```

It's so clean! I can match on the results of both of the results as a single unit and don't have to deal with any of the minutiae of synchronization, sending data between threads, or anything like that. The only other thing I needed to do was create a second database connection, but I would have to do that regardless of what solution I used. Plus, Rocket's neat feature of argument injection via macro meant that all I had to do was add an extra argument of the same type to the route function and the rest was taken care of automatically.

## The Future with async/await

One thing to note is that this whole problem could have been avoided if the database client I was using was asynchronous. If, instead of blocking, the result of those two queries were `Future`s, all that would be necessary would be to [`.join()`](https://docs.rs/futures/0.1.29/futures/future/trait.Future.html#method.join) them and await the response. That would also require the webserver be async as well, however, so I'd need to switch to something like [Actix](https://actix.rs/) from what I'm currently using, [Rocket](https://rocket.rs/). In any case, Rust has a ton of great options for safe and simple parallelization for pretty much every situation.
