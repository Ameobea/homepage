---
title: "Growing Bonsai Networks with RNNs"
date: '2023-07-23'
opengraph: "{\"image\":\"https://i.ameo.link/ba9.png\",\"description\":\"A summary of my research and experiments on growing sparse computational graphs by training small RNNs. This post describes the architecture, training process, and pruning method used to create the graphs and then examines some of the learned solutions to a variety of objectives.\",\"meta\":[{\"name\":\"twitter:card\",\"content\":\"summary_large_image\"},{\"name\":\"twitter:image\",\"content\":\"https://i.ameo.link/ba9.png\"},{\"name\":\"og:image:width\",\"content\":\"2262\"},{\"name\":\"og:image:height\",\"content\":\"1850\"},{\"name\":\"og:image:alt\",\"content\":\"A visualization of a sparse computational graph pruned from a RNN. Square nodes represent neurons and circles are states from the previous timestep. Nodes and edges are according to their current output with blue being negative and red positive.\"},{\"name\":\"twitter:image:alt\",\"content\":\"A visualization of a sparse computational graph pruned from a RNN. Square nodes represent neurons and circles are states from the previous timestep. Nodes and edges are according to their current output with blue being negative and red positive.\"}]}"
---

<div style="text-align: center; margin-top: 20px; margin-bottom: -20px;">
<img style="max-width: 580px; width: 100%;" src="https://i.ameo.link/bbf.webp" alt="A screen recording of a visualization of a sparse computational graph pruned from a RNN. Square nodes represent neurons and circles are states from the previous timestep. Nodes and edges are according to their current output with blue being negative and red positive. The colors of the nodes and edges change as the values of the inputs change each timestep.">
</div>

This post contains an overview of what I'm calling **Bonsai Networks** - extremely sparse computational graphs produced by training and pruning RNNs.

I give an overview of the process I use to create these networks which includes several custom neural network components and a training pipeline implemented from scratch in Tinygrad. I also include some interactive visualizations of the generated graphs and reverse engineer some interesting solutions they learned for a variety of logic-based programs.

## Background

