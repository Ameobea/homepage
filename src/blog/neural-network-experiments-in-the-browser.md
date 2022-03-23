---
title: 'Experimenting with Basic Neural Network Topologies in the Browser'
date: '2022-03-22'
---

While teaching myself the basics of neural networks, I was finding it hard to bridge the gap between the foundational theory and a practical "feeling" of how neural networks function at a fundamental level.  I learned how pieces like gradient descent and activation functions worked and even played with building and training some networks in a [Google Colab](https://colab.research.google.com/) notebook.

Modern toolkits like Tensorflow handle the full pipeline from data preparation to training to testing and everything else you can think of - all behind high-level, well-documented APIs.  The power of these tools is obvious.  Anyone can load, run, and experiment with state of the art deep learning architectures in GPU-accelerated Python notebooks instantly in the web browser.  Even implementations of bleeding-edge research papers are readily available - you can even run them with your own data.  Powerful visualizations of every stage of the process are instantly available with [TensorBoard](https://www.tensorflow.org/tensorboard), tuned to whatever particular model you're working with.

![A screenshot of Tensorboard from an online demo showing the TensorBoard UI and some a plot of loss over different epochs during a training run](images/neural_network_from_scratch/tensorboard.png)

## The Problem

Despite the richness of the ecosystem and the incredible ergonomics of the tools, I felt like I was missing a core piece of the puzzle in my understanding.  On one side, there are the very abstract concepts built on calculus and matrix multiplication which provide the underlying mechanism for how neural networks function.  On the other end, there are the extremely high-level software suites used to build neural networks for practical and research purposes.

I come from a software background, and when I was learning how compilers and code generation worked one of my favorite tools was and still is [Compiler Explorer](https://godbolt.org/) aka Godbolt.  It's a web application where you can type in any code you want in a variety of compiled languages, choose a compiler and compilation options, and instantly view the generated assembly for a wide range of different hardware architectures.

I find this tool to be unparalleled for learning how compilers work and understanding what kinds of assembly get generated for different kinds of code input.  It's dynamic and responds instantly as soon as you poke it.  It's an environment for experimentation rather than a static knowledge resource.  Crucially, it provides a visual mapping between the two sides of the extremely complex transformation taking place under the hood.

![A screenshot of Godbolt showing line-by-line mappings of a Rust function into x86 assembly code](images/neural_network_from_scratch/compiler_explorer.png)

> This is what I wanted for neural networks: A constrained, simplified environment for experimenting with basic network topologies and experimenting live to see _visually_ how different layer counts, sizes, activation functions, hyperparameters, etc. impacted their functionality and performance.

## My Attempt at a Solution

With this goal in mind, I set out to try to build something that could vaguely approach the kind of experience I had playing with Godbolt.  I had just invested a bunch of time learning how neural networks work from the ground up, so I figured it would be a good way to exercise that knowledge a bit if nothing else.

<iframe src="http://localhost:7000/" loading="lazy" style="position: relative; height: calc(min(800px, 80vh)); width: 100%; outline: none; border: none;"></iframe>

TODO: Explain the premise of the tool (input data and output functions that are modelled)

### Learnings + Observations

 * Using ReLU is by far the fastest for training.  This makes a lot of sense due to how incredibly simple it is.
 * When using ReLU as activation function for the output layer, learning rate needs to be set incredibly low in order for the model to not diverge.  As we add more layers, the effect is compounded.  This makes sense since ReLU is more or less linear for positive values; values need to be carefully balanced to make outputs fit the expected range of 0-1.  Using a nonlinear activation function for the output layer like sigmoid makes things a lot easier since values get clamped at the limits of the range.
 * Slowly reducing the learning rate while training can greatly benefit the fitness of

### Technical Implementation

TODO

 * Rust + Wasm with SIMD
 * Web workers + Comlink so training can happen on another thread and not block the renderer
 *

## Limitations

 * Examples are fed in one by one rather than in batches.  This is just a limitation of my implementation of the neural network's training; training efficiency and performance can often be greatly improved by using batches.
 * Since the target functions are so simple, most of these networks are heavily overfitting the target functions.  For real applications, the inputs and outputs often have orders of magnitude more dimensions which is where bigger and deeper networks shine.

TODO

## Other Useful Tools

Probably mention that we'll talk about this later somewhere earlier on in the intro of the article

TODO
