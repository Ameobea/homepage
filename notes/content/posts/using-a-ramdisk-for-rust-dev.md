+++
title = "Using a Ramdisk for Rust Dev"
date = "2023-06-04T00:43:49-07:00"
+++

The main Rust workspace for my job at [Osmos](https://osmos.io/) is very large.  It has several thousand dependencies, does copious compile time codegen from gRPC protobuf definitions, and makes extensive use of macros from crates like `serde`, [`async-stream`](https://docs.rs/async-stream/latest/async_stream/), and many others.

While it's really convenient having all of our code in one place, this results in a lot of work being done by the Rust compiler as well as `rust-analyzer` during normal development.  For the most part, this isn't too much of an issue.

I'm lucky to have very good hardware for the computer I develop on, but even so compile times and editor features like go to definition can be quite slow at times.

Another thing I worry about is wear on my SSD from the large amount of reads and writes that occur.  The generated intermediate compilation artifacts and output binaries are very large.  Just opening the project up in VS code and saving a file results in ~2.5GB of writes:

![Screenshot of output from the `btm` system monitoring CLI tool.  Shows the current resource usage from several different processes including VS code, rust-analyzer, and cargo.  Shows 2.6GB of disk writes for rust-analyzer.](https://i.ameo.link/b52.png)

I decided to try out using a Ramdisk to speed things up and maybe reduce the amount of disk activity incurred during Rust development.  Luckily, there's a tool that exists which makes it easy called [`cargo-ramdisk`](https://github.com/PauMAVA/cargo-ramdisk).  Installing it was as simple as running `cargo install cargo-ramdisk`, and activating it for a project is as easy as running `cargo ramdisk mount`.

## Results

On the plus side, `cargo-ramdisk` did indeed work to pretty much eliminate disk reads and writes as a result of compilation and development.  Unfortunately, that was pretty much the only advantage for my setup.

There was very minimal reduction in compile time - on the order of a few percent even when doing a full clean `cargo check` of the project.  I do have a very fast SSD, so this may be different for other people.

Another downside is that the build cache is lost every time I restart my computer, so I end up having to wait for all the dependencies to re-compile from scratch whenever I start developing again after a reboot.

The final issue I ran into was the ramdisk getting so big that my computer starts to run out of memory.  This only happened after having the project open for a few consecutive workdays, but it did end up being a problem a few times.

## Conclusion

After trying it out for a couple of weeks, I ended up dropping the ramdisk from my development workflow.  For my specific case, it created more hassle than it solved.  Maybe I'll regret that, though, if my SSD fails in a year or two!

If you have a less-than-amazing SSD and are struggling with high compile times or `rust-analyzer` functionality, `cargo-ramdisk` might be worth checking out.
