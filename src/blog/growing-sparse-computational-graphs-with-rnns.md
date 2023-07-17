---
title: "Growing Sparse Computational Graphs with RNNs"
date: '2023-07-16'
opengraph: "{\"image\":\"https://i.ameo.link/ba9.png\",\"description\":\"A summary of my research and experiments on growing sparse computational graphs by training small RNNs. This post describes the architecture, training process, and pruning method used to create the graphs and then examines some of the learned solutions to a variety of objectives.\",\"meta\":[{\"name\":\"twitter:card\",\"content\":\"summary_large_image\"},{\"name\":\"twitter:image\",\"content\":\"https://i.ameo.link/ba9.png\"},{\"name\":\"og:image:width\",\"content\":\"2262\"},{\"name\":\"og:image:height\",\"content\":\"1850\"},{\"name\":\"og:image:alt\",\"content\":\"A visualization of a sparse computational graph pruned from a RNN. Square nodes represent neurons and circles are states from the previous timestep. Nodes and edges are according to their current output with blue being negative and red positive.\"},{\"name\":\"twitter:image:alt\",\"content\":\"A visualization of a sparse computational graph pruned from a RNN. Square nodes represent neurons and circles are states from the previous timestep. Nodes and edges are according to their current output with blue being negative and red positive.\"}]}"
---

<div style="text-align: center; margin-top: 20px; margin-bottom: -20px;">
<img style="max-width: 500px; width: 100%;" src="https://i.ameo.link/bao.webp" alt="A screen recording of a visualization of a sparse computational graph pruned from a RNN. Square nodes represent neurons and circles are states from the previous timestep. Nodes and edges are according to their current output with blue being negative and red positive. The colors of the nodes and edges change as the values of the inputs change each timestep.">
</div>

My original inspiration for working on this project came after reading a blog post called [Differentiable Finite State Machines](https://google-research.github.io/self-organising-systems/2022/diff-fsm/).  The post lays out a strategy for directly learning state machines to represent binary sequences.  The FSMs are learned using gradient descent in a similar way to how neural networks are trained, hence the "differentiable" part of the title.

I was very inspired by this research, and had the idea of trying to extend the ideas to work with full-fledged RNNs.  That got me started on the path that eventually led to this!

## Overview

TODO

## Custom Neural Network Components

TODO

### Activation Function

I developed this activation function around a year ago as part of some [earlier research](https://cprimozic.net/blog/boolean-logic-with-neural-networks/#designing-a-new-activation-function) into using neural networks to perform boolean logic.

<iframe src="https://nn-logic-demos.ameo.dev/activationPlot.html?interpolatedAmeo=1" class="iframe-mobile-scale" loading="lazy" style="display: block; outline: none; border: 1px solid rgb(136, 136, 136); box-sizing: border-box; width: 430px; overflow: hidden; height: 370px; margin-left: auto; margin-right: auto;"></iframe>

### RNN Architecture

Here's the architecture that TensorFlow uses for its [`SimpleRNNCell`](https://github.com/keras-team/keras/blob/v2.13.1/keras/layers/rnn/simple_rnn.py):

<div style="text-align: center; margin-top: 20px">
<a target="_blank" href="https://i.ameo.link/bax.svg">
<img src="https://i.ameo.link/bax.svg" alt="TikZ-generated visualization of vanilla RNN architecture.  Shows two RNN cells labeled Cell 0 and Cell 1 which are wired together.  Internally, there are nodes for things like kernels and biases, operations like dot product, add, sigmoid, and nodes between them indicating the flow of data through the network." style="filter: invert(0.9); width: 100%; margin-left: 0px; margin-right: 0px; max-width: calc(min(760px, 90vw)); max-height: 840px;">
</a>
</div>

As far as I can tell, this is a pretty standard design for a "vanilla" RNN.  The issue is the

To solve this, I implemented a modified RNN cell architecture:

<div style="text-align: center; margin-top: 20px">
<a target="_blank" href="https://i.ameo.link/bb2.svg">
<img src="https://i.ameo.link/bb2.svg" alt="TikZ-generated visualization of the custom RNN architecture I developed for this project.  Shows a single cell of the custom RNN.  Internally, there are nodes for things like kernels and biases, operations like dot product, add, custom activation function A, and nodes between them indicating the flow of data through the network." style="filter: invert(0.9); width: 100%; margin-left: 0px; margin-right: 0px; max-width: calc(min(600px, 90vw)); max-height: 840px;">
</a>
</div>

It's pretty similar to the vanilla architecture but with a few key differences.  The main thing to note is that the output passed on to the next cell in the chain is now different from the state fed back for the next timestep.

Doing this has two benefits:

 1. It decouples the state from the output.  It allows distinct representations to be learned for each that can possibly be more concise, aiding in the production of very small and interpretable networks.
 2. It homogenizes the operations used by the cell.  Rather than having to add separate operations for the neurons and then the `+` operator that combines the outputs from both dot products, every operation is just multiply + accumulate -> activation.

Additionally, the introduction of the second bias vector is useful for the custom activation function which requires rather specific combinations of weights and bias to represent some logic gates and other functions.

TODO

### Sparsity-Promoting Regularizer

When training neural networks, regularizers are extra penalties that are added on to the loss value given to the optimizer to minimize.  They can be thought of as secondary objectives.

Regularizers are already commonly used to encourage sparsity when training neural networks.  Decent success can be had by just [using $\text{L}_{1}$ regularization](https://developers.google.com/machine-learning/crash-course/regularization-for-sparsity/l1-regularization), which penalizes weights based on their absolute value.  For larger networks, this often ends up driving weights to zero without any extra effort required.

However, for my case, I wasn't getting much luck.  My best guess for why not is the behavior of the custom activation function.  To represent many logic gates concisely, the activation function needs to use rather large weights.  For my purposes, I didn't want to penalize a weight of 1.5 any more than a weight of 0.1, but $\text{L}_{1}$ regularization has the effect of penalizing the first way more.

So, to accomplish this, I ended up implementing a custom regularization function.  It works by penalizing non-zero weights in the same way as $\text{L}_{1}$ regularization, but it has a sharp cutoff very close to zero at which point it "turns on" and starts penalizing the weight.  Importantly, the penalty goes up extremely gradually as weights get larger so the optimizer has more breathing room to tune existing weights to good values.

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

TODO

## Training

TODO

## Results

TODO

<iframe src="http://localhost:3040/loadWeights" loading="lazy" style="display: block; outline: none; border: 1px solid rgb(136, 136, 136); box-sizing: border-box; width: 100%; height: calc(min(740px, 90vw)); margin-bottom: 10px;"></iframe>

TODO

## Conclusion
