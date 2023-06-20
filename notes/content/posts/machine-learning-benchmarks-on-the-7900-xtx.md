+++
title = "Machine Learning Benchmarks on the 7900 XTX"
date = "2023-06-19T15:00:06-07:00"
+++

I [recently upgraded](https://cprimozic.net/notes/posts/upgrading-5700xt-to-7900xtx/) to a 7900 XTX GPU.  Besides being great for gaming, I wanted to try it out for some machine learning.

It's well known that NVIDIA is the clear leader in AI hardware currently.  Most ML frameworks have NVIDIA support via CUDA as their primary (or only) option for acceleration.  OpenCL has not been up to the same level in either support or performance.

That being said, the 7900 XTX is a very powerful card.  It has 24GB of VRAM, a theoretical 60 TFLOPS of f32, and 120 TFLOPS of f16.  The recent AI hype wave is also incentivizing AMD to beef ML support on their cards, and they [seem to be making real investments](https://twitter.com/LisaSu/status/1669848494637735936?s=20) in that space.

I ran some benchmarks to get a feel for its real-world performance right now.

> **These benchmarks were done in June 2023.  It's very possible that these results will change dramatically over time, even in the short term.**

## Simple TensorFlow Neural Network Training Benchmark

I wanted to get a feel for the actual performance that I can get with the 7900 XTX for a realistic ML training scenario.  I started out by looking for some existing benchmarks that I could pull in to compare.

I found [a Reddit post](https://www.reddit.com/r/hardware/comments/qkc6n8/6900xt_tensorflow_mlai_benchmarks_using_rocm/) by [cherryteastain](https://www.reddit.com/user/cherryteastain) that uses TensorFlow to run a few different ML benchmarks on a 6900XT card.

One of the cases they benchmarked is training a very simple multi-layer neural network using random data.  Although it's simple, it has over 7 million parameters:

```txt
Model: "sequential"
_________________________________________________________________
 Layer (type)                Output Shape              Param #
=================================================================
 dense (Dense)               (None, 2500)              252500

 dense_1 (Dense)             (None, 2500)              6252500

 dense_2 (Dense)             (None, 250)               625250

 dense_3 (Dense)             (None, 10)                2510

=================================================================
Total params: 7,132,760
Trainable params: 7,132,760
Non-trainable params: 0
```

Once I [set up ROCm and TensorFlow](https://cprimozic.net/notes/posts/setting-up-tensorflow-with-rocm-on-7900-xtx/), I was able to run [the exact script](https://pastebin.com/65z30rLs) as-is.  Just in case that pastebin gets deleted in the future, I'll include the whole thing here since it's so short anyway:

```py
import tensorflow as tf
import numpy as np
gpus = tf.config.experimental.list_physical_devices('GPU')
if gpus:
  try:
    for gpu in gpus:
      tf.config.experimental.set_memory_growth(gpu, True)
  except RuntimeError as e:
    print(e)

nclasses = 10
nsamples = 3000000
bsize = nsamples//20
inp_units = 100
mod = tf.keras.Sequential([tf.keras.layers.InputLayer(inp_units), tf.keras.layers.Dense(2500, activation='relu'), tf.keras.layers.Dense(2500, activation='relu'), tf.keras.layers.Dense(250, activation='relu'), tf.keras.layers.Dense(nclasses, activation='softmax')])
mod.compile(loss='sparse_categorical_crossentropy', optimizer='adam')

inpt = np.random.rand(nsamples,inp_units)
gtt = np.random.randint(0,nclasses-1,nsamples)
dset = tf.data.Dataset.from_tensor_slices((inpt,gtt)).batch(bsize)

mod.fit(dset, epochs = 20)
```

### Results

On my 7900 XTX GPU, I achieved 24 seconds per epoch.  The author of the Reddit post included some timings for a variety of other cards that they tested:

| 6900XT/System 1   | Titan V/System 2 | V100/System 3    | 7900 XTX (Mine) |
| --- | --- | --- | --- |
| 26s (1254ms/step) | 19s (946ms/step) | 20s (996ms/step) | 24s (~1180ms/step) |

... Not what I wanted to see.  My card is performing barely better than the 6900 XT tested by the author.  The 6900 XT has a theoretical max of [23 TFLOPS](https://www.techpowerup.com/gpu-specs/radeon-rx-6900-xt.c3481) of FP32 performance - less than 40% of [the 7900 XTX](https://www.techpowerup.com/gpu-specs/radeon-rx-7900-xtx.c3941) which has 61 TFLOPS of FP32 performance.

I'm not sure why the performance is so bad.  One possibility is that it's something to do with the [hacky way](https://cprimozic.net/notes/posts/setting-up-tensorflow-with-rocm-on-7900-xtx/) I compiled TensorFlow to work with ROCm 5.5 and the 7900 XTX.  I feel like it's quite possible that there will be some changes to the ROCm TensorFlow fork in the future or ROCm drivers themselves that fix this performance to be more in line with the card's actual power.

## `resnet50` via `tf_cnn_benchmarks`

```txt
# Needed by my hacky TensorFlow setup
> export HSA_OVERRIDE_GFX_VERSION=11.0.0
> git clone https://github.com/tensorflow/benchmarks.git
> cd benchmarks/scripts/tf_cnn_benchmarks

# I edited the `tf_cnn_benchmarks.py` file add the bit of code to
# enable GPU memory growth so that my computer doesn't entirely
# lock up while it's running

> python3 tf_cnn_benchmarks.py --num_gpus=1 --batch_size=128 --model=resnet50

... debug output ...

Running warm up
Done warm up
Step    Img/sec total_loss
1       images/sec: 126.3 +/- 0.0 (jitter = 0.0)        7.442
10      images/sec: 126.3 +/- 0.1 (jitter = 0.3)        7.423
20      images/sec: 126.1 +/- 0.1 (jitter = 0.3)        7.469
30      images/sec: 125.5 +/- 0.4 (jitter = 0.2)        7.568
40      images/sec: 125.7 +/- 0.3 (jitter = 0.2)        7.515
50      images/sec: 125.8 +/- 0.3 (jitter = 0.3)        7.452
```

So, around 126 images/sec for resnet50.  A [Reddit thread from 4 years ago](https://www.reddit.com/r/Amd/comments/asdyon/radeon_vii_tensorflow_deep_learning_results_huge/) that ran the same benchmark on a Radeon VII - a >4-year-old card with 13.4 TFLOPS FP32 performance - resulted in a score of 147 back then.

This leads me to believe that there's a software issue at some point.  Maybe it's my janky TensorFlow setup, maybe it's poor ROCm/driver support for the 7900 XTX, or maybe it's some some obscure boot param I added to my system 3 years ago.  I really don't know.

One thing is clear though: My TensorFlow performance is not anywhere near where it should be for this hardware.

## Benchmarking 7900 XTX Raw FP32 FLOPS

After that bad result, I wanted to see if I could actually reach the 61 TFLOPS of FP32 performance advertised for the card.

While poking around online, I discovered the [tinygrad](https://tinygrad.org) library.  It's a minimalist ML framework built from the ground up on a very tiny foundation of basic operations.  That being said, it's still quite capable and is able to run full-scale complex networks like [Stable Diffusion](https://github.com/geohot/tinygrad/blob/master/examples/stable_diffusion.py) natively.

Tinygrad targets AMD GPUs as one of their backends.  They support both OpenCL-based kernels as well as a work-in-progress [RDNA3 Assembler](https://github.com/geohot/tinygrad/blob/master/tinygrad/codegen/assembly_rdna.py) backend.

The native RDNA3 backend was very interesting to me.  Pretty recently after the 7900 XTX was released, Chips and Cheese put out a [detailed microbenchmarking post](https://chipsandcheese.com/2023/01/07/microbenchmarking-amds-rdna-3-graphics-architecture/) for the 7900 XTX that used OpenCL to test various different microarchitectural properties of the card and raw performance numbers.  One thing they noted was that the OpenCL compiler at the time was doing a poor job of making use of the "dual issue" mode of RRDNA3 to execute multiple instructions in parallel:

> "I’m guessing RDNA 3’s dual issue mode will have limited impact. It relies heavily on the compiler to find VOPD possibilities, and compilers are frustratingly stupid at seeing very simple optimizations."

Using dual issue, RDNA 3 GPUs like the 7900 XTX are able to kick off two `v_dual_fmac_f32` (fused multiply-accumulate) instructions at once.  That results in assembly that looks like this:

```asm
v_dual_fmac_f32 v108, v109, v110 :: v_dual_fmac_f32 v111, v112, v113
```

Since each of these `fmac` instructions results in 2 floating point operations (multiply + add) and two of them are dispatched per cycle, that comes out to 4 FLOPS of throughput per cycle.  And since GPUs are SIMD machines, many of these instructions are executed in parallel across the GPU at the same time.

### Tinygrad RDNA3 Matrix Multiplication Benchmark

I don't remember how I found it, but Tinygrad has a [benchmark script](https://github.com/geohot/tinygrad/blob/master/extra/rocm/rdna3/asm.py) for raw RDNA3 floating point throughput.

It's about as low-level as it gets.  There's a raw assembly file that has some boilerplate and loop handling code, and then the script dynamically generates the loop body out of nothing but `v_dual_fmac_f32 :: v_dual_fmac_f32` instructions.  There is no data loading or memory interaction at all; all operations read from and write to registers directly.  This is far from anything "real-world" of course, but since the goal is to determine the max F32 throughput it's perfect.

Somewhat miraculously, I was able to run the script as-is on my own 7900 XTX directly.  Here's what it output:

```txt
> # Exclude iGPU from being used by OpenCL; run code on the 7900 XTX only
> export CL_EXCLUDE=gfx1036
> DEBUGCL=5 DEBUG=5 GPU=1 OPTLOCAL=1 PRINT_KERNEL=1 python3 asm.py

... lots of debug info and disassembly ...

ran in 77.72 ms, 56663.33 GFLOPS
ran in 73.30 ms, 60082.85 GFLOPS
ran in 71.29 ms, 61775.70 GFLOPS
```

Well there it is!  After a couple warmup iterations, it's able to hit the 61 TFLOPS mark.

As I said before, this is far from any kind of a real-world benchmark.  Memory is usually the bottleneck for any real model.  However, this does validate the claims of peak theoretical floating-point throughput.

### 16-bit Floating Point

After seeing that result, I looked into testing the FP16 support as well.  It turns out that the only way to achieve that massive 120 TFLOPS of FP16 advertised is by using the tensor/"AI" cores.  These are specialized for matrix multiplication using FP16, BF16, IU8, and IU4 data types.

They can be interacted with via [WMMA instructions and compiler intrinsics](https://gpuopen.com/learn/wmma_on_rdna3/).  So, benchmarking FP16 on the 7900 XTX would require me to write some assembly code.

At the time of writing this, that's not something I want to devote the (possibly copious amounts of) time into right now, so I'll put that in the future work pile.

## Simple TensorFlow Neural Network Training Benchmark

Now TensorFlow seems to be the weak link, I wanted to see if I could replicate the simple neural network training example with TinyGrad.

TODO
