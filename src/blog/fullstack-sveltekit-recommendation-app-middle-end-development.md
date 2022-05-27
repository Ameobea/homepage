---
title: 'Middle-End Development with SvelteKit + TensorFlow.JS'
date: '2022-05-25'
---

I've been building a project over the past month or so — a machine learning-powered recommendation app.  Building it has been one of my most unique, engaging, and memorable dev experiences in recent memory.  There are multiple reasons for this, and after thinking about it I figure it boils down to two technology choices that underpin the whole project:

**SvelteKit** and **TensorFlow.JS**

[SvelteKit](https://kit.svelte.dev/) is an application framework for the Svelte UI framework — much like [Next.JS](https://nextjs.org/) for React.  I've tried out SvelteKit before and [shared my thoughts](https://cprimozic.net/blog/trying-out-sveltekit/) on using to develop full-stack applications.  Since writing that back in January, the framework has only gotten better and more mature and many of my negative points from that post have already been fixed.

[TensorFlow.JS](https://www.tensorflow.org/js) is a JavaScript port of Google's very popular [TensorFlow](https://www.tensorflow.org/) platform for machine learning.  It mirrors many of the APIs and high-level components from root TensorFlow and even comes with tools for converting models between TF.JS and TensorFlow formats.

The way that these two frameworks interact with each other created a development experience unlike anything I've ever experienced before.  It didn't feel like building a front-end app, it didn't feel like building a back-end app, and in many ways it didn't feel like building a full-stack app either.  It was something different, something unique, which I'm calling "middle-end" for lack of a better term.

## Overview

As I mentioned, the app itself is an anime recommendation + stats website.  If you're an anime fan, you can check it out for yourself:

https://anime.ameo.dev/

You can check out this demo profile if you don't have an account but still want to check it out: https://anime.ameo.dev/user/ameo___

The premise is pretty simple: it loads a user's profile from the API of popular anime site MyAnimeList, runs it through a machine learning model, and shows recommendations to the user.  It's got some other stats + visualizations that I added on as well.

Although it's not very extensive or complicated as far as scope, it still entails several different components and

Normally if I was designing something like this app, I'd probably come up with an architecture something like this:

 * Data scraping scripts collecting + processing training data, probably Python or Node
 * Python notebooks for cleaning + analyzing the collected data and training the model
 * Some microservice in Rust or similar to load the model and do inference, exposing gRPC or HTTP API
 * Backend webserver to serve REST API for the frontend.  Makes secondary calls to the inference microservice based on user config options + requests.
 * Frontend SPA written in React that calls the backend API

I dare to say that is a pretty reasonable modern setup for this kind of project.  However, what I ended up going for instead is this:

 * SvelteKit
 * A couple Python note books for data processing

I didn't plan for it like that from the start, but as I kept building things and adding new features I kept thinking "Hmm, why should I spend all the effort of deploying a whole new service in a new language, building all the type definitions, constructing internal APIs, etc, when I can just add it as a SvelteKit endpoint?"

As it turns out, having all of the code in the same place is a massive boon for both ease of development as well as deployment and maintenance.  Instead of having to build, configure, and deploy different containers for each service, the whole thing bundles into a single Docker container that I just re-build and re-start to push updates.

Collecting data for training makes use of the same libraries, auth config, types, and wrapper functions as I use for the main app itself.  For both training and predicting with the model, I use [TensorFlow.JS](https://www.tensorflow.org/js).  As an added bonus of this, I'm able to get GPU accelerated training with my AMD GPU on Linux without switching to a different distro and installing a bunch of specialized drivers since TFJS uses WebGL instead of CUDA.  The whole training process is just a private page + endpoints of the main app, so I can re-use all my existing caches, DB wrapper functions, and types from the main app.

Here's what training the 100 million parameter model looks like from the browser btw: https://ameo.link/u/9x0.png

And of course, this is all in addition to the heaps of benefits that Svelte/SvelteKit bring normally.  For example, setting up really nice animations for the recommendations as they change in response to user config changes + filtering was _shockingly_ easy - like 2 lines of code - and the result is gorgeous: https://ameo.link/u/9yo.mp4

I'm also able to generate dynamic OpenGraph metadata for users' recommendations pages that contain descriptions + images tailored to their particular recommendations.  There are heaps more things that I've never even explored before that SvelteKit makes possible or downright trivial to do.

Of course I'm not saying this way of using SvelteKit is a magic bullet for every web app.  I imagine that this architecture wouldn't scale well for large teams of devs all working on a project together, but it's pretty ideal for me for a solo project.  It will be especially nice in the future maintaining this; I won't have to figure out a web of interconnected services when I come back in a few months/years to tweak something and try to re-deploy it.

After writing all of this, I think I will write a proper blog post going over all of this and going into some of the specific things in more detail.

I'm really excited about this new way of developing full-stack web apps, and I'll definitely explore further with other things I build in the future.

## Downsides

 * Scaling Problems
