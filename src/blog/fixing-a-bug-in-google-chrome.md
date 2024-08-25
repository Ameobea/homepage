---
title: 'Fixing a Bug in Google Chrome as a First-Time Contributor'
date: '2024-08-25'
opengraph: "{\"image\":\"https://i.ameo.link/cdw.jpg\",\"description\":\"A rundown of my experience finding and fixing a bug in the Chromium/Google Chrome browser - specifically in the devtools.  It includes details about the bug itself as well as notes about what it was like working on the Chromium project as a first-time contributor.\",\"meta\":[{\"name\":\"twitter:card\",\"content\":\"summary_large_image\"},{\"name\":\"twitter:image\",\"content\":\"https://i.ameo.link/cdw.jpg\"},{\"name\":\"og:image:width\",\"content\":\"3456\"},{\"name\":\"og:image:height\",\"content\":\"1984\"},{\"name\":\"og:image:alt\",\"content\":\"A screenshot of one of the Gerrit code review UI for one of the pull requests I made to fix the bug discussed in this blog post.  It shows a dark-themed UI with lots of text and fields typical of a code review tool.  It shows the PR name (Devtools: Update `InspectorNetworkAgent` to support worklets), PR description, and list of changed files and diff.  There are some badges containing the names of people who reviewed the code as well as some other badges indicating that the change has been merged.\"},{\"name\":\"twitter:image:alt\",\"content\":\"A screenshot of one of the Gerrit code review UI for one of the pull requests I made to fix the bug discussed in this blog post.  It shows a dark-themed UI with lots of text and fields typical of a code review tool.  It shows the PR name (Devtools: Update `InspectorNetworkAgent` to support worklets), PR description, and list of changed files and diff.  There are some badges containing the names of people who reviewed the code as well as some other badges indicating that the change has been merged.\"}]}"
---

I recently finished up the process of fixing a bug in the Chromium/Google Chrome browser.  It was my first time contributing to the Chromium project or any other open source project of that scale, and it was a very unique experience compared to other open source work I've done in the past.

I figured that I'd write up an overview of the whole process from beginning to end to give some perspective for any other devs looking to try this kind of work themselves.

<div class="note padded">
I'll say up front that for me personally, fixing this bug was well worth the effort, and it's an achievement I'm very proud to have in my software development portfolio.
</div>

## The Bug

The bug I fixed was in the Chromium Devtools - specifically the integration between Devtools and network requests made by worklets running off the main thread such as [`AudioWorklet`](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet).

This is a rather niche area of impact since most web developers will never have the need to write custom realtime audio processing code or things like that - which probably explains why this bug was left unfixed for several years.  That being said, I've run into this bug pretty consistently during my normal work on my various projects.

