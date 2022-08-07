---
title: 'Exploring Boolean Logic with Neural Networks'
date: '2022-07-19'
---

Recently, I was experimenting with building small neural networks for sequence-to-sequence use cases.  My goal was to create a visualization of how the inner state of a RNN changes as it processes inputs - similar to the [browser-based neural network visualization](https://cprimozic.net/blog/neural-network-experiments-and-visualizations/) I built previously.

I was inspired to explore this area after reading a very interesting blog post called [Differentiable Finite State Machines](https://google-research.github.io/self-organising-systems/2022/diff-fsm/) which gave an overview of using gradient descent to learn FSMs to operate on one-bit strings.  The state machines that were learned by their approach were impressively concise and managed to find optimal solutions in many cases.

There's a _ton_ of research being done in areas that border the work that I ended up doing.  Artificial neural networks serve as very useful proxies for studying topics such as computational complexity, information theory, and even cognition itself.  This post explores the connections between some of these topics and how they apply to machine learning both in theory and in practice.

## Learning Logic with RNNs

For my own work, I wanted to step things up a bit further in terms of complexity.  I wanted to try learning things that would be able to make better use of the greater power and generality of full-fledged neural networks like problems with multiple inputs/outputs, logic circuits, and maybe even some text generation or signal generation.

RNNs are more than capable of doing all of these things, but I had a constraint of keeping the model small/simple enough that a visualization of it will be intelligible and have a discernable method of action rather than just appear as a random mass of blinking lights.

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

This new version has the benefit of having much more of its range near the target values of 1 and -1.  There are many more "almost exact" solutions available, and the gradients are steeper leading to them which makes learning faster.

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

_The Ameo activation function has lossless solutions for **224/256** of the 3-input boolean functions and can perfectly classify the 32 others with some small error_.

These 224 functions with solutions do include the conditional `a ? b : c` which can be solved with parameters of `x_weight: -1, y_weight: 3, z_weight: 2, bias: -1`

In order to visualize how the function achieves this solution, we can use the same approach as the 2D method or sampling the function at all points of its range with a given set of parameters and measuring its output - but we have to add a dimension to account for the added input:

<iframe src="http://localhost:3040/voxelViz" loading="lazy" style="display: block;outline:none;border:1px solid #888;box-sizing:border-box; width: calc(min(100vw - 34px, 500px)); height: 600px; margin-left: auto; margin-right: auto; margin-bottom: 10px;"></iframe>

You can click/drag to rotate the viz and use scroll wheel/pinch to zoom in and out.  Filled regions of the cube represent a truthy output while empty regions are falsey.  If you look at the labels at the edges, you'll see that the corners that are shaded line up with the truth table for the conditional function.

To solve it, the function has wedged the positive "peak" of the function in at just the right angle such that it perfectly covers the `TTF` and `FFT` cases while leaving the `FTF` case exactly negative.  Notice how 3 of the adjacent vertices to `FTF` are true but things are arranged in just the right way such that it's left out.

Playing with the parameters reveals that with the added input, the function can now be rotated in all three axes and the bias allows it to be shifted arbitrarily.  The decision boundaries are now planes rather than lines, and all three are apparent and indeed utilized to solve the conditional.  Notice, though, they're all still exactly parallel to each other and infinite; changing that would require non-linear relationships between the inputs before the activation function - something that isn't possible for artificial neurons without adding more layers.

For the functions that aren't modeled perfectly, there exist non-perfect solutions with non-integer parameters that correctly classify all 8 input combinations with some error - meaning that they are non-zero and their sign matches the sign of the target.

## The Ameo Activation Function in Practice

So although the Ameo activation function can indeed model all of the 3-input boolean functions, the question still remains of if (and how well) it can do so in practice.  Given randomly initialized parameters and random inputs, can a neuron using the activation function actually learn them?

To test this, I used the same TensorFlow.JS setup I had created before to build a single neuron using the activation function and tested learning a variety of different functions.  I wanted to see how long it took to find the various solutions and how reliably they were found compared to other activation functions that could also represent them.

The results were... quite difficult to ascertain.  When training tiny models like this, the chosen hyperparameters for things like initial values for the parameters, learning rate, optimizer, variant of the Ameo activation function used, and even loss function have a huge impact on how well the learning performs.

I suspect that part of this is due to the fact that the Ameo activation function is a good bit more complex than many other activation functions.  The fact that the gradient switches direction multiple times - a key feature providing it much of its expressive power - makes it harder for the optimizer to find optimal solutions.  Especially with low batch sizes or low learning rates, the function can get stuck at local minima.  The Adam optimizer helps combat this problem by keeping track of the "momentum" of the parameters being optimized.  This can allow it to escape local minima by trading off some short-term pain in the form of increased loss for the reward of a lower loss at the other side.

For every target function I tested, the neuron was indeed about to learn it some percentage of the time.  However, depending on the function and on the training hyperparameters chosen, the probability of success was anywhere from >95% to lower than 10%.  For some like `!b`, the function has a very easy time learning it regardless of the parameters chosen to initialize it.  For others, it has a harder time or only does well with very specific hyperparameters.

For example, learning the conditional `if a then b else c` function had a success rate of 98% with a learning rate of 0.8, parameter initialization using a normal distribution with standard deviation 1.5, and the Adam optimizer.  However, learning a different function has a <40% success rate until the standard deviation is decreased to 0.5 at which point it has a 80% success rate.

In larger networks with many neurons and multiple layers, it becomes much easier for networks to learn.  I don't have any proof or references for this, but I get the feeling that the reason is related to the [birthday paradox](https://en.wikipedia.org/wiki/Birthday_problem).  As the population of candidate starting parameters increases linearly, the probability of some particular combination of them existing in that population increases exponentially.  Gradient descent is profoundly adept at locking onto those good combinations of parameters, maximizing them, and minimizing the noise to create good solutions.

## Relationship to ML Theory

The optimizers used for training neural networks are very good at their job.  They've been iterated on in research for decades and in general do an extremely good job of finding good solutions in the massive parameter space available.

However, the fact remains that some functions are just easier to learn than others.  It is far easier to train a neural network to classify whether or not a given image consists of all black pixels than it is to train one to classify whether or not the image contains a human face.

Even in the domain of boolean functions, there are still some functions that are simply "harder" than others.  Going back to the XOR problem, XOR and XNOR have some characteristic that just makes them more complex than the others.  They're the only 2-input boolean functions that can't be linearly separated.

### Boolean Complexity

One way of quantifying this is called [Circuit Complexity](https://en.wikipedia.org/wiki/Circuit_complexity) which is also known as **Boolean Complexity**.  It allows a complexity measure to be assigned to boolean functions based on how many AND, OR, and NOT gates are required to build a circuit representing it.  There's a lot of CS theory that touches this subject, much of which is in the domain of computational complexity.

An alternative form of measuring boolean complexity ignores NOT gates and counts them as free.  They are indeed "simpler" than an AND or OR gate since they only consider a single input rather than combining two input signals.  For the rest of this writeup, I'll be referring to this measure as "AND/OR" complexity.

Using this measure of AND/OR complexity, it is possible to quantify the complexity of arbitrary boolean functions.  Although there are an infinite number of functions which have the same truth table, there is some "minimal" function for every one which requires the least amount of resources to compute it.  The only issue is that finding the minimum boolean function is very hard - NP hard in fact, going back to computational complexity.  It gets exponential worse as the number of inputs goes up as well.

Luckily, for functions with few inputs, things are tractable.  The fact that boolean functions (unlike more complex methods of computation like Turing Machines) are non-recursive helps as well.  It's possible to brute-force minimal solutions for boolean functions, and this has been done for all functions with up to [5 inputs](https://oeis.org/A056287).

When considering functions with 2 inputs, we get the following table of minimal formulae:

|Formula|AND/OR Complexity|Truth Table|
|-|-|-|
|`!b & b`|1|`FFFF`|
|`!b & !a`|1|`FFFT`|
|`!b & a`|1|`FFTF`|
|`!b`|0|`FFTT`|
|`b & !a`|1|`FTFF`|
|`!a`|0|`FTFT`|
|`b & !a \| !b & a`|**3**|`FTTF`|
|`!b \| !a`|1|`FTTT`|
|`b & a`|1|`TFFF`|
|`(b \| !a) & (!b \| a)`|**3**|`TFFT`|
|`a`|0|`TFTF`|
|`!b \| a`|1|`TFTT`|
|`b`|0|`TTFF`|
|`b \| !a`|1|`TTFT`|
|`b \| a`|1|`TTTF`|
|`!b \| b`|1|`TTTT`|

The odd ones out with complexities or 3 are XOR and XNOR.  The simplest are functions like `!b` which completely ignores one of the inputs.  One could argue that functions like `!a & a` are in fact simpler since they can be represented by a single constant value and completely ignore both inputs, but constant values cannot be represented in this system so they require a complexity of 1.  However, since constant values either "cancel out" or propagate all the way through in boolean functions, the cases where they are useful are limited to these constant value output cases.

### Estimating Boolean Complexity

This is another concept which is similar to boolean complexity called [Kolmogorov Complexity](https://en.wikipedia.org/wiki/Kolmogorov_complexity).  It represents the length of the shortest computer program that can generate a given string.  It is a very popular topic to discuss recently with ties to topics like information theory, randomness, and epistemology.

Another interesting property of Kolmogorov complexity is that it is incomputable:

> To find the shortest program (or rather its length) for a string _x_ we can run all programs to see which one halts with output _x_ and select the shortest. We need to consider only programs of length at most that of _x_ plus a fixed constant. The problem with this process is known as the halting problem: some programs do not halt and it is undecidable which ones they are.

-- <cite>Paul Vitanyi, [How incomputable is Kolmogorov complexity?](https://arxiv.org/abs/2002.07674)</cite>

Although it is incomputable, there are still ways to estimate it.  There's a proof known as [Solomonoff's theory of inductive inference](https://en.wikipedia.org/wiki/Solomonoff%27s_theory_of_inductive_inference).  Its official definitions are quite abstruse.  However, one of its core implications is that randomly generated programs are more likely to generate simple outputs - ones with lower information content - than complex ones.

One [research paper](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4014489/) (Soler-Toscano, Fernando et al. 2014) uses this property to estimate the Kolmogorov complexity of strings by generating tons of random turing machines, running them, and counting up how many times various different outputs are generated.  The more times a given string is found, the lower its estimated Kolmogorov complexity.

### Consequences for Neural Networks

I promise this is all leading up to something.

There's been a lot of research in recent years into why artificial neural networks - especially really big ones - work so well.  Traditional learning theory would expect neural networks with way more parameters than they need will end up severely overfitting their training datasets and end up not generalizing to unknown values.  However, in practice this doesn't end up happening very often, and researchers have been trying to figure out why.

One paper which attempts to work towards an answer is called [Neural networks are _a priori_ biased towards boolean functions with low entropy](https://arxiv.org/pdf/1909.11522.pdf) (C Mingard et al 2019).  They take a similar approach to the paper using turing machines but study randomly initialized artificial neurons and neural networks instead.

As it turns out, neural networks work in much the same way as turing machines in that less complex outputs are generated more often.  They demonstrate that this property persists across various network architectures, scales, layer counts, and initialization schemes.

This does help explain why neural networks generalize so well.  A state machine, turing machine, or other program that generates a string like "0101010101010101010101" by hard-coding it and reciting is more complex than one that uses a counter, for example.  In the same way, a neural network that learns how to identify birds by memorizing the pictures of all birds in the training set will be much more complex - and much less likely to be formed - than one that uses actual patterns derived from shared features of the images to produce its output.

The way that they measure complexity is a more rudimentary than a true circuit complexity, however.  They simply look at the number of true to false values in the truth table of their network's output, take the smallest one, and use that as a measure for its complexity.  Since some of their testing was done with relatively large networks with dozens or more neurons, this choice makes sense since circuit complexity is so hard to determine.

However, for input counts under 5, things are still tractable.  Since we know that artificial neurons using the Ameo activation function can represent all 3-input boolean functions, it can be used to test how circuit complexity relates to the probability of different functions being modeled by the neuron.

Here are the results:

<iframe src="http://localhost:3040/functionComplexity" loading="lazy" style="display: block;outline:none;border:1px solid #888;box-sizing:border-box; width: 100%; height: 640px; margin-bottom: 10px;"></iframe>

There is a clear inverse correlation between boolean complexity and probability of that function being produced by the neuron.

## Learning Binary Addition

TODO
