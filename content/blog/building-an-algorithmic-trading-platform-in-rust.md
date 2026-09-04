---
title: 'Building an Algorithmic Trading Platform in Rust'
date: '2016-09-29'
---

For almost a year now, I've been working on creating an algorithmic trading platform that I can use to create automated strategies for trading. It started out as an experiment - just a fun little idea that I could explore, but it quickly blew up into a full-scale project into which I've poured hundreds of hours.

I'm currently on [version 4](https://github.com/Ameobea/bot4) of the platform. Versions [1](https://github.com/Ameobea/algobot), [2](https://github.com/Ameobea/algobot_elixir), and [3](https://github.com/Ameobea/algobot3) were completely separate, each one being re-written from scratch and usually using a different language, idea, or design concept than the one before. I learned a lot from these failed attempts and believe that they were an important part of my progress towards what I have now.

# Bot 4 Overview

_If you're more interested in the technical side of how I used Rust to make this all possible, skip to the **Technical** section._

The [current iteration](https://github.com/Ameobea/bot4) of the platform is primarily written in Rust. I chose it because of its admirable qualities of speed and durability, both of which are very important to an automated trading environment.

The platform consists of several interconnected modules that function almost like microservices. The **tick processor(s)** are responsible for processing live data from the market in the form of ticks. Ticks are basically just small pieces of data that are pushed into the platform containing at minimum a timestamp (usually precise to the microsecond), the symbol of the asset, and a bid and ask price. The tick processors listen for these price updates and evaluate a series of conditions that are set by the **optimizer**. If those conditions are met, they take action by opening, closing, or altering a position with the broker.

The **optimizer** is pretty much the brain of the platform. It evaluates data from all kinds of places (raw price updates, indicators, machine learning algorithms, etc.) and uses them to set what conditions should be evaluated on the tick processors.

The last two modules that make up the current platform are the **Spawner/Instance Manager** and the **MM**. The spawner is responsible for keeping track of all running instances and spawning/killing them as needed. It is the entry point of the platform and the first thing it does after initializing is spawn a MM instance.

The MM is the platform's human interface module. It stands for Management/Monitoring and allows the user to do everything from start trading activities, initialize backtests, view the status of the platform, and create charts for the platform's internal indicators and live price information.

These instances communicate with a custom protocol built on top of Redis PubSub and use a PostgreSQL database as a main storage system. The entire system is built to offload computationally expensive operations away from the actual trading systems in order to keep the data->action time as low as possible.

# Technical

One of the most important things I considered when designing this version of the platform was asynchronous programming. Coming from a heavily NodeJS-based background, I was fond of the promise/callback method of programming with blocking operations happening in the background with the application free to do other things while, for example, waiting for the database to respond to a query.

I make extremely extensive use of the [futures-rs](https://github.com/alexcrichton/futures-rs) crate in every aspect of my development here. Everything from database queries to data processing to the inter-modular communication protocol is built on top of futures and designed to be asynchronous.

Futures-rs provides several utility objects that extend the functionality of Futures and Streams to make it easier to use them in specialized situations. For example, `Sender` and `Receiver` function as endpoints in a channel that can be used to communicate data between two threads. They are similar to Rust's traditional mpsc channel but extend Streams making it possible to use them asynchronously. Here's part of my implementation of a function that sends all messages received over a Redis channel through a futures channel:

```rust
/// Returns a Receiver that resolves to new messages received on a pubsub channel
pub fn sub_channel(host: &str, ps_channel: &'static str) -> Receiver<String, ()> {
    let (tx, rx) = channel::<String, ()>();
    let ps = get_pubsub(host, ps_channel);
    let mut new_tx = tx;
    thread::spawn(move || {
        while let Ok(_new_tx) = get_message_outer(new_tx, &ps) {
            new_tx = _new_tx;
        }
        println!("Channel subscription expired");
    });

    rx
}
```

This creates a new channel that accepts Strings and creates an instance of a pubsub listener. It then spawns a new thread that is permanently blocked waiting for messages to be received over the pubsub channel and, after receiving a message, sends it over the channel.

An important thing to note about futures-rs `Sender`s is that messages sent over them must be consumed before another one can be sent. In fact, the `Stream.send()` function consumes the sender, yielding a future that resolves to a new `Sender` once its corresponding `Receiver` has consumed the message. In my code, `get_message_outer()` calls `.wait()` on the future produced from `send()`. `wait()` serves to block the thread until the future resolves which works out fine since the only purpose of the thread is to take on the blocking function calls and asynchronously send the results to the main thread for processing.

---

I use this practice of calling blocking operations in worker threads and communicating their results asynchronously all over my platform. For inter-modular communication, I need to create a timeout that is triggered after a certain amount of time passes. However, all methods of doing that require either the constant polling of a `get_time`-like function or for the thread to be blocked.

To overcome this, I spawn a sort of "timeout server" on a different thread. I keep a handle to it in the form of a Sender which can be used to send timeout requests. The timeout request contains an amount of time to sleep for and a `Oneshot` that is used by the timeout server to signify when the timeout has expired (`Oneshot`s are basically channels that only send on message).

By chaining together futures and offloading blocking operations to worker threads, its possible to create really advanced systems. I'm a huge fan of the futures-rs crate; it's truly integral to my system and makes my goal of asynchronous, high-speed data processing possible.

---

I'll be making more specific, in-depth posts in the future for individual components of the platform. I hope you found this writeup useful, and happy programming!