My original inspiration for working on this project came after reading a blog post called [Differentiable Finite State Machines](https://google-research.github.io/self-organising-systems/2022/diff-fsm/).  The post lays out a strategy for directly learning state machines to represent binary sequences.  The FSMs are learned using gradient descent in a similar way to how neural networks are trained, hence the "differentiable" part of the title.

I was very inspired by this research, and it got me thinking about what other things were possible for to represent small programs with neural networks.  I have a big interest in ML interpretability, and I've done [some work](https://cprimozic.net/blog/reverse-engineering-a-small-neural-network/) on reverse engineering small neural networks in the past.

At some point, I had the idea of trying to extend the ideas from the FSM post to full-fledged RNNs.  That got me started on the path that eventually led to this project and writeup.

## Custom Neural Network Components

Creating these ended up being quite a challenge.  It turns out that training small networks is actually quite a lot harder than training large ones (to a point).

The design goals of the RNNs I trained are quite different from those of RNNs used for conventional purposes.  In order to get good results with creating these bonsai networks, I needed to implement some custom components and architectures for their training.

### Activation Function

The usual activation functions used when training neural networks - functions like sigmoid, ReLU, tanh, etc. - are usually quite simple.  For large, deep networks like the vast majority of those trained today, they're a great choice.  Neural networks are great at composing complex solutions out of these simple functions, building up more and more sophisticated internal representations over dozens of layers.

There's no rule saying that the activation function has to be simple, though.  Technically, any differentiable non-linear function will work.  For my purposes here, I wanted to pack as much computational power into the function as possible without making it impossible to train or numerically unstable.

I ended up using a custom activation function which looks like this:

<iframe src="https://nn-logic-demos.ameo.dev/activationPlot.html?interpolatedAmeo=1" class="iframe-mobile-scale" loading="lazy" style="display: block; outline: none; border: 1px solid rgb(136, 136, 136); box-sizing: border-box; width: 430px; overflow: hidden; height: 370px; margin-left: auto; margin-right: auto;"></iframe>

I developed this activation function around a year ago as part of some [earlier research](https://cprimozic.net/blog/boolean-logic-with-neural-networks/#designing-a-new-activation-function) into using neural networks to perform boolean logic.  It has some unique properties which make it very well-suited for this particular use-case:

 * It can solve the *XOR problem* in a single neuron.  In fact, it can actually model [all 2 and 3 input boolean functions](https://cprimozic.net/blog/boolean-logic-with-neural-networks/#results) (like `x ? y : z` etc.) in a single neuron as well.
 * It is well-balanced and has an average output value of 0 across all real numbers
 * It has wide regions where it outputs very nearly -1 and 1.  This makes it less sensitive to quantization and gives a higher percentage of its parameters stable

All of these things contribute to making it very well-suited for modeling the kinds of binary logic programs I was targeting.  However, there are some downsides as well:

 * The complex, spiky derivative makes it more difficult to train using this function compared to conventional alternatives, and it is quite sensitive to initialization of network parameters
 * The piecewise nature of its implementation makes it require a hand-written kernel and manually implemented derivative as well

These certainly created some headaches to deal with, but they were well worth it for the power that this function brings to the table.

### RNN Architecture

Another key modification I made to the RNNs was in their base architecture.  I started out with an extremely simple vanilla RNN modeled after TensorFlow's [`SimpleRNNCell`](https://github.com/keras-team/keras/blob/v2.13.1/keras/layers/rnn/simple_rnn.py).

Here's the architecture that TensorFlow uses for it:

<div style="text-align: center; margin-top: 20px">
<a target="_blank" href="https://i.ameo.link/bax.svg">
<img src="https://i.ameo.link/bax.svg" alt="TikZ-generated visualization of vanilla RNN architecture.  Shows two RNN cells labeled Cell 0 and Cell 1 which are wired together.  Internally, there are nodes for things like kernels and biases, operations like dot product, add, sigmoid, and nodes between them indicating the flow of data through the network." style="filter: invert(0.9); width: 100%; margin-left: 0px; margin-right: 0px; max-width: calc(min(760px, 90vw)); max-height: 840px;">
</a>
</div>

Like all RNNs, each cell has its own internal state which is fed back for the next timestep of the sequence.  In this vanilla architecture, the value passed on as output from the cell is the same as this new state value.

One important thing to note is how the inputs and current state are combined by adding them together before being passed to the activation function.  I believe this is done to help with the vanishing/exploding gradient problem when trading RNNs, but to me it has the effect of glomming up the signals and making the dataflow harder to reason about.

To solve this, I implemented a modified RNN cell architecture:

<div style="text-align: center; margin-top: 20px">
<a target="_blank" href="https://i.ameo.link/bb2.svg">
<img src="https://i.ameo.link/bb2.svg" alt="TikZ-generated visualization of the custom RNN architecture I developed for this project.  Shows a single cell of the custom RNN.  Internally, there are nodes for things like kernels and biases, operations like dot product, add, custom activation function A, and nodes between them indicating the flow of data through the network." style="filter: invert(0.9); width: 100%; margin-left: 0px; margin-right: 0px; max-width: calc(min(600px, 90vw)); max-height: 840px;">
</a>
</div>

It's pretty similar to the vanilla architecture but with a few key differences.  The main thing to note is that the output passed on to the next cell in the chain is now different from the state fed back for the next timestep.

Doing this has a few benefits:

 1. It decouples the state from the output.  It allows distinct representations to be learned for each that can possibly be more concise, aiding in the production of very small and interpretable networks.
 2. The introduction of the second bias vector is useful for the custom activation function which requires rather specific combinations of weights and bias to represent some logic gates and other functions.
 3. It homogenizes the operations used by the network.  Rather than having to add separate operations for the neurons and then the `+` operator that combines the outputs from both dot products, the only used operation is `multiply/accumulate -> activation`.

This last point is especially important for when these networks are converted into graphs.  Every node can be thought of as a single neuron implementing this identical `multiply/accumulate -> activation` operation, making the flow of data and overall operation much easier to follow.

### Sparsity-Promoting Regularizer

One of the most important goals of this project is training networks that are maximally sparse - meaning that as many of their weights are almost exactly zero as possible.  A commonly used technique for encouraging sparsity is the use of **regularizers** during the training process.

Regularizers can be thought of as secondary training objectives.  They are just functions that take a tensor of parameters (weights, biases, or any other trainable data) and return a cost value which is added on to the base loss value computed for the current batch:

$$
Cost = Loss_{base}(y_{actual}, y_{pred}) + \lambda * R(\mathbf{w})
$$

Where $R(\mathbf{w})$ represents the regularization function and $\lambda$ is the regularization coefficient which controls how strongly the regularization is applied.

Decent success can be had by just [using $\text{L}_{1}$ regularization](https://developers.google.com/machine-learning/crash-course/regularization-for-sparsity/l1-regularization), which penalizes weights based on their absolute value.  For larger networks, this often ends up driving weights to zero without any extra effort required.

However, for my case, I wasn't getting much luck.  My best guess for why not is the behavior of the custom activation function.  To represent many logic gates concisely, the activation function needs to use rather large weights.  For my purposes, I didn't want to penalize a weight of 1.5 any more than a weight of 0.1, but $\text{L}_{1}$ regularization has the effect of penalizing the first way more.

So, to accomplish this, I ended up implementing a custom regularization function.  It works by penalizing non-zero weights in the same way as $\text{L}_{1}$ regularization, but it has a sharp cutoff very close to zero at which point it "turns on" and starts penalizing the weight.  Crucially, the penalty goes up extremely gradually as weights get larger so the optimizer has more breathing room to tune existing weights to good values.

Here's the function I came up with:

Let:

$$
\begin{align*}
x & : \text{The tensor being regularized} \\
n & : \text{The number of elements in $x$} \\
t & : \text{The threshold for the regularization} \\
s & : \text{The steepness of the activation} \\
i_T & : \text{The intensity of custom function $T(x)$} \\
i_{L1} & : \text{The intensity of the l1 regularization} \\
\end{align*}
$$

The regularizer $R(x)$ consists of the custom function I developed $T(x)$ combined with standard l1 normalization:

$$
\begin{align*}
T(x) &= \tanh((|x| - t) \cdot s) - \tanh(-t \cdot s) \\
R(x) &= \frac{1}{n} \sum_{j=1}^{n} \left(i_T \cdot T(x_{j}) + i_{L1} \cdot |x_{j}|\right)
\end{align*}
$$

Or, if you like prefer code, here that is:

```py
class SparseRegularizer:
    def __init__(self, intensity=0.1, threshold=0.1, steepness=100, l1=0.001):
        self.intensity = intensity
        self.threshold = threshold
        self.steepness = steepness
        self.y_shift = np.tanh(-self.threshold * self.steepness)
        self.l1_intensity = l1

    def __call__(self, x: Tensor):
        abs_weights = x.abs()
        shifted_weights = abs_weights - self.threshold
        tanh_weights = (shifted_weights * self.steepness).tanh() - self.y_shift

        l1_weight = abs_weights.mean() * self.l1_intensity

        return tanh_weights.mean() * self.intensity + l1_weight
```

Note that it includes a very small amount of vanilla $\text{L}_{1}$ regularization.  I found that this is important to provide a gradient to drive unnecessary weights to zero since the gradient provided by the squooshed `tanh` is so miniscule on its own.

This plot shows the penalty added by the regularizer for different weight values:

<iframe src="http://localhost:3040/sparseRegularizerPlot" loading="lazy" style="display: block; outline: none; border: 1px solid rgb(136, 136, 136); box-sizing: border-box; width: 100%; height: 400px; max-width: 800px; margin-bottom: 10px; overflow: hidden; margin-left: auto; margin-right: auto;"></iframe>

As you can see, the penalty for non-zero weights is essentially the same, so the network can actually optimize for true sparsity rather than just having a bunch of small weights.  However, the small gradient still exists to drive things in the right direction.

### Tinygrad

I implemented all of the custom components as well as the training pipeline itself in a framework called [Tinygrad](https://tinygrad.org/).

Tinygrad is an extremely minimal library which re-implements a modern ML toolkit with GPU-backed tensors, automatic differentiation, optimizers, and more from scratch.  It's under very active development and has gotten a lot of attention in recent months.

The main reasons I chose Tinygrad for this project are as follows:

<div class="good">Tinygrad has out-of-the box support for training on AMD GPUs.</div>

This is important for me since that's what I have available.  I was even able to write a OpenCL kernel for the custom activation function and its derivative, and it worked performantly on the first try.

<div class="good">It's the first library time I felt that I actually had an end-to-end view of the whole chain from high-level Tensor operations in Python to assembly code that runs on my GPU.</div>

For the same reasons I'm interested in AI interpretability, I have a keen interest in understanding how the code I write is compiled and executed.  Compared to the CPU with its rich ecosystem of debuggers, decompilers, and similar tools, the GPU has always felt like a foreign and abstruse realm hidden behind mountains of abstraction to protect us from its alienness.

Thanks to Tinygrad's tiny codebase and developer-focused debugging tools, I can easily print out the generated kernel OpenCL source code or even the raw disassembly for every operation in my network.  It makes the GPU feel like something I can interact with directly and understand natively rather than some opaque "accelerator" that gets magically invoked by "something" 300 layers deep.

## Training

Training these bonsai networks was quite difficult.

To start, I implemented the function I wanted the network to learn in Python so I could generate infinite training data.  I then implemented a basic training loop in Tinygrad to form it into batches and use it to train the network.

I spent many hours tweaking hyperparameters, layer counts and sizes, training data, and every other thing I could think of in an attempt to get nice, small graphs as output.

Even though all the customs stuff helped, the best I could get was graphs like this:

![A screenshot of a computational graph pruned from a RNN.  There are many nodes and tons of overlapping edges giving it a very complex and impossible to follow structure.](./images/bonsai-networks/messy-graph.png)

It was _close_ to being interpretable, but still too messy to really make sense of things.  The breakthrough came when I left a training run going while I left my apartment for a few hours.

### Grokking

Since the networks I was training were quite small, the loss would bottom out quite quickly - usually after ~10-15 minutes of training or less.  At that point, the network would usually have perfect validation accuracy on the target function and I'd stop training and prune it.

<div class="good">It turns out that if you just let the network keep training well after it has perfectly solved the problem, the regularization loss keeps going down very slowly and the network sparsifies itself further and further while still perfectly modeling the target function</div>

When I realized this, the first thing I thought of was [Grokking](https://www.lesswrong.com/posts/N6WM6hs7RQMKDhYjB/a-mechanistic-interpretability-analysis-of-grokking).

Grokking is a phenomenon that is observed when training neural networks where networks will sit at a local loss minima for a significant amount of time and then switch from memorizing data to implementing a general solution.  The hallmark of grokking is a "phase transition" where the model will quite suddenly improve loss on the test set while the training loss remains low.

Although this situation is a bit different, something very similar was going on.  After more experimentation, I determined a set of conditions that were required for that behavior to show up for me:

1. The use of the Adam optimizer
2. Smaller batch sizes
3. Use of the sparsity-promoting regularizer

These are quite similar to the set of conditions [found in the LessWrong post](https://www.lesswrong.com/posts/N6WM6hs7RQMKDhYjB/a-mechanistic-interpretability-analysis-of-grokking#Grokking___Phase_Changes___Regularisation___Limited_Data).

I'm not sure exactly what's going on to cause this behavior.  It's possible that this isn't "true" grokking and there's some other reason that this is happening, but in any case it was the key that allowed me to finally train really sparse networks.

## Pruning

TODO

## Results

TODO

Gated FSM Demo:

<iframe src="https://rnn-temp.ameo.design/gatedFSMDemo.html" loading="lazy" style="display: block; outline: none; border: 1px solid rgb(136, 136, 136); box-sizing: border-box; width: 100%; height: calc(min(740px, 90vw)); margin-bottom: 10px;"></iframe>

TODO

## Conclusion
