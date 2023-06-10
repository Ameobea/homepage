+++
title = "Setting Up TensorFlow with ROCm on the 7900 XTX"
date = "2023-06-09T13:13:58-07:00"
+++

I recently upgraded to a 7900 XTX GPU.  The upgrade itself went [quite smoothly](https://cprimozic.net/notes/posts/upgrading-5700xt-to-7900xtx/) from both a hardware and software perspective.  Games worked great out of the box with no driver or other configuration needed - as plug and play as it could possibly get.

However, I wanted to try out some machine learning on it.  I'd been [using TensorFlow.JS](https://cprimozic.net/blog/fullstack-sveltekit-recommendation-app-middle-end-development/#tensorflowjs) to train models using my GPU all in the browser, but that approach is limited compared to what's possible when running it natively.

Since TensorFlow is the framework I'm most familiar with, it's what I wanted to focus on getting working first.

AMD's provided method for doing this is called [ROCm](https://docs.amd.com/category/ROCm_v5.5).  It's a combination of mostly-open libraries, toolkits, frameworks, compilers, and other software to facilitate heterogenous/GPGPU compute on AMD hardware.

## Installing ROCm

This part of the process took me the longest to figure out, but it ended up being quite simple.  AMD provides a tool called [amdgpu-install](https://docs.amd.com/bundle/ROCm-Installation-Guide-v5.5/page/How_to_Install_ROCm.html) which handles installing ROCm and other AMD software and drivers.

[ROCm version 5.5](https://www.phoronix.com/news/ROCm-5.5-Released) is the most recent version available at the time of release.  It contains improvements for RX 7000 series / RDNA3 GPU support which includes the 7900 XTX.  Version 5.6 is [in the works](https://www.reddit.com/r/Amd/comments/12z0tme/rocm_docs_560_alpha_on_windows/) as well, and there are rumors it will bring even more mature RDNA3 support and hopefully better performance as well.

I installed `amdgpu-install` by running `curl https://repo.radeon.com/amdgpu-install/5.5/ubuntu/jammy/amdgpu-install_5.5.50500-1_all.deb > /tmp/amdgpu-install.deb && sudo dpkg -i /tmp/amdgpu-install.deb`.

The ROCm install tutorial says to run `amdgpu-install --usecase=rocm`.  For me, this ended up causing a lot of issues.

The reason for that is that by default, that command attempts to build and install the `amdgpu-dkim` kernel module.  I don't understand how/if that differs from the `amdgpu` kernel module that comes built-into the Linux kernel already.

Anyway, the build for that kernel module failed for me because of differences in the kernel version targeted by ROCm 5.5 and my current kernel (Linux 6.3).

> It turns out that building the kernel module isn't necessary at all to get ROCm installed.  Running `sudo amdgpu-install --usecase=rocm --no-dkms` worked for me.

I followed the rest of the instructions setting some user groups and rebooting, and things seemed to be in good shape.

## Building 7900 XTX-Compatible TensorFlow

The next step was building a custom TensorFlow that works with ROCm version 5.5 and the 7900 XTX.

AMD maintains [a TensorFlow fork](https://github.com/ROCmSoftwarePlatform/tensorflow-upstream) for this, but at the time of writing this (June 9, 2023) it's not yet updated for ROCm 5.5.  So, we have to compile our own.

Luckily, some other people have done the vast majority of the hard work already!

[@Mushoz](https://github.com/Mushoz) posted [a comment](https://github.com/RadeonOpenCompute/ROCm/issues/1880#issuecomment-1547838227) with a Dockerfile and instructions for handling this whole process.  It patches TensorFlow to work with gfx1100 (used by the 7900 XTX), compiles it all, and produces a Docker image as output.

I followed their instructions exactly and was able to get it to work with no issues.

When I went to test TensorFlow's GPU functionality from inside the container, though, I ran into some more problems:

```txt
>>> import tensorflow as tf
>>> tf.test.is_gpu_available()
WARNING:tensorflow:From <stdin>:1: is_gpu_available (from tensorflow.python.framework.test_util) is deprecated and will be removed in a future version.
Instructions for updating:
Use `tf.config.list_physical_devices('GPU')` instead.
2023-06-09 09:16:04.455832: I tensorflow/core/platform/cpu_feature_guard.cc:193] This TensorFlow binary is optimized with oneAPI Deep Neural Network Library (oneDNN) to use the following CPU instructions in performance-critical operations:  SSE3 SSE4.1 SSE4.2 AVX AVX2 AVX512F AVX512_VNNI AVX512_BF16 FMA
To enable them in other operations, rebuild TensorFlow with the appropriate compiler flags.
2023-06-09 09:16:04.456591: E tensorflow/compiler/xla/stream_executor/rocm/rocm_driver.cc:302] failed call to hipInit: HIP_ERROR_InvalidDevice
2023-06-09 09:16:04.456599: I tensorflow/compiler/xla/stream_executor/rocm/rocm_diagnostics.cc:112] retrieving ROCM diagnostic information for host: devitra
2023-06-09 09:16:04.456602: I tensorflow/compiler/xla/stream_executor/rocm/rocm_diagnostics.cc:119] hostname: devitra
2023-06-09 09:16:04.456631: I tensorflow/compiler/xla/stream_executor/rocm/rocm_diagnostics.cc:142] librocm reported version is: NOT_FOUND: was unable to find librocm.so DSO loaded into this program
2023-06-09 09:16:04.456635: I tensorflow/compiler/xla/stream_executor/rocm/rocm_diagnostics.cc:146] kernel reported version is: UNIMPLEMENTED: kernel reported driver version not implemented
False
>>>
```

This seemed to indicate some kind of driver version mismatch or other issue.  I still don't know what the exact issue was (Mushoz didn't seem to run into this), but I was able to work around it.

The workaround involves copying the built TensorFlow Python wheel out of the container and running it directly on my host inside a virtual environment.  Here's how I accomplished that:

On host:

```sh
chmod 777 ~/dockerx
```

In container:

```sh
cp /tmp/tensorflow_pkg/tensorflow_rocm-2.11.1.-cp310-cp310-linux_x86_64.whl ~/dockerx/
```

Back on host:

```sh
pyenv install 3.10.6
pyenv virtualenv 3.10.6 tf-test
pyenv activate tf-test
pip3 install ~/dockerx/tensorflow_rocm-2.11.1.-cp310-cp310-linux_x86_64.whl
export HSA_OVERRIDE_GFX_VERSION=11.0.0
python3
```

After doing that and re-running the same Python commands to test TensorFlow's GPU integration, it properly detected my GPU as supported.  Being able to do all of that directly on the host is actually much better for me as well since I can use that virtual environment directly for notebooks from VS Code.

I did run into segfaults from inside `libamdhip64.so.5` when I actually tried to run some TensorFlow code using the GPU:

```txt
#0  0x00007fa1d3cd9d25 in ?? () from /opt/rocm-5.5.0/lib/libamdhip64.so.5
#1  0x00007fa1d3cd9ead in ?? () from /opt/rocm-5.5.0/lib/libamdhip64.so.5
#2  0x00007fa1d3cdda41 in ?? () from /opt/rocm-5.5.0/lib/libamdhip64.so.5
#3  0x00007fa1d3c8f9de in ?? () from /opt/rocm-5.5.0/lib/libamdhip64.so.5
#4  0x00007fa1d3e404ab in ?? () from /opt/rocm-5.5.0/lib/libamdhip64.so.5
#5  0x00007fa1d3e117f6 in ?? () from /opt/rocm-5.5.0/lib/libamdhip64.so.5
#6  0x00007fa1d3e1db86 in hipLaunchKernel () from /opt/rocm-5.5.0/lib/libamdhip64.so.5
#7  0x00007fa1b7197496 in Eigen::internal::TensorExecutor<Eigen::TensorAssignOp<Eigen::TensorMap<Eigen::Tensor<float, 1, 1, int>, 16, Eigen::MakePointer>, Eigen::TensorCwiseNullaryOp<Eigen::internal::scalar_const_op<float>, Eigen::TensorMap<Eigen::Tensor<float, 1, 1, int>, 16, Eigen::MakePointer> const> const> const, Eigen::GpuDevice, true, (Eigen::internal::TiledEvaluation)0>::run(Eigen::TensorAssignOp<Eigen::TensorMap<Eigen::Tensor<float, 1, 1, int>, 16, Eigen::MakePointer>, Eigen::TensorCwiseNullaryOp<Eigen::internal::scalar_const_op<float>, Eigen::TensorMap<Eigen::Tensor<float, 1, 1, int>, 16, Eigen::MakePointer> const> const> const&, Eigen::GpuDevice const&) () from /home/casey/.pyenv/versions/tf-test/lib/python3.10/site-packages/tensorflow/python/_pywrap_tensorflow_internal.so
#8  0x00007fa1b7192a51 in tensorflow::functor::FillFunctor<Eigen::GpuDevice, float>::operator()(Eigen::GpuDevice const&, Eigen::TensorMap<Eigen::Tensor<float, 1, 1, long>, 16, Eigen::MakePointer>, Eigen::TensorMap<Eigen::TensorFixedSize<float const, Eigen::Sizes<>, 1, long>, 16, Eigen::MakePointer>) () from /home/casey/.pyenv/versions/tf-test/lib/python3.10/site-packages/tensorflow/python/_pywrap_tensorflow_internal.so
```

The fix turned out to be adding that `export HSA_OVERRIDE_GFX_VERSION=11.0.0` line.  I learned that this is needed from [a blog post](https://are-we-gfx1100-yet.github.io/post/automatic/#launch) about running Stable Diffusion on the 7900 XTX.  The author of that writes:

> `HSA_OVERRIDE_GFX_VERSION` defaults to 10.3.0 and will fail our gfx1100 if we don't set it explicitly

There are a lot of other good tips and troubleshooting info for running PyTorch and other ML libraries on the 7900 XTX - I highly suggest checking it out if you run into any other problems.

That was the final piece I needed.  I am now able to use full GPU-accelerated TensorFlow with my 7900 XTX GPU:

```txt
>>> import tensorflow as tf
2023-06-09 17:05:27.588883: I tensorflow/core/platform/cpu_feature_guard.cc:193] This TensorFlow binary is optimized with oneAPI Deep Neural Network Library (oneDNN) to use the following CPU instructions in performance-critical operations:  SSE3 SSE4.1 SSE4.2 AVX AVX2 AVX512F AVX512_VNNI AVX512_BF16 FMA
To enable them in other operations, rebuild TensorFlow with the appropriate compiler flags.
2023-06-09 17:05:27.654869: I tensorflow/core/util/port.cc:104] oneDNN custom operations are on. You may see slightly different numerical results due to floating-point round-off errors from different computation orders. To turn them off, set the environment variable `TF_ENABLE_ONEDNN_OPTS=0`.
>>> tf.add(tf.ones([2,2]), tf.ones([2,2])).numpy()
2023-06-09 17:05:32.378116: I tensorflow/compiler/xla/stream_executor/rocm/rocm_gpu_executor.cc:843] successful NUMA node read from SysFS had negative value (-1), but there must be at least one NUMA node, so returning NUMA node zero
2023-06-09 17:05:32.378152: I tensorflow/compiler/xla/stream_executor/rocm/rocm_gpu_executor.cc:843] successful NUMA node read from SysFS had negative value (-1), but there must be at least one NUMA node, so returning NUMA node zero
2023-06-09 17:05:32.385399: I tensorflow/core/common_runtime/gpu/gpu_device.cc:2006] Ignoring visible gpu device (device: 1, name: AMD Radeon Graphics, pci bus id: 0000:1a:00.0) with core count: 1. The minimum required count is 8. You can adjust this requirement with the env var TF_MIN_GPU_MULTIPROCESSOR_COUNT.
2023-06-09 17:05:32.385608: I tensorflow/core/platform/cpu_feature_guard.cc:193] This TensorFlow binary is optimized with oneAPI Deep Neural Network Library (oneDNN) to use the following CPU instructions in performance-critical operations:  SSE3 SSE4.1 SSE4.2 AVX AVX2 AVX512F AVX512_VNNI AVX512_BF16 FMA
To enable them in other operations, rebuild TensorFlow with the appropriate compiler flags.
2023-06-09 17:05:32.386372: I tensorflow/compiler/xla/stream_executor/rocm/rocm_gpu_executor.cc:843] successful NUMA node read from SysFS had negative value (-1), but there must be at least one NUMA node, so returning NUMA node zero
2023-06-09 17:05:32.386509: I tensorflow/core/common_runtime/gpu/gpu_device.cc:1613] Created device /job:localhost/replica:0/task:0/device:GPU:0 with 23986 MB memory:  -> device: 0, name: Radeon RX 7900 XTX, pci bus id: 0000:03:00.0
2023-06-09 17:05:32.506584: I tensorflow/core/common_runtime/gpu_fusion_pass.cc:507] ROCm Fusion is enabled.
2023-06-09 17:05:37.839580: I tensorflow/core/common_runtime/gpu_fusion_pass.cc:507] ROCm Fusion is enabled.
array([[2., 2.],
       [2., 2.]], dtype=float32)
>>>
```

## Limiting TensorFlow Memory Usage

One final thing I ran into when testing out TensorFlow on the 7900 XTX was that my desktop was basically unusable while TensorFlow was running.  Clicks took many seconds to go through, windows would freeze, etc.

This is because TensorFlow allocates all of the GPU's memory by default, leaving nothing for the desktop environment and any other apps to use.

Luckily, the fix is easy.  Just add this Python code to the start of the script/notebook before any other TensorFlow code is run:

```py
import tensorflow as tf

gpus = tf.config.experimental.list_physical_devices('GPU')
if gpus:
  try:
    for gpu in gpus:
      tf.config.experimental.set_memory_growth(gpu, True)
  except RuntimeError as e:
    print(e)
```

This is from [a StackOverflow answer](https://stackoverflow.com/questions/70782399/tensorflow-is-it-normal-that-my-gpu-is-using-all-its-memory-but-is-not-under-fu) that Mushoz [linked](https://github.com/RadeonOpenCompute/ROCm/issues/1880#issuecomment-1550604957) in that same Github issue from before.  Huge thanks again to him for all the help getting this working!

## Conclusion

This whole process was quite difficult.  It took me more than a full day of effort.

I think/hope that this will be getting much better soon.  Once the TensorFlow ROCm fork gains true ROCm 5.5 or better yet 5.6 support, none of that custom build process should be necessary and should be installable directly from a Python package registry.

That being said, machine learning on modern AMD hardware is very much possible.  Once the setup is out of the way, TensorFlow seems to be working just like normal and running existing code with no modifications needed.
