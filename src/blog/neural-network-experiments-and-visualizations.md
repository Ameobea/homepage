---
title: 'Visualizing Neural Network Internals in the Browser'
date: '2022-03-22'
---

<img alt="A 4-second loop of the neural network visualization application training a network, showing both the response of the network as a whole, a cost plot, as well as a visualization of neuron weights and an individual neuron's response plot" src="https://nn.ameo.dev/nn-viz-demo-animation.webp" style="width: 80%; margin-left: auto; margin-right: auto; display: block;"></img>

While teaching myself the basics of neural networks, I was finding it hard to bridge the gap between the foundational theory and a practical "feeling" of how neural networks function at a fundamental level.  I learned how pieces like gradient descent and activation functions worked and even played with building and training some networks in a [Google Colab](https://colab.research.google.com/) notebook.

Modern toolkits like Tensorflow handle the full pipeline from data preparation to training to testing and everything else you can think of - all behind high-level, well-documented APIs.  The power of these tools is obvious.  Anyone can load, run, and experiment with state of the art deep learning architectures in GPU-accelerated Python notebooks instantly in the web browser.  Even implementations of bleeding-edge research papers are readily available - you can even run them with your own data.  Powerful visualizations of every stage of the process are instantly available with [TensorBoard](https://www.tensorflow.org/tensorboard), tuned to whatever particular model you're working with.

![A screenshot of Tensorboard from an online demo showing the TensorBoard UI and some a plot of loss over different epochs during a training run](images/neural_network_from_scratch/tensorboard.png)

## The Problem

Despite the richness of the ecosystem and the incredible ergonomics of the tools, I felt like I was missing a core piece of the puzzle in my understanding.  On one side, there are the very abstract concepts built on calculus and matrix multiplication which provide the underlying mechanism for how neural networks function.  On the other end, there are the extremely high-level software suites used to work with neural networks for practical and research purposes.

I come from a software background, and when I was learning how compilers and code generation worked one of my favorite tools was and still is [Compiler Explorer](https://godbolt.org/) aka Godbolt.  It's a web application where you can type in any code you want in a variety of languages, choose a compiler and compilation options, and instantly view the disassembled output for a wide range of different hardware architectures.

![A screenshot of Godbolt showing line-by-line mappings of a Rust function into x86 assembly code](images/neural_network_from_scratch/compiler_explorer.png)

I find this tool to be unparalleled for learning how compilers work and understanding what kinds of assembly gets generated for different kinds of code input.  It's dynamic and responds instantly as soon as you poke it.  It's an environment for experimentation rather than a static knowledge resource.  Crucially, it provides a visual mapping between the two sides of the extremely complex transformation taking place under the hood.

<div class="note" style="padding-top: 4px; padding-bottom: 4px;">This is what I wanted for neural networks: A constrained, simplified environment for building basic network topologies and experimenting live to see <i>visually</i> how different layer counts, sizes, activation functions, hyperparameters, etc. impact their functionality and performance.</div>

## Neural Network Playground Overview

With this goal in mind, I set out to try to build something that could approach the kind of experience I had playing around in Compiler Explorer.  I created a browser-based tool for building, training, visualizing, and experimenting with neural networks.  Since it runs on the web, I've embedded it directly in this post:

<collapsable-nn-viz defaultexpanded="true"></collapsable-nn-viz>

TODO: Describe

## Learnings + Observations

 * Using ReLU and ReLU-like activation functions is by far the fastest for training.  This makes a lot of sense due to how incredibly simple they are computationally.
 * When using ReLU as activation function for the output layer, learning rate needs to be set incredibly low in order for the model to not diverge.  As we add more layers, the effect is compounded.  This makes sense since ReLU is more or less linear for positive values; values need to be carefully balanced to make outputs fit the expected range of 0-1.  Using a nonlinear activation function for the output layer like sigmoid makes things a lot easier since values get clamped at the limits of the range.
 * Slowly reducing the learning rate while training can help models reach a lower loss by the end of training.  Another thing that sometimes works is increasing the learning rate for short periods of time to help break out of local maxima - but this can just as easily have a negative effect.
 * Networks with more parameters (both wide and deep) seem to require more examples before converging.  This is partially due to the fact that lower training rates are needed to keep them stable during training, but it feels like more than that as well.  I saw some networks that still hadn't converged even after being trained with several million examples.
 * The values that weights + biases are initialized to is critical for training performance and network stability.  Initializing weights or biases all to a constant value rarely seems to be the best option.  This is especially true for activation functions like ReLU which have gradients that behave badly at exactly zero due to the discontinuity at that point.  Additionally, initializing starting weights or biases to values that are too large can cause the training to fail to diverge immediately.
 * Adding more layers can do things that just adding more neurons to a single layer cannot.  This is especially apparent on more complex target functions.  For the "Fancy Sine Thing", a 2-layer network with sizes of 24 and 12 far outperformed a single layer with 128 neurons.  This makes some sense since the number of parameters in a network increases as the product of the count of neurons in adjacent layers.
 * Models have trouble dealing with sharp transitions in multiple dimensions between different domains.  They seems to require more "resources" (layer sizes/counts) to deal with these kinds of features.  They seem to like smoother functions best.

 ![A screenshot of the neural network visualization tool showing how the network has difficulty dealing with sharp multidimensional transitions between different domains of a complex target function.](images/neural_network_from_scratch/multi_dimensional_domain_cutoff.png)

Although experimenting with this tool doesn't give

## Technical Implementation

TODO

 * Rust + Wasm with SIMD
 * Web workers + Comlink so training can happen on another thread and not block the renderer
 *

## Limitations

 * Examples are fed in one by one rather than in batches.  This is just a limitation of my implementation of the neural network's training; training efficiency and performance can often be greatly improved by using batches.
 * Since the target functions are so simple, most of these networks are heavily overfitting the target functions.  For real applications, the inputs and outputs often have orders of magnitude more dimensions which is where bigger and deeper networks shine.
 * Additionally, since these networks are so simple, there are likely differences between how they work compared to huge networks with billions of parameters.  I'd be interested to expand this neural network to support different kinds of input/output data types and sizes to see how the perform.
 * All layers in the tool's networks are densely connected.  Lots of modern networks use sparsely connected layers and other complex layers to help improve performance or enhance the networks' capabilities.

## Other Useful Tools

Probably mention that we'll talk about this later somewhere earlier on in the intro of the article

TODO
