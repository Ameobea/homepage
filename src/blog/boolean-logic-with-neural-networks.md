---
title: 'Exploring Boolean Logic with Neural Networks'
date: '2022-07-19'
---

Recently, I was experimenting with building small neural networks for sequence-to-sequence use cases.  My goal was to create a visualization of how the inner state of a RNN changes as it processes inputs - similar to the [browser-based neural network visualization](https://cprimozic.net/blog/neural-network-experiments-and-visualizations/) I built previously.  Along the way, I TODO TODO TODO TODO very exciting and inspiring stuff

I was inspired to explore this area after reading a very interesting blog post called [Differentiable Finite State Machines](https://google-research.github.io/self-organising-systems/2022/diff-fsm/) which gave an overview of using gradient descent to learn FSMs to operate on one-bit strings.  The state machines that were learned by their approach were impressively concise and managed to find optimal solutions in many cases.

For my own work, I wanted to step things up a bit further in terms of complexity.  I wanted to try learning things that would be able to make better use of the greater power and generality of full-fledged neural networks like problems with multiple inputs/outputs, logic circuits, and maybe even some text generation or signal generation.

RNNs are more than capable of doing all of these things, but I had a constraint of keeping the model small/simple enough that a visualization of it will be intelligible and have a discernable method of action rather than just appear as a random mass of blinking lights.

## Trying to Learn Logic with RNNs

My initial trails were working quite well.  After some tuning of hyperparameters like learning rate, optimizer, and activation function, I was able to pretty consistently train networks to solve very simple problems like `out[i] = in[i - 1]` or `out[i] = in[i] && in[i - 1]` and do so in the minimum number of parameters (layer counts and sizes) for the network architecture.

I created a RNN architecture that's a bit different from some that you'll see implemented by default in libraries like Tensorflow.  It consists of two trees: one for computing the next state and one for computing the current output.  Both accept a concatenated tensor of (currentState, input) as input.  In practice, these trees could each consist of multiple layers with many neurons in each layer, but we only need a single layer with 1 neuron in each for this case.

In programming terms, it's similar to a merged `map` and `reduce`:

```ts
function rnn(initialState: number[], inputs: number[][]): number[][] {
  function rnnStep(
    state: number[],
    input: number[]
  ): [number[], number[]] {
    const combined = [...state, ...input];
    // For both of these, dot product with weights, add bias,
    // and apply activation function
    //
    // potentially multiple layers
    const newState = applyRecurrentTree(combined);
    const output = applyOutputTree(combined);
    return [newState, output];
  }

  type Acc = [number[], number[][]];

  const [_finalState, outputs] = inputs.reduce(
    ([state, outputs]: Acc, input): Acc => {
      const [newState, output] = rnnStep(state, input);
      return [newState, [...outputs, output]];
    },
    [initialState, []] as Acc
  );
  return outputs;
}
```

Here's an example of an RNN that correctly models `out[i] = in[i] && in[i - 1]`:

![A diagram showing the architecture of a recurrent neural network that models `out[i] = in[i] && in[i - 1]`.  The flow of data and the operations applied to values are indicated by arrows and signs.  It shows the weights, inputs, and outputs for two steps of a sequence.](./images/neural-networks-boolean-logic/very_basic_rnn.png)

<div class="note" style="padding-bottom: 0px;">
Some RNN implementations return the state as the output at each time step rather than having two outputs.  This forces the RNN to conflate its internal state representation with the output sequence it's trained to produce.  This is more difficult to learn than if they were kept separate.

Although it's possible to process the returned state downstream with other layers to transform it into the final output of the RNN, this still requires that the RNN conflate its internal state representation with information about the current input.  Regardless of the effect of that on training efficiency or network capabilities, it makes the flow of information through the network much harder to reason about for the purpose of the visualization.</div>

The recurrent tree has learned to populate the next state with the current input.  Since we're using a linear/identity activation function, all we have to do is set the weight to 1 for the input.  The previous state is completely ignored by setting its weight to 0.  It has the following truth table:

| Input 1 | Input 2 | Output | Rounded Output |
|---------|---------|--------|----------------|
| 0       | 0       | 0      | 0              |
| 1       | 0       | 1      | 1              |
| 0       | 1       | 0      | 0              |
| 1       | 1       | 1      | 1              |

The output tree takes the current state and emulates a boolean AND with the current input, passing the result to the current output.  Since the outputs of our network can be any number - not just 0 and 1 like the inputs - we round outputs < 0.5 to 0 and >= 0.5 to 1.  Our output neuron takes advantage of that fact by setting the weights for each of the inputs to 1/3.  That produces the following truth table:

| Input 1 | Input 2 | Output | Rounded Output |
|---------|---------|--------|----------------|
| 0       | 0       | 0      | 0              |
| 1       | 0       | 0.333  | 0              |
| 0       | 1       | 0.333  | 0              |
| 1       | 1       | 0.666  | 1              |

So this neuron has modeled a binary AND gate!  Given this architecture and parameter values, the network will always make correct classifications for all inputs, assuming they all consist of only ones and zeros.

In order to visualize the output space of the neuron, we can create a 2D plot covering the full range of its two parameters and sample its output at each point to determine its decision.  Each corner of the plot represents a different combination of inputs, and the color at that corner represents the decision: red is false, and green is true.

Here's an output plot for the output tree neuron with those weights:

<iframe src="http://localhost:3040/classificationDemo" loading="lazy" style="display: block;outline:none;border:1px solid #888;box-sizing:border-box; width: 328px; height: 468px; margin-left: auto; margin-right: auto"></iframe>

The tiny patch of bright red in the top left corner represents regions of the function where outputs are very nearly 0, close to perfectly representing the negative class.  The white stripe is the decision boundary where the classification switches between negative and positive.

## Linear Separability

Given the fact that our activation is linear/the identity function, this proves that the binary boolean AND function is **linearly separable**.  The decision boundary is a single straight line that that separates the trues from the falses.

There are a total of 16 binary boolean functions.  OR, NAND, and the simple ones like "constant true" can be created by tweaking the weight and bias params; give it a try with the sliders on the viz if you'd like.

As it turns out, 14/16 of them are linearly separable and can be solved by neural networks that have no activation functions (these are called perceptrons).  The exception is XOR and its complement XNOR.  This fact is widely known and featured in machine learning teaching material, often called the "XOR Problem".  In order to train a neural network that has no activation functions, you need to have hidden layers.

This is a fascinating idea to me.  Why is XOR "harder" to compute than the other logic gates?  Is it some consequence of the mathematical operations used to implemented artificial neurons, or something intrinsic with XOR or boolean logic itself?  XOR's unique properties are often used in cryptography to encode information or in hash functions to compress/destroy it.

As I later learned, there is indeed something that makes XOR and XNOR special compared to the other 2-input boolean functions.  We'll get to that later on in the article though!

Another thing to note, is that although 14/16 of the functions can be linearly separated perfectly with no activation function, the solutions aren't perfect in that the values are exactly true or false at the corners.  Some functions can be perfectly represented like `NOT Y` which is achievable by setting `xWeight = 0, yWeight = -1, bias = 1`.  For most of the others, however, no perfect solution exists and the outputs will be inexact for at least some inputs.

## Solving the XOR Problem

So far, we've been working without activation functions.  What if we add one of those in?

Dozens of activation functions have been used over time in artificial neural networks with the popular functions changing over time.  They have a wide range of origins in research and other areas of study like statistics and electronics.  Despite that, most of them can't solve XOR.

In order to solve XOR, the function needs to have more than one linear decision boundary.  One example of a type of function that has this property is called GCU which stands for Growing Cosine Unit.  It was found to be quite successful when used in image classification networks, improving both the speed at which the networks train as well increasing their accuracy.  Also, in the [research paper](https://arxiv.org/pdf/2108.12943.pdf) presenting the function, the authors prominently state that it can solve the XOR problem in a single neuron.

<iframe src="http://localhost:3040/activationPlot?gcu=1" class="iframe-mobile-scale" loading="lazy" style="display: block;outline:none;border:1px solid #888;box-sizing:border-box; width: 430px; overflow: hidden; height: 325px; margin-left: auto; margin-right: auto"></iframe>

This additionally gives it the ability to have more than one linear decision boundary which is evident in its 2D neuron response plot:

<iframe src="http://localhost:3040/classificationDemo?gcu=1" loading="lazy" style="display: block;outline:none;border:1px solid #888;box-sizing:border-box; width: 328px; height: 468px; margin-left: auto; margin-right: auto"></iframe>

As you can see above, this activation function does indeed allow the XOR gate to be modeled in a single neuron!  The oscillatory nature of the function causes it to change direction and cross the decision boundary an infinite number of times, providing everything needed to solve the XOR problem.  Just `y = cos(x)` as an activation function works just fine, too, but GCU has the benefit of preserving at least some of the information about the magnitude of input signals.

These functions do have some problems for my particular use case though.  Although they can model all the logic gates, they do so with considerable error.  The function doesn't saturate, so there are only single points where they are equal to the target values.  In addition, they are not bounded so both their maximum value and maximum derivative in the case of GCU are infinite.

Neural networks usually have many neurons in each layer, and have multiple layers.  By combining signals from multiple neurons and refining them through the layers, they can figure out ways to minimize this error or eliminate it entirely.  However, if the activation function used by the individual neurons was more expressive and yielded clearer signals from the start, I figured that it might allow the networks to learn with less resources or in less training time.

## Designing a New Activation Function

I wondered if it was possible to create an activation function that fixed all of these issues - perfectly modeling all of the binary boolean functions with zero error.  I also wanted it to be as simple as possible so that it would work well for my RNN visualization and be efficient during training.

I knew that the function would need to change direction at least once so that it crossed the decision boundary at least two times - a requirement for modeling XOR.  As a starting point, I used variations of simple functions like `|x|` which indeed solved the XOR problem but failed to model the others with low error.

Along the way, I realized that having the function saturate at the target classes made it much easier to represent solutions since there was more freedom in the parameter choices.

After some much trial and error, I developed a function which did the job:

<iframe src="http://localhost:3040/activationPlot" class="iframe-mobile-scale" loading="lazy" style="display: block;outline:none;border:1px solid #888;box-sizing:border-box; width: 430px; overflow: hidden; height: 325px; margin-left: auto; margin-right: auto"></iframe>

This function (which I will refer to as the Ameo activation function for the remainder of this writeup) has several characteristics that make it capable of doing so and suitable for use in neural networks:

 * It changes direction 2 times and crosses the decision boundary (y=0) two times meaning that it is able to model XOR and XNOR
 * It saturates at both the positive and the negative ends of its range, very useful for modeling AND and NAND
 * Both its range and derivative are finite which helps keep weights and gradients from getting too large
 * It crosses through the origin meaning that an input of 0 outputs zero as well
 * It is symmetrical across x=[-∞,∞] and has an average output of 0 across that domain
 * It is very straightforward to implement as a piecewise function:

![The piecewise equation for the Ameo activation function rendered in LaTeX](./images/neural-networks-boolean-logic/ameo_latex.png)

<!-- \color{White} \text{Ameo}(x) = \begin{cases}
  -1 & \text{if } x < -3 \\
  x + 2 & \text{if } x \in [-3, -1] \\
  -x & \text{if } x \in (-1, 1] \\
  x - 2 & \text{if } x \in [1, 3] \\
  1 & \text{if } x > 3 \\
\end{cases} -->

I don't know if there are simpler functions that work for modeling binary boolean functions gates in artificial neurons with zero error, but this particular function has some additional properties that make it useful for additional tasks which I'll detail later on.

### Improvements

The function did have some issues though:

 * It had regions where the gradient is zero which makes it vulnerable to the [Vanishing Gradient Problem](https://en.wikipedia.org/wiki/Vanishing_gradient_problem)
 * It had areas where it only touched the target values (y=-1 and y=1) at single points, making parameters that solve it perfectly difficult to find

To resolve these issues, I created a modified version of the Ameo function which is created out of scaled, shifted, and reflected segments of `y = x^4` instead of `y = x`.  I also changed it from having a gradient of 0 at its edges to being optionally "leaky" in the same way as the [Leaky ReLU](https://paperswithcode.com/method/leaky-relu).  The leakyness does introduce a very small amount of imprecision for some functions, though, and it is negligible.

One new issue it created, though, is that the modified function had regions where the gradient was very close to 0 in some small points of the domain.  This can cause gradient descent to get "stuck" at those points, slowing down learning.  As a solution, I created a final version of the function which interpolates between `y=x^4` and `y=x` with a configurable mix factor:

<iframe src="http://localhost:3040/activationPlot?interpolatedAmeo=1" class="iframe-mobile-scale" loading="lazy" style="display: block;outline:none;border:1px solid #888;box-sizing:border-box; width: 430px; overflow: hidden; height: 370px; margin-left: auto; margin-right: auto"></iframe>

Here's the 2D response plots for the different versions of the Ameo function:

<iframe src="http://localhost:3040/classificationDemo?softLeakyAmeo=1&fnPicker=1&useTruthTable=1" loading="lazy" style="display: block;outline:none;border:1px solid #888;box-sizing:border-box; width: 328px; height: 525px; margin-left: auto; margin-right: auto"></iframe>

The checkboxes in the truth table can be used to change the function modeled by the neuron, picking parameters for the weights + bias such that it does so with no error.  The nice thing is that the solutions are identical between all the variants.

## Stepping It Up a Dimension

In addition to binary logic gates, I also wanted to implement programs that did things like conditionals and if/then logic.  In programming, this would be represented by a conditional operator also known as a ternary:

`a ? b : c`

I got to wondering if the Ameo activation function would work for solving this and other 3-input boolean function cases as well.  The function crosses the decision boundary three times which we know is the requirement for separating 3-dimensional functions.  That being said, I didn't know whether this particular function would do it.

In order to test the idea, I implemented the function in TensorFlow.JS, the JavaScript port of the massively popular TensorFlow machine learning library.  Since the function is pretty simple, it wasn't horrifically difficult - plus I only bothered implementing a kernel for the CPU backend which is implemented in pure JS.

There are 256 different unique 3-input boolean functions compared to 16 for the 2-input case, many more than I was willing to determine manually.  So, I figured I'd do as the neural networks do and let gradient descent discover some solutions for me.

After testing out learning a few different 3-input boolean functions, it didn't take long for me to realize that all the solutions gravitated towards parameters with integer-valued weights just like the 2-input solutions.  After that realization, I wrote a quick program to attempt to brute-force solutions.

### Results

As it turns out, the _Ameo activation function has perfect solutions for **224/256** of the 3-input boolean functions and can correctly model the 32 others_.

These 224 functions with solutions do include the conditional `a ? b : c` which can be solved with parameters of `x_weight: -1, y_weight: 3, z_weight: 2, bias: -1`

In order to visualize how the function achieves this solution, we can use the same approach as the 2D method or sampling the function at all points of its range with a given set of parameters and measuring its output - but we have to add a dimension to account for the added input:

<iframe src="http://localhost:3040/voxelViz" loading="lazy" style="display: block;outline:none;border:1px solid #888;box-sizing:border-box; width: calc(min(100vw - 34px, 500px)); height: 600px; margin-left: auto; margin-right: auto; margin-bottom: 10px;"></iframe>

You can click/drag to rotate the viz and use scroll wheel/pinch to zoom in and out.  Filled regions of the cube represent a truthy output while empty regions are falsey.  If you look at the labels at the edges, you'll see that the corners that are shaded line up with the truth table for the conditional function.

To solve it, the function has wedged the positive "peak" of the function in at just the right angle such that it perfectly covers the `TTF` and `FFT` cases while leaving the `FTF` case exactly negative.  Notice how 3 of the adjacent vertices to `FTF` are true but things are arranged in just the right way such that it's left out.

Playing with the parameters reveals that with the added input, the function can now be rotated in all three axes and the bias allows it to be shifted arbitrarily.  The decision boundaries are now planes rather than lines, and all three are apparent and indeed utilized to solve the conditional.  Notice, though, they're all still exactly parallel to each other and infinite; changing that would require non-linear relationships between the inputs before the activation function - something that isn't possible for artificial neurons without adding more layers.

For the functions that aren't modeled perfectly, there exist non-perfect solutions with non-integer parameters that correctly classify all 8 input combinations with some error - meaning that they are non-zero and their sign matches the sign of the target.

### Relationship to ML Theory

TODO

<iframe src="http://localhost:3040/functionComplexity" loading="lazy" style="display: block;outline:none;border:1px solid #888;box-sizing:border-box; width: 100%; height: 640px; margin-bottom: 10px;"></iframe>

TODO

## Learning Binary Addition

TODO