I found three error reports matching this bug that all had the same underlying cause:

 * [Worklet modules don't show up in devtools networking](https://issues.chromium.org/issues/40686236)
 * ["Disable cache (while devtools is open)" option doesn't affect audioWorklet modules](https://issues.chromium.org/issues/40592236)
 * [Audio Worklet keeps using invalid cached *processor.js](https://issues.chromium.org/issues/40935361)

Network requests made by worklets - including the request to fetch the worklet's entrypoint JavaScript source file - were completely missing in the Devtools network tab.

In addition, the "Disable Cache" Devtools option was also ignored.  This was the most annoying one as it was impossible to get stale code out of the cache during development.  I had ended up rolling my own cache busting methods to work around this locally, but things were more difficult in prod where I actually wanted the caching to be used.

Anyway, creating a minimal repro was very easy.  All that was needed was to create an `AudioWorkletProcessor` using a script that had cache headers set and then update the script and reload the page with Devtools open and "Disable Cache" on.  If things were working properly, the fresh script would be re-fetched and no network request would be made if not.

## Getting the Code + Building Chromium

The first step in actually fixing the bug was to build Chromium from scratch.  Luckily for me, there exists some [detailed documentation](https://www.chromium.org/developers/how-tos/get-the-code/) on how to do this on all the major operating systems.

I run Linux myself, and things were pretty straightforward.  There were some APT packages to install but other than that, I was able to `git clone` the source code and start building using Ninja.

Building it has some pretty high requirements though.   My computer is quite strong with a 7950x CPU and M.2 SSD., but a clean build still takes something like 45 minutes to finish.  Incremental builds were quite fast though, usually taking less than 10 seconds.  While compiling with 32 threads, the build also used over 50GB of RAM at peak consumption and over 100GB of disk space.

<div class="good padded">
That being said, the build really was fire and forget once I had all the prerequisites installed.
</div>

I generated the build config, ran `autoninja -C out/Default chrome`, and ~45 minutes later I had an executable at `./out/Default/chrome` which launched and worked perfectly.  Well, perfectly other than the fact that everything was incredibly slow since it was an unoptimized build and had all the debug checks enabled.

## Finding the Bug + Making the Fix

The Chromium codebase is VERY big.  As of 2024, Chromium has something like 33 million lines of code in total.  I doubt that many people have a good understanding of how all its components fit together even at a high level, and the codebase is constantly changing with dozens of commits being added per hour at busy times.

Because of this huge codebase size, I wasn't able to get VS Code's C++ extension to work very well with the project.  Features like go-to definition (which I usually rely on heavily when navigating codebases) and find references didn't well or at all, and one of my CPU cores would stay stuck at 100% permanently while the project was open.  I'm sure that people have configs or alternative extensions to make this work better, but yeah I didn't have much luck getting this to work myself.

I started my debugging by finding where the network request for the worklet script was initiated and tracing it down as far as necessary until the request was actually made - or retrieved from the cache.  The call tree looked something like this:

```cpp
Worklet::FetchAndInvokeScript
WorkletGlobalScope::FetchAndInvokeScript
DedicatedWorkerGlobalScope::FetchModuleScript
WorkerOrWorkletGlobalScope::FetchModuleScript
Modulator::FetchTree
ModuleTreeLinkerRegistry::Fetch
ModuleTreeLinker::FetchRoot
ModulatorImplBase::FetchSingle
ModuleMap::FetchSingleModuleScript
ModuleScriptLoader::Fetch
ModuleScriptLoader::FetchInternal
WorkletModuleScriptFetcher::Fetch
ScriptResource::Fetch
ResourceFetcher::RequestResource
```

Below that bottom point in the call tree, the actual request gets made on a dedicated network thread and the response gets asynchronously sent back to the caller.

This is a pretty good indicator of how code seems to be structured in Chromium.  Things are well organized and separated, but there is _much_ indirection and modularization.  There's also extensive use of dynamic dispatch everywhere which sometimes made it difficult to figure out what code is getting called from where.

I'll unashamedly admit that I made liberal use of printf debugging while trying to make my way through these code paths.  Chromium does a pretty good job keeping stdout mostly clear during regular operation, so my log messages were easy enough to follow.

My strategy was to log out anything that looked remotely interesting as I made my way down this call tree.  There were lots of red herrings and dead ends along the way, but I eventually found something promising.

<div class="note padded">
I noticed that every request had a <code>devtools_id_</code> set except the one made by the worklet.
</div>

The place where this was happening was pretty early up in the call tree as well - far before any caching interaction would come into play.

I'll avoid writing too much about the technical details of what was going on, but here's the gist of it.  When Devtools attaches a debugger session creates an [`InspectorNetworkAgent`](https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/inspector/inspector_network_agent.cc) and attaches it to the target.  After much more debugging and code scrolling, I realized that an `InspectorNetworkAgent` wasn't getting created for the worklet target.

A few hours after that, I finally figured out why.

Although the target itself was a worklet, it used a [`WorkerInspectorController`](https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/inspector/worker_inspector_controller.cc) to manage its Devtools session.  This is because `AudioWorklet`s run off the main thread on a worker thread.

The smoking gun was these few lines:

```cpp
if (auto* scope = DynamicTo<WorkerGlobalScope>(thread_->GlobalScope())) {
  auto* network_agent = session->CreateAndAppend<InspectorNetworkAgent>(
      inspected_frames_.Get(), scope, session->V8Session());
  // ...
}
```

The issue was that although this was running on a worker thread, it didn't have a `WorkerGlobalScope` - it had a `WorkletGlobalScope`.  Because of this, that cast returned a null pointer and the `InspectorNetworkAgent` was never created.

The fix I went for was to change `InspectorNetworkAgent` from accepting a `WorkerGlobalScope` to accepting an aptly named `WorkerOrWorkletGlobalScope` instead.  The changes necessary were quite minimal since `WorkerOrWorkletGlobalScope` is the base class common to both `WorkerGlobalScope` and `WorkletGlobalScope`.

Then, I updated the code in `WorkerInspectorController` to cast the scope to `WorkerOrWorkletGlobalScope` and initialize the `InspectorNetworkAgent` for both worklets and workers.

And that was it!  Everything worked perfectly after that... except it didn't.

I could see that the `InspectorNetworkAgent` was indeed getting created, but it was never initialized, `devtools_id_` was never set on the request, and nothing was showing up in the network tab.

After a few more fevered hours of digging through the code, I eventually wound up stuck at a dead end at the RPC boundary between the Devtools frontend and Chromium itself.  The RPC to initialize the network capabilities of Devtools just wasn't showing up.

Eventually, just as I was getting demoralized, I moved over to skimming through the TypeScript code for the devtools frontend itself.  There, I found [a file](https://source.chromium.org/chromium/chromium/src/+/main:third_party/devtools-frontend/src/front_end/core/sdk/Target.ts) that mapped Devtools target types to the set of capabilities that were enabled for them.

To my joy and giddy relief, I noticed that the `Capability.Networking` was conspicuously missing for `Type.Worklet`.

After adding that capability in and waiting through one final compile, an entry for the audio worklet processor script finally appeared in the Devtools networking tab.  "Disable Cache" worked like a charm, and the bug was finally defeated.

## Testing + Code Review

TODO

## Results + Retrospective

TODO
