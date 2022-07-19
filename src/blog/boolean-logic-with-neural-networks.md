---
title: 'Solving Boolean Logic with Neural Networks'
date: '2022-07-19'
---

Recently, I was experimenting with building small neural networks for sequence-to-sequence use cases.  My goal was to create a visualization of how the inner state of a RNN changes as it processes inputs - similar to the [browser-based neural network visualization](https://cprimozic.net/blog/neural-network-experiments-and-visualizations/) I built previously.  Along the way, I TODO TODO TODO TODO very exciting and inspiring stuff

I was inspired to explore this area after reading a very interesting blog post called [Differentiable Finite State Machines](https://google-research.github.io/self-organising-systems/2022/diff-fsm/) which gave an overview of using gradient descent to learn FSMs to operate on one-bit strings.  The state machines that were learned by their approach were impressively concise and managed to find optimal solutions in many cases.

For my own work, I wanted to step things up a bit further in terms of complexity.  I wanted to try learning things that would be able to make better use of the greater power and generality of full-fledged neural networks like multiple input/multiple output networks, logic circuits, and maybe even some text generation or signal generation.  RNNs are more than capable of doing all of these things, but I had a constraint of keeping the model small/simple enough that a visualization of it will be intelligible and have a discernable method of action rather than just appear as a random mass of blinking lights.

My initial trails were working quite well.  After some tuning of hyperparameters like learning rate, optimizer, and activation function, I was able to pretty consistently train networks to solve very simple problems like `out[i] = in[i - 1]` or `out[i] = in[i] && in[i - 1]` and do so in the minimum number of parameters (layer counts and sizes) for the network architecture.

Here's an example of an RNN that correctly models `out[i] = in[i] && in[i - 1]`:

![A diagram showing the architecture of a recurrent neural network that models `out[i] = in[i] && in[i - 1]`.  The flow of data and the operations applied to values are indicated by arrows and signs.  It shows the weights, inputs, and outputs for two steps of a sequence.](./images/neural-networks-boolean-logic/very_basic_rnn.png)

It consists of two trees: one for computing the next state and one for computing the current output.  In practice, these trees could each consist of multiple layers with many neurons in each layer, but we only need a single layer with 1 neuron in each for this case.

The recurrent tree has learned to populate the next state with the current input.  Since we're using a linear/identity activation function, all we have to do is set the weight to 1 for the input.  The previous state is completely ignored by setting its weight to 0.  It has the following truth table:

| Input 1 | Input 2 | Output | Rounded Output |
|---------|---------|--------|----------------|
| 0       | 0       | 0      | 0              |
| 1       | 0       | 1      | 1              |
| 0       | 1       | 0      | 0              |
| 1       | 1       | 1      | 1              |

The output tree takes the current state and emulates a boolean AND with the current input, passing the result to the current output.  Since the outputs of our network can be any number not just 0 and 1 like the inputs, we round outputs < 0.5 to 0 and >= 0.5 to 1.  Our output neuron takes advantage of that fact by setting the weights for each of the inputs to 1/3.  That produces the following truth table:

| Input 1 | Input 2 | Output | Rounded Output |
|---------|---------|--------|----------------|
| 0       | 0       | 0      | 0              |
| 1       | 0       | 0.333  | 0              |
| 0       | 1       | 0.333  | 0              |
| 1       | 1       | 0.666  | 1              |

So this neuron has modeled a binary AND gate!  Given this architecture and parameter values, the network will always make correct classifications for all inputs, assuming they all consist of only ones and zeros.

Given the fact that our activation is linear/the identity function, this proves that the binary boolean AND function is **linearly separable**.  This means that if we plot the function and treat each corner as one possible input, we can draw a line that separates the trues from the falses.  And indeed, here's the output plot for the output tree neuron with those weights:

TODO VIZ

TODO TELL THEM TO TRY REPRESENTING OTHER FUNCTIONS WITH IT

One thing to note, though, is that the and gate it learned isn't perfect.  For three of the four input combinations, it will be off by some amount even though it rounds to the correct value.  TODO TODO LINEAR SEPARABILITY

...TODO... Activation functions are a big part of the computational power of neural networks.  Their main purpose is to introduce **nonlinearity** - a important attribute which allows
