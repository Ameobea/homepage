---
title: 'Creating a Noise Function Compositor'
date: '2017-09-04'
---

![](https://ameo.link/u/4nc.png)

Over the past few months, I've been working on an application designed to create compositions of [noise functions](https://thebookofshaders.com/11/). While looking around for applications or utilities that accomplish this in the manner I envisioned, I couldn't find anything that did what I was looking for so I decided to build it myself!

Before getting into the details of how I built it and the cool technologies I used along the way, **[here's the result](https://noise.ameo.design)** (and **[here's the source code](https://github.com/ameobea/noise-asmjs)**).

It's just an alpha release right now and there are some known bugs/performance issues that need to be worked out, but for the most part everything is working and I'm really happy with the results!

## Application Architecture

First, the tool is implemented as a web application. I make use of Rust compiled into WebAssembly/Asm.JS to do the heavy lifting and have a React-based frontend that allows the user to control it and view the output.

Despite seeming rather simple at first glance, there is actually a large amount of complexity involved. For all of the features and power provided by WebAssembly, there is an equal amount of convolution required to make it play nicely with the Emscripten world and the almighty Browser.

There's a small backend that's also written in Rust using [Rocket](https://rocket.rs/) and [Diesel](https://diesel.rs/) that supports the sharing features. What's cool is that I reuse large parts of the codebase for both the web frontend and the server-side backend which is made possible since they're both written in Rust.

### The Composition Tree

Core to this application is the noise function composition tree itself. Every composition produced by the tool can be represented by a tree of noise functions, combinators, and transformations that defines the way that the various functions' outputs are merged together into a single output.

On the frontend, this tree is stored in a modified form produced by [normalizr](https://github.com/paularmstrong/normalizr) inside [Redux](http://redux.js.org/) and is converted into the visible on the page by a recursive React component. Inside the Rust portions of the application, it's also stored as a tree structure using native Rust structs and enums as well as primitive `NoiseFn`s created using the [noise-rs](https://github.com/brendanzab/noise-rs) library.

![](https://ameo.link/u/4n7.png)

### Composition Format

One of the primary challenges of this project was coming up with a format for representing noise function compositions that could be understood by all parts of the application and modified on the fly. To solve this, I went with a [JSON-based format](https://ameo.link/u/bin/4mc). There are functions to convert and from this format for all parts of the application which allows for data to be exchanged between the different parts with relative ease.

Within Rust, I built up the tree using heap-allocated structs. The core of this scheme is the `CompositionTreeNode`:

```rust
pub struct CompositionTreeNode {
    pub function: CompositionTreeNodeType,
    pub transformations: Vec<InputTransformation>,
}

pub enum CompositionTreeNodeType {
    Leaf(Box<NoiseFn<Point3<f64>>>),
    Combined(ComposedNoiseModule),
}

pub struct ComposedNoiseModule {
    pub composer: CompositionScheme,
    pub children: Vec<CompositionTreeNode>,
}
```

I've implemented `noise-rs`'s `NoiseFn` trait for `CompositionTreeNode` which means that querying the whole tree is as simple as calling the `get()` function for every pixel in the output canvas.

Unfortunately, converting to this format from the JSON representation isn't quite straightforward. In order to parse a definition string into a fully functional composition tree, it needs to be run through two intermediate formats first. That process looks like this:

1. Parse the input definition into a `IrNode` using `serde_json`.
2. Parse the `IrNode` into a `CompositionTreeNodeDefinition`
3. Convert that `CompositionTreeNodeDefinition` into a `CompositionTreeNode`
4. Construct a `CompositionTree` from the root node and register its pointer with the React frontend.

This may seem rather excessive, but let's break it down to see why each step is actually necessary.

An `IrNode` is a 1-to-1 representation of the JSON definition string built up as Rust structs. Here are their definitions:

```rust
#[derive(Clone, Serialize, Deserialize)]
pub struct IrSetting {
    pub key: String,
    pub value: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct IrNode {
    #[serde(rename = "type")]
    pub _type: String,
    pub settings: Vec<IrSetting>,
    pub children: Vec<IrNode>,
}
```

I've used the unstable `try_from` API to implement conversion functions from `IrNode` to `CompositionTreeNodeDefinition` that iterates over all of the root node's children and parses them into definition structs.

Speaking of, here's `CompositionTreeNodeDefinition`:

```rust
#[derive(Debug, Serialize, Deserialize)]
pub enum CompositionTreeNodeDefinition {
    Leaf {
        module_type: NoiseModuleType,
        module_conf: Vec<NoiseModuleConf>,
        transformations: Vec<InputTransformationDefinition>,
    },
    Composed {
        scheme: CompositionScheme,
        children: Vec<CompositionTreeNodeDefinition>,
        transformations: Vec<InputTransformationDefinition>,
    }
}
```

As you can see, the tree structure is preserved but the individual nodes are sorted by type and converted into specialized representations like `InputTransformationDefinition`.

The final step is to convert the `CompositionTreeNodeDefinition` into a proper `CompositionTreeNode` which can be done with a simple `into()`.

Each of the definition structs is built into functional component that's capable of doing the job its name implies. Information about the tree is lost at this stage as the individual noise function definitions (consisting of a function type and array of settings) are consumed to produce a true `NoiseFn`. Consequently, whenever a setting is changed on the frontend, the entire backend node must be rebuilt from scratch.

![](https://ameo.link/u/4n4.png)

## Putting it Together

The real magic happens when you start synchronizing changes to the tree from the frontend to the backend. I use a JS library called `listate` to subscribe to modifications of the tree and sort them into events depending on what kind of event took place.

One problem with this is that some changes are initiated by other changes; side effects. If we immediately committed the preliminary change to the backend without the side effect change, the backend could fail to parse the created definition or, worse, be left in an unstable state.

To get around this, I created a sort of transaction system. The change listener only commits the changes to the backend once it's made sure no side effects take place. This checking is recursive; even if a side effect has side effects, they will all be accounted for and combined into one atomic change that is committed to the backend all at once.

## The Backend

The backend, as I mentioned earlier, is a shallow layer over a MySQL database that exposes a simple HTTP API. This is my third or fourth try working with the Rust+Diesel stack, and I can definitely say that The one cool part, however, is the headless rendering.

Using the same composition tree code used by the WASM frontend, the backend parses provided JSON definitions into native a native Rust and creates a PNG thumbnail of it using the [`image`](https://github.com/PistonDevelopers/image) crate. I then upload the resulting image to my personal image hosting service using [`reqwest`](https://github.com/seanmonstar/reqwest) and store the URL along with the rest of the data into the DB.

_A quick aside about `reqwest`:_ I'm actually **really** happy with that library. No other Rust HTTP client crate that I've seen even comes close to its level of usability; no creating tokio reactors and setting up TLS stacks by hand to send a simple post request! (looking at you `hyper`)

## Conclusion

Anyway, that about wraps it up. This application was **very** fun to work on; WebAssembly is one of my favorite technologies right now and I have high hopes for its future. I was able to set up the project with relatively few hitches and got the same code running in the browser and the server with virtually no extra effort at all.

That being said, developing an application like this is a very involved process. Interfacing with JavaScript or the DOM requires a lot of work and making mistakes is a lot easier. Rust is a great fit for this role; its safety guarantees help to avoid overcome some of the horror involved with your entire universe living inside of JavaScript.

### Future Work

One of the main issues with the application right now is the unresponsiveness experienced while rendering complex compositions. The entire GUI will lock up since the single thread is busy crunching away in the WebAssembly backend.

Web Workers would be a great fit for this, allowing for rendering to move away from the main thread completely and even allow for parallel rendering. To improve performance even further, the canvas could be rendered in pieces and displayed incrementally instead of all at once.

I also plan on playing around with new noise functions, settings, transformations, and composition schemes. I had a thought that a twitter bot spewing out a random noise function composition a day might be pretty cool.

---

Thanks for reading! Please feel free to leave comments below and checkout the project [on Github](https://github.com/ameobea/rust-asmjs)!
