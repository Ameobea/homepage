---
title: 'Optimizing Advent of Code 2024 (TODO BETTER TITLE)'
date: '2024-12-31'
opengraph: "{\"TODO\": \"TODO\"}"
---

<style>
@media only screen and (max-width: 600px) {
  .blog-post h2 {
    font-size: 1.1em;
    max-width: calc(100vw - 220px);
  }

  .timing-diff {
    margin-top: -50px !important;
    font-size: 0.9em;
  }
}

@media only screen and (max-width: 480px) {
  .timing-diff {
    margin-top: -48px !important;
  }
}

@media only screen and (max-width: 380px) {
  .blog-post h2 {
    max-width: 125px;
  }
}
</style>

I took part in [Advent of Code 2024](https://adventofcode.com/2024) this year.  It's a yearly event where a new holiday-themed programming puzzle is released every day of December through Christmas, and people from all across the internet compete to see who can solve them the fastest.

<div class="note">I also took part in a side competition in the <a href="https://discord.gg/rust-lang-community" target="_blank">Rust language community Discord server</a> to see who can create the solution that <i>runs</i> the fastest.</div>

It's a great place to experiment around with writing low-level, high-performance Rust - as well as learn from the extremely smart people who also competing and discussing their solutions in the chat.

<div class="good">I tried my hand at creating speedy solutions for a few of the challenges, but one stood out: <b>Day 9 Part 2</b>.</div>

It's one of those things where it's easy to get a working solution, but there's a lot of depth to it when striving for maximum efficiency.  There were several points where I thought I'd gone as far as I could only to find one extra trick to bring it that one step further.

This post is a summary of the individual optimizations I made to my solution to speed it up.  I profiled it at each step to get an idea of how much each change contributed to the overall improvement.  There's a nice spread of high-level algorithmic shortcuts, bespoke data structures, and low-level optimizations + SIMD that all contribute to the final program.

## Algorithm

I'll give a quick rundown of the actual Day 9 Part 2 problem to start off.  You can check it out yourself as well on the [AoC website](https://adventofcode.com/2024/day/9), but you'll have to complete part 1 before revealing part 2.

The problem describes an imaginary storage disk represented by an array of data blocks.  Each block can either be empty or contain data for a file.  Each file has an ID which is assigned based on the order at which it initially appears on the disk.

The puzzle's input is ASCII text consisting of a list of numbers like this:

```
12211211201111
```

(This is just an example; the actual puzzle input is much longer).

This input is used to encode the contents of the disk as alternating files and free spaces.

 - The first digit is the size of the first file, which starts at the beginning of the disk
 - The second digit is the number of free blocks following that file
 - The third digit is the size of the second file
 - The fourth digit is the number of free blocks following that file

... and so on for the rest of the input.

That example input represents a disk with the following layout when decoded:

<img alt="A diagram generated with TikZ showing the layout of the disk after parsing the example input.  It shows an array of boxes, some of which are filled with numbers and some of which are empty.  These represent the ordering of disk sectors and the ID of the file which occupies it (the number)." style="display: flex; width: 100%; max-width: 740px; margin-left: auto; margin-right: auto; border: 1px solid #747474aa;" src="https://i.ameo.link/cps.svg"></img>

<div class="note">The goal of our program is to perform a sort of basic defragmentation operation on this virtual disk, packing the files together to maximize contiguous free space.</div>

Here's the description of the actual algorithm directly from the Advent of Code site:

> Attempt to move whole files to the leftmost span of free space blocks that could fit the file. Attempt to move each file exactly once in order of decreasing file ID number starting with the file with the highest file ID number. If there is no span of free space to the left of a file that is large enough to fit the file, the file does not move.

So given that example input from before, here's how the algorithm would progress step by step:

<img alt="A diagram demonstrating how the algorithm for day 9 part 2 of Advent of Code 2024 operates.  It shows rows of cells filled with numbers of blanks.  Each row shows the state of the filesystem after one iteration of defragmenting.  There are arrows drawn to indicate where files are removed from and written to." style="display: flex; width: 100%; max-width: 740px; margin-left: auto; margin-right: auto; border: 1px solid #747474aa;" src="https://i.ameo.link/cpr.svg"></img>

Once every movable file is moved, the final step is to compute a checksum operation on the full filesystem which serves as the solution to the problem.  To compute it, you multiply the ID of the file stored in each sector by its index (empty sectors get a value of zero) and sum them up.  Empty sectors get a checksum of zero.

So for the example above, the checksum is `0*0 + 6*1 + 5*2 + 1+3 + 1*4 + ... = 137`

## Initial Naive Solution

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px" class="timing-diff"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family:'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">139.1ms</div></div>

I wrote the initial solution to this problem as quickly as I could in order to try to rank as high as possible on the leaderboards.  I spent little to no time optimizing for anything other than getting it working quickly.

First, I parsed the input and built up the following variables:

 - `input`: a `Vec<(usize, usize)>` holding `(file_size, free_space)` as parsed directly from the input text
 - `disk`: a `Vec<Option<usize>>` representing the initial state of the disk
 - `data_start_pos`: a `Vec<usize>` holding the index at which each file starts off at in the disk

My inner loop (after some cleanup) looked like this:

```rs
for src_file_id in (0..input.len()).rev() {
  let start_ix = data_start_pos[src_file_id];
  let (count, _) = input[src_file_id];
  let dst_ix = (0..start_ix).position(|i| disk[i..i + count].iter().all(|s| s.is_none()));
  let Some(dst_ix) = dst_ix else {
    continue;
  };

  disk[start_ix..start_ix + count].fill(None);
  disk[dst_ix..dst_ix + count].fill(Some(src_file_id));
}
```

Then, all that's left is to compute the checksum:

```rs
let mut checksum = 0usize;
for i in 0..disk.len() {
  checksum += i * disk[i].unwrap_or(0);
}
```

Nothing crazy going on here - just some nested loops and copying items around a 1D array.  I'd imagine that most people submitted solutions that looked something like this.

To benchmark my code, I used the excellent [Criterion](https://github.com/bheisler/criterion.rs) library. It produces nicely formatted human-readable timings along with information about how much performance changed from the past run, making it much easier to determine if a change was beneficial or not.

On my 7950x CPU, this initial solution takes a hefty **139 milliseconds** to run.  Even with that triple-nested loop conspicuously lurking in the code, I was surprised it ran that slowly given that there were only 10,000 files in the input string.

<!--
cccabd1
139ms PC0
-->

## Tree-Based Solution

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px" class="timing-diff"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family:'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">25.2ms <span style="margin-left: 5px; color: #4dc617">(-81.9%)</span></div></div>

<div class="note">My first idea for how to improve the code was to avoid computing the full layout of each sector in the disk and instead keep track of spans of filled and empty space directly.</div>

This strategy has a couple distinct advantages:

 - There's no need to construct the whole disk layout before starting the loop.
 - A span can be checked as a destination spot directly without having to check each sector within it individually.

Here's the `Span` enum that I used:

```rs
enum Span {
  Empty {
    count: usize,
  },
  Filled {
    count: usize,
    id: usize,
  },
  Split {
    count: usize,
    inner: (usize, usize),
  },
}
```

You might be a bit confused by that `Split` variant.  Since copying a file into a free span might leave some extra free space at the end, this will require dynamically adding a new span to the disk.

I was using a `Vec<Span>` to represent my tree.  Inserting or removing nodes at arbitrary points in a vector requires a copy of all elements after/before that point, which is unsurprisingly quite bad for performance.  In order to support efficient insertions at arbitrary points in the disk, a data structure like a linked list would be needed.

However, I'm always very reluctant to use linked lists or pointer chasing-based data structures in code I write.  Besides being notoriously tricky to implement in Rust, they're also known to be bad for performance due to the indirection and cache-unfriendly nature of their structure.

Because of that, I tried to create a sort of hybrid data structure that had both the linear nature of a `Vec` as well as offering efficient dynamic insertions.  I added in a separate growable vector of split spans that the parent span pointed into using those `inner` indices.  These child spans can in turn be split as well, resulting in a tree structure.

Here's how the tree would look after processing the example input from before:

<img alt="A diagram showing the tree structure used to solve Advent of Code 2024 day 9 part 2.  It has two rows of boxes with arrows pointing to each other in a chain from left to right.  The boxes represent spans in the filesystem described by the problem and  contain text indicating the contents of each span like '1 x 1' or '1 x <null set>'.  The bottom row has a special split node indicated by [...|...] which branches off in a tree to additional nodes which represent the strategy used by the algorithm to split a free space node into a filled node and a smaller free space node while retaining ordering." style="display: flex; width: 100%; max-width: 800px; margin-left: auto; margin-right: auto; border: 1px solid #747474aa;" src="https://i.ameo.link/cpb.svg"></img>

The checksum can be computed at the end using a recursive function that walks through the tree and counts the number of sectors that have been processed previously as it goes.

<div class="warn">In hindsight, I'm pretty sure that this custom hybrid tree data structure was overcooked and probably less efficient than simpler alternatives.</div>

That being said, it does improve things dramatically over the naive solution.  This implementation runs in **25.2 milliseconds** - a healthy improvement!  Getting to skip all of those individual sector checks is definitely worth the overhead and indirection that the tree-based data structure imposes.

I feel like using linked list here (or some kind of arena-allocated analog) would have been a much more natural fit while probably having similar or better performance.

<!--
379fd454d5906b771336569fa1775ccb02cc25ef (minus `start_span_ix_by_needed_size` accounting)
25ms PC
-->

## Start Span Index Accounting

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px" class="timing-diff"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family:'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">224µs <span style="margin-left: 5px; color: #4dc617">(-99.1%)</span></div></div>

While debugging my tree-based solution, I had a realization:

<div class="good">Once a file of length <span class="math math-inline"><span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>n</mi></mrow><annotation encoding="application/x-tex">n</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height: 0.4306em;"></span><span class="mord mathnormal">n</span></span></span></span></span> is moved to a sector with index <span class="math math-inline"><span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>i</mi></mrow><annotation encoding="application/x-tex">i</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height: 0.4306em;"></span><span class="mord mathnormal">i</span></span></span></span></span>, all subsequently moved files of length <span class="math math-inline"><span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>n</mi></mrow><annotation encoding="application/x-tex">n</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height: 0.4306em;"></span><span class="mord mathnormal">n</span></span></span></span></span> or greater must end up at a sector index greater than <span class="math math-inline"><span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>i</mi></mrow><annotation encoding="application/x-tex">i</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height: 0.4306em;"></span><span class="mord mathnormal">i</span></span></span></span></span>.</div>

This allows a tremendous amount of work to be skipped - especially as more and more files are moved.

To implement it in my code, I added an array to keep track of the minimum valid start index for each file size:

```rs
let mut start_span_ix_by_needed_size: [usize; 10] = [0; 10];
```

Every time a file is moved, the start indices for its size and all sizes greater than it are updated:

```rs
for i in file_size..10 {
  start_span_ix_by_needed_size[i] = start_span_ix_by_needed_size[i].max(dst_span_ix);
}
```

This small change gives the biggest relative performance improvement of everything I tried, bringing the runtime down to **224 microseconds** - less than 1% of the previous runtime.

<!--
(`start_span_ix_by_needed_size`)
379fd454d5906b771336569fa1775ccb02cc25ef
224µs PC
-->

## Flattened Spans Solution

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px" class="timing-diff"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family: 'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">85.3µs <span style="margin-left: 5px; color: #4dc617">(-61.9%)</span></div></div>

After debugging and analyzing the performance of the tree-based spans for a while, I started to think up ways to improve them and avoid some of the indirection they impose.

The two biggest points I wanted to solve were that:

 - Splitting a span required dynamically adding spans to the disk and introducing indirection.
 - Free spans were mixed in with empty spans.  This made finding the next empty span much more expensive than it theoretically needed to be.

I wanted to figure out a way to store the spans in a "flat" manner.  My goal was to be able to scan through spans one after another while looking for a sufficiently large free span without needing to chase pointers or do any kind recursion.

I eventually wound up with a data structure like this:

```rs
struct Slot {
  pub id: usize,
  pub size: usize,
}

struct Span {
  files: SmallVec<[Slot; 4]>,
  empty_space: usize,
}
```

Each span holds both an array of files as well as some free space.  They start off with a single file each, matching the pattern of the input where each file is followed by a span of free space.  When files are moved down, the destination span's free space is decreased and the file is just added on to the list of files already there.

In the following visualization, the first row represents the state of the disk after parsing the example input.  The second row is how it ends up after the algorithm finishes running.

<img alt="A diagram created with TikZ to illustrate a data structure for solving advent of code 2024 day 9 part 2.  It show two rows of nested nodes that represent spans of filled and free space on an imaginary filesystem.  The nodes are split in the middle with the left showing a set of contiguous files with different IDs along with their sizes, and the right side shows how much free space is available after that file indicated by the null set symbol.  The first row shows the original filesystem layout after parsing and the second shows the result after running the algorithm for the problem." style="display: flex; width: 100%; max-width: 800px; margin-left: auto; margin-right: auto; border: 1px solid #747474aa;" src="https://i.ameo.link/cpc.svg"></img>

I used the [`smallvec`](https://docs.rs/smallvec) crate to store the files for each span.  This saves space for 4 elements to be stored inline without needing to perform any heap allocation.  This is big enough for the vast majority of cases, and since the `Slot` struct is quite small, the extra space overhead isn't too big of a deal.

There's one detail that needs to be handled when _removing_ files from these spans.  The file that's moved is always the first one in the span (since files are only moved a single time).  However, there may be other files that already have been moved into the span after them.

If there are other files in the span after it, then the newly freed space needs to be added to the preceding span instead to preserve correct ordering of the disk.  This trick allows the deletions to be implemented without needing to dynamically add/remove spans from the disk.

These changes result in a >50% reduction in runtime, bringing the total down to **85.3µs**.

<!--
bb506718ee08d212a765ac4c3384aa4eb3d5a979
85.3µs PC
-->

## Spans SoA

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px" class="timing-diff"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family:'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">92.3µs <span style="margin-left: 5px; color: #e30021">(+8.2%)</span></div></div>

Now we're getting to the point where most of the low-hanging fruit has been picked and we need to dig a bit deeper to improve things.

<div class="note">A common strategy when optimizing things like this is to switch the data representation from array-of-structs to structs-of-arrays.</div>

It's a well-documented strategy and generally results in the faster code being generated by making things like auto-vectorization a lot easier for the compiler to implement.

I switched my implementation to use SoA for the disk, storing the file `SmallVec`s and empty spaces in separate arrays like this:

<img alt="A diagram created with TikZ to demonstrate a struct-of-arrays scheme applied to the data structures used to solve Advent of Code 2024 day 9 part 2. There are two rows showing labeled 'Stored Files' and 'Empty Space'. The stored files row has nested cells which contain a length and 4 inner data entries, some of which are empty. The empty spaces row is a simple one-dimensional array which contains a single digit in each cell." style="display: flex; width: 100%; max-width: 800px; margin-left: auto; margin-right: auto; border: 1px solid #747474aa;" src="https://i.ameo.link/cpj.svg"></img>

<div class="warn padded">Surprisingly, switching to SoA actually resulted in a small regression to the performance for my code.</div>

My best guess for why this happened is that the split resulted in less efficient cache utilization for the data, or maybe it introduced greater bounds checking overhead.  Despite this, I decided to stick with this optimization and aim to win back this performance later on.

<!--
266ae4e
92.3µs PC
-->

## `MiniVec`

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px" class="timing-diff"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family:'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">70µs <span style="margin-left: 5px; color: #4dc617">(-24.2%)</span></div></div>

Now we're getting to the good stuff.

While profiling my code with `perf`, I noticed that a significant amount of time was getting spent in `SmallVec` checks to see if the data had been spilled to the heap or not.  It was very rare that this ever happened, but the check had to be performed on every read or write regardless.  This added indirection made accessing the inner data much less efficient.

When I actually checked to see how big these vectors were, I noticed that none ever grew to be larger than 6 elements.  This rang true even when testing with other inputs through [the benchmark bot](https://github.com/indiv0/ferris-elf).

<div class="note">So, I decided to carry that assumption through to my code and create a custom <code>MiniVec</code> struct that holds the spans inline with a hard-coded cap of 6 elements.</div>

_Technically_, this assumption isn't completely valid.  You could create an input which has a max-sized free space of 9 into which 9 1-size files are moved, so the actual max size that this vector would need to be is 9.

This is probably the biggest stretch I made for my solution, but despite that it did continue to work for all the inputs included in the benchmark bot - and that was the golden source of truth for correctness we were all working off of.

Here's the `MiniVec` struct I ended up using:

```rs
struct MiniVec {
  pub len: u32,
  pub elements: [Slot; 6],
}
```

Nothing super special here, but I added in some unsafe bits to my methods for pushing and removing the first element to avoid bounds checks since I knew it would never hit them on any input.

This change was good for a solid 25% bump in performance, bringing the runtime down to **70µs**.

<!--
7443ee33e452faa8fb5a25d2590db0f35dc032c7
70µs PC
-->

## Constant-Time Checksumming

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px" class="timing-diff"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family:'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">64.7µs <span style="margin-left: 5px; color: #4dc617">(-7.6%)</span></div></div>

As the core of the algorithm gradually became faster and faster, the checksum calculation (which previously had been almost invisible in profiling) had slowly grown to take up a significant portion of the processing time.

Here's the code I had been using to compute the checksum:

```rs
impl Slot {
  fn checksum(&self, total_prev: usize) -> usize {
    (0..self.count)
      .map(|i| (total_prev + i) * self.id)
      .sum::<usize>()
  }
}
```

`total_prev` represents the total number of disk sectors that came before the start point of the span.  It's since the checksum uses the index of each sector as input.

The checksum operation can be broken down into a series of operations like this:

```py
(total_prev + 0) * id
+ (total_prev + 1) * id
+ (total_prev + 2) * id
+ ...
+ (total_prev + (count - 1)) * id
```

The `total_prev` part can be factored out using a bit of algebra:

```py
total_prev * count * id
+ 0 * id
+ 1 * id
+ 2 * id
+ ...
+ (count - 1) * id
```

You'll notice that `* id` is now a part of every single element of this series, so that can be factored out as well.  That leaves us with:

```py
(total_prev * count + (0 + 1 + 2 + ... + (count - 1))) * id
```

If you think back, the `count` comes from the input and has a max value of 9 since each count is a single digit.  This means that there are only 10 possible values for the repeated sum operation, making it a perfect use case for a lookup table:

```rs
const ADD_FACTORIAL_LUT: [usize; 11] = [
  0,
  0,
  1,
  2 + 1,
  3 + 2 + 1,
  4 + 3 + 2 + 1,
  5 + 4 + 3 + 2 + 1,
  6 + 5 + 4 + 3 + 2 + 1,
  7 + 6 + 5 + 4 + 3 + 2 + 1,
  8 + 7 + 6 + 5 + 4 + 3 + 2 + 1,
  9 + 8 + 7 + 6 + 5 + 4 + 3 + 2 + 1,
];
```

That leaves us with this for our checksum operation:

```rs
let checksum = (total_prev * count + ADD_FACTORIAL_LUT[count]) * id;
```

<div class="good">Computing a checksum for a file is now constant time and extremely efficient as well.</div>

This change only yields a 7.6% speed improvement, bringing the new time down to **64.7µs**.  This is mostly because the checksum computation still wasn't a very large portion of the total runtime.

Despite that, it's still one of the favorite individual optimizations I found for this problem.  Condensing it down to a closed-form solution like that was extremely satisfying to work out.

<!--
47b1b66685e2c251e2eb265a1a4bc404fb238859
64.7µs PC
-->

## Better Input Parsing

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px" class="timing-diff"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family:'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">58.7µs <span style="margin-left: 5px; color: #4dc617">(-9.3%)</span></div></div>

In a similar spirit as the previous step, I decided to spend a bit of time optimizing the input parsing portion of the algorithm.  Although it only happens once compared to the code in the hot loop which runs thousands of times, there were some clear ways to improve it.

To start out, I pre-allocated all of the vectors using `Vec::with_capacity()`.  We know exactly how big they need to be statically, so this ensures that the vector don't need to be resized and copied as they're initialized.

For the slots stored as a `Vec<MiniVec>`, I took it a step further.  I used some unsafe code to start the whole vector out as uninitialized and then populated only the pieces of it that needs values, leaving the rest uninitialized.  This is what `Vec` and `SmallVec` do under the hood anyway, so it's fine for use to do it as well.

This resulted in a tidy 9.3% perf improvement, bringing the new total down to **58.7µs**.

<!--
b5283592678d5951e632532cb87bc38788fae9ab
58.7µs PC
-->

## SIMD Input Parsing

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px" class="timing-diff"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family:'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">37.4µs <span style="margin-left: 5px; color: #4dc617">(-36.3%)</span></div></div>

Now we're getting to the good stuff.

While looking at the input parsing code, I realized that my current parsing code was running essentially character by character.  Given that each character is just a single byte, that incurs a lot of overhead; the CPU is wasting a lot of potential memory bandwidth among other things.

<div class="good">Sounds like a perfect use-case for some SIMD!</div>

Since the input comes in as an ASCII string, converting digits to a `u8` of the number they represent can be done by just subtracting 48 from their byte value.  That's how I implemented it for the existing scalar version, but with SIMD it's possible to parse as many as 64 digit at once using AVX-512.  However, the benchmark bot was running on a machine with a Ryzen 5950X CPU which only supports a max vector size of 256 bits, so we can parsing 32 digits at a time is the best we can do.

There are several ways to write SIMD code in Rust:

 - Relying on the compiler/LLVM to automatically vectorize code when it's able to
 - [Platform-specific intrinsics](https://doc.rust-lang.org/nightly/core/arch/x86_64/index.html) which often map directly or nearly directly to individual CPU instructions
 - Inline assembly code
 - One of several community-written libraries such as [faster](https://github.com/AdamNiederer/faster) which provide some manner of wrapper or abstraction over raw SIMD operations
 - The platform-agnostic [Portable SIMD](https://doc.rust-lang.org/std/simd/index.html) module built into the Rust standard library

For this use case, I decided to try out portable SIMD (also referred to as "std simd").  I'd followed progress on the feature over the past few years through blog posts and tweets and figured it was a good time to try it out in practice.

Std SIMD is currently only available on Rust Nightly behind a feature flag.  I use Nightly as my default for personal projects, so turning it on was no problem.  [The docs](https://doc.rust-lang.org/std/simd/struct.Simd.html) for the `Simd` trait are actually quite accessible (especially compared to things like the [Intel Intrinsics Guide](https://www.intel.com/content/www/us/en/docs/intrinsics-guide/index.html)) which made getting started quite straightforward.

This code loads 32 bytes/digits from the input string and subtracts 48 from each of them to convert them to their corresponding number values:

```rs
const VECTOR_LEN: usize = 32;

let digits =
  u8x32::from_slice(&input[batch_ix * VECTOR_LEN..batch_ix * VECTOR_LEN + VECTOR_LEN]);
let converted = digits - u8x32::splat(48);
```

So our SIMD vector will contain values like this, with blue indices representing file sizes and white indices representing free space sizes:

<img alt="A visualization created with TikZ showing the layout of the SIMD vector after loading some bytes from the input string. Its elements are labeled with alternating blue and yellow text like blue 0, white 0, blue 1, white 1, ..., white 7." style="display: flex; width: 100%; max-width: 800px; margin-left: auto; margin-right: auto; border: 1px solid #747474aa;" src="https://i.ameo.link/cpt.svg"></img>

We now need some way to unpack these values and separate the file sizes from empty spot sizes.

There's a std SIMD method that can help with this called [deinterleave](https://doc.rust-lang.org/std/simd/struct.Simd.html#method.deinterleave).  Here's the example code provided in the docs for it:

```rs
let a = Simd::from_array([0, 4, 1, 5]);
let b = Simd::from_array([2, 6, 3, 7]);
let (x, y) = a.deinterleave(b);
assert_eq!(x.to_array(), [0, 1, 2, 3]);
assert_eq!(y.to_array(), [4, 5, 6, 7]);
```

It needs two arguments, but we can work around that by just de-interleaving `converted` with itself:

```rs
let (sizes, frees) = converted.deinterleave(converted);
```

This results in two SIMD vectors with data packed like this:

<img alt="A visualization created with TikZ showing the layout of two SIMD vectors after de-interleave operation is performed.  The first vector contains elements 0-7 in order labeled with blue text, and the second contains elements 0-7 in order labeled with white text." style="display: flex; width: 100%; max-width: 800px; margin-left: auto; margin-right: auto; border: 1px solid #747474aa;" src="https://i.ameo.link/cpu.svg"></img>

The data is duplicated since the output vectors are the same size as the input vectors but we're only putting half of the data into each.  We can easily fix that by just truncating them down:

```rs
const STORE_VECTOR_LEN: usize = VECTOR_LEN / 2;
let sizes = sizes.resize::<STORE_VECTOR_LEN>(STORE_VECTOR_LEN as _);
let frees = frees.resize::<STORE_VECTOR_LEN>(STORE_VECTOR_LEN as _);
```

That leaves us with the exact vector format we want:

<img alt="TODO" style="display: flex; width: 100%; max-width: 400px; margin-left: auto; margin-right: auto; border: 1px solid #747474aa;" src="https://i.ameo.link/cpv.svg"></img>

I later learned about the [`simd_swizzle`](https://doc.rust-lang.org/std/simd/macro.simd_swizzle.html) macro which can also be used to accomplish the same thing while also avoiding the need to resize the vectors at the end:

```rs
let sizes = simd_swizzle!(converted, [
  0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30
]);
let frees = simd_swizzle!(converted, [
  1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31
]);
```

This generates identical assembly to the `deinterleave()` method once it makes it through the optimizer.  Pretty impressive for such a dynamic and high-level macro!

Anyway, all that's left now is to write them to their corresponding data vectors:

```rs
empty_spaces.extend_from_slice(frees.as_array());
orig_counts.extend_from_slice(sizes.as_array());
```

Once I finished up that initial implementation, I went back and improved it a bit by ensuring that both my input data buffer as well as my `empty_spaces` and `orig_counts` buffers were aligned to the vector sizes I was using.

This made it possible for me to use more efficient aligned reads/writes to these vectors:

```rs
let vec: u8x32 =
  unsafe { std::ptr::read(input.as_ptr().add(batch_ix * VECTOR_LEN) as *const _) };
```

This doesn't matter on every platform, but on some you get segfaults or worse if you try to read from an unaligned pointer.

To accomplish this, I copied the [`leak_to_page_aligned()`](https://github.com/indiv0/ferris-elf/commit/342f50639550f0ed463e9261aaa9fffb2fbb9bf0#diff-47da617fb1b2f4ac52d72ac9c4679b892776c77aab9fcc0067f97a9f234de7f9R31) function that the benchmark bot uses for the input buffer as well as a modified version of an [`aligned_vec()`](https://stackoverflow.com/a/60180226/3833068) function that I found on Stack Overflow for the data vectors.  I'm not sure if/how much this actually benefitted performance, though.

After that was all set up and working, I was curious as to what kind of assembly was actually getting generated.  When I took a look on Godbolt, this is the code it used for the inner loop:

```nasm
; load 32 bytes of the source string
vmovdqa ymm1, ymmword ptr [r12 + 2*rax]
; convert lanewise u16 to u8, truncating high bits and store in xmm2
vpmovwb xmm2, ymm1
; shift ymm1 left 8 bits
vpsrlw  ymm1, ymm1, 8
; same lanewise convert + truncate, storing result in xmm1
vpmovwb xmm1, ymm1
; xmm2 -= 48
vpaddb  xmm2, xmm2, xmm0
; xmm1 -= 48
vpaddb  xmm1, xmm1, xmm0
; store results in their respective output buffers
vmovdqa xmmword ptr [rbx + rax], xmm2
vmovdqa xmmword ptr [r15 + rax], xmm1
```

<div class="good">I can't say I was surprised to see it, but LLVM had managed to come up with an even better method to implement the deinterleave operation.</div>

It uses the `vpmovwb` instruction, which treats the vector as containing 16 16-bit integers, and then truncates them down to 8-bit integers by throwing away the high bits.  This is essentially a special-purpose way of achieving the "extract even bytes" swizzle we need.  Then, it shifts the vector left by 8 bits to put the high bits in the low bits' place and repeats the same thing to extract the empty spaces.

I'm not sure why the compiler decided to do two individual subtract operations on the smaller vectors rather than do one on the full 256-bit vector before extracting the values.  If I had to bet, I'd say that this way reduces data dependencies between the instructions and allows for a higher throughput when it's all run in a loop.

One thing to note is that this is the code generated for the `znver4` target, which is the target my personal CPU uses (and the one I recorded all the benchmarks in this blog post on).  The benchmark bot has a 5950X which uses the `znver3` target.

<div class="warn">For some reason, LLVM produces [significantly less pretty code](https://rust.godbolt.org/z/nqPvsjPEW) for that target.</div>

There are weird `vpand` instructions, shuffles, unpacks, etc. going on compared to the very simple `znver4` version.  I'm not sure why that is; I'm pretty sure all the instructions used in the `znver4` version are also available on `znver3`.

In any case, it was reassuring to see that LLVM + rustc are at least _capable_ of generating very good code from these high-level std SIMD abstractions.

----

It turns out that all that work was well worth it.  The total runtime of the program went down 36% to **37.4µs**.

It's possible that some of this benefit came from tangential changes I made like using smaller data types in the vectors used to store data and aligning the input + data vectors.

<!--
> NOW BASING OFF OF: 69638bb81aca90d77ec7f9d8b7b04d8c4f732499
> branch: manual-2
> With manual removals

524aa7eb99803c8b33af14ae96882bf15197e779
37.4µs PC
-->

## SIMD Free Spot Scanning

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px" class="timing-diff"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family:'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">39.1µs <span style="margin-left: 5px; color: #e30021">(+4.5%)</span></div></div>

Now that I had SIMD on the mind, I looked for other places to apply it.

I decided to try using it to find the left-most free spot big enough to hold the file.  Now that the free spaces were stored in SoA format, it was possible to use a SIMD compare to check many slots at the same time and then pick the index of the first one.

Std SIMD makes this very easy:

```rs
let empty_spaces_v: u8x32 = unsafe { std::ptr::read_unaligned(empties_ptr) };
let mask = empty_spaces_v.simd_ge(u8x32::splat(src_count));
let first_hit: Option<usize> = mask.first_set();
```

I had to handle some extra pieces to handle if no match was found and deal with offsets, but other than that the necessary changes were quite limited.

<div class="bad">Unfortunately, when I profiled the results, the performance actually regressed slightly as a result, getting 4.5% slower at 39.1µs.
</div>

Don't worry - I'll come back to this later on.

<!--
7c4f449f44e728589f6451d32e6cc6172b71bea6
39.1µs PC
-->

## `max_unmoved_src_id` Accounting

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px" class="timing-diff"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family:'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">34.17µs <span style="margin-left: 5px; color: #4dc617">(-12.6%)</span></div></div>

After working on those low-level optimizations, I took a step back and tried to think of some ways to improve the core algorithm again.

One thing I realized is that while this algorithm runs, files are continuously moved from right to left.  There are tons of free spaces available at the start, so every one of the first several thousand files that's checked ends up getting moved.  This produces a big span of fully empty spans at the end of the disk.

<div class="good">The checksum of a fully empty span is always zero.  So, by keeping track of the index of the first unmoved sector (starting from the right), the checksum can be stopped early once it reaches that point.</div>

So, that's what I did.  The code change was very small and the overhead for keeping track of that stopping point is negligible.  Yet, this change resulted in a 12.6% performance improvement, bringing the new total down to **34.17µs**.

A common adage about optimization is that the best way to make something fast is to avoid doing work in the first place.  That certainly rings true here.  This is only a decrease of 5µs, but things have been trimmed down to the point where 5µs is actually a significant amount of time at this scale.

<!--
a7137edf0877d264ff949d7097b3d93555e4b620
34.170µs PC
-->

## `finished_digit_count` Bookkeeping

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px" class="timing-diff"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family:'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">32.92µs <span style="margin-left: 5px; color: #4dc617">(-3.7%)</span></div></div>

In the same spirit as the previous optimization, I thought up another way to avoid a little bit of extra work towards the end of the iteration.

I was already keeping track of the earliest possible location that a file of size $$n$$ could be moved to for each digit.

<div class="good">Files can only be moved to the left.  So, once the start index of the file being checked is less than the earliest valid spot for it, all subsequent files of that size can be skipped.</div>

I also kept track of the number of digits that hit this condition.  Once all 9 digits are done (there are no files in the input of size 0), the outer loop can be exited immediately.

Together, these changes are good for a 3.7% performance boost, bringing the new total to **32.92µs**.

<!--
ee872a0e07037a4de59889185f2e30da400b3d1b
> this also puts us even with 69638bb81aca90d77ec7f9d8b7b04d8c4f732499
32.915µs PC
-->

## Faster `MiniVec` Initialization

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px" class="timing-diff"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family:'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">25.14µs <span style="margin-left: 5px; color: #4dc617">(-23.6%)</span></div></div>

This one is my personal favorite.

I went back and profiled the full algorithm to get an idea for where to focus the remainder of my efforts.

<div class="note">When I did, I noticed that the code to initialize the <code>Vec&lt;MiniVec&gt;</code> holding my slots was taking a surprisingly large portion of the runtime.</div>

The reason for this is that each vector needs to be initialized with a unique data pattern based on the ID of the file it starts off containing.  This is the code I had been using to do this:

```rs
let slots = Vec::with_capacity(file_count);
unsafe { slots.set_len(file_count / 2) };

for i in 0..slots.len() {
  slots[i].len = 1;
  slots[i].elements[0] = Slot {
    count: orig_counts[i],
    id: i,
  };
}
```

At some point while looking at my `MiniVec` and `Slot` structs, I realized that there was actually no need to store the count in the slots at all.  The sizes of files never change, so it can just be looked up directly from the `orig_counts` vector I built up while parsing the input.

<div class="good">This is a very impactful change because it not only makes the initialization of the slots simpler, but also reduces the size of <code>Slot</code> and <code>MiniVec</code> by nearly half. This in turn cuts the amount of data that has to get copied around while moving files.</div>

While chatting in the AoC channel in the Rust Discord server, Giooschi (who consistently created extremely well-optimized solutions for nearly every day of AoC) mentioned that he'd seen success in improving performance by using smaller integer types for his data.  The memory footprint of Day 9 was higher than other days, so reducing memory to improve cache hit rate yielded good results.

Following that advice, I cut the size of many of my local variables as well as the fields in `Slot` and `MiniVec`.  I reduced the `id` field of `Slot` from `usize` to `u16` - the smallest type that can hold the max file ID of 9999 - and trimmed down the `len` of `MiniVec` to match.  That left those structs looking like this:

```rs
struct Slot {
  id: u16
}

struct MiniVec {
  len: u16,
  elements: [Slot; 6],
}
```

After making those changes, I was surprised to see that `MiniVec` had been simplified to such a degree that the whole struct was only 14 bytes large!  Given that miniature memory footprint, I got some new ideas for how to make their initialization more efficient.

### `const` `MiniVec` Initialization

One thing I tried was pre-computing the entire contents of the `Vec<MiniVec>` at compile time.  Using modern Rust, this is actually possible without needing any macros or build scripts:

```rs
const fn build_empty_slots() -> [MiniVec; 10_000] {
  let mut arr: [MiniVec; 10_000] = unsafe { std::mem::MaybeUninit::uninit().assume_init() };
  let mut i = 0usize;
  loop {
    arr[i].len = 1;
    arr[i].elements[0].id = i as u32;

    i += 1;
    if i == arr.len() {
      break;
    }
  }
  arr
}
```

<div class="bad">However, the result was a severe drop in performance using this <code>const</code> initialization method.</div>

This happened because all of that memory had to be copied into the vector at some point, and the overhead of doing that big `memcpy` far outweighed the initialization code that was going on previously.

### SIMD Initialization

Thanks for `MiniVec`'s new even more mini size, it's now small enough to fit other places - like into a SIMD vector register.  Two of them can fit in a single 256-bit `ymm` register, in fact.  This made me wonder if it would be possible to use some SIMD to speed up the population of that array.

Before I did this, I padded out the size of `MiniVec` to an even 16 bytes.  Most CPUs _really_ like working with aligned data, and this change would probably be worthwhile even if I didn't end up using any SIMD for initialization.  For SIMD, it has the added benefit of allowing two `MiniVec`s to be cleanly written at a time with no overlap.

Rust makes it easy to define a custom alignment for structs like this:

```rs
#[repr(align(16))]
struct MiniVec {
  pub len: u16,
  pub elements: [Slot; 6],
}
```

So after that change, the memory layout of `MiniVec` looks like this:

<img alt="A diagram created with TikZ illustrating the memory layout of the `MiniVec` struct used in the optimized solution for Advent of Code 2024 day 9 part 2.  The diagram shows a rectangle subdivided into 16 squares representing 16 bytes of memory.  There are thicker boxes drawn around each pair of two bytes, each of which is labeled.  From left to right, the labels say: length, id 0, id 1, id 2, id 3, id 4, id 5, Padding.  The two bytes under the padding label are shaded a lighter color of gray compared to the others." style="display: flex; width: 100%; max-width: 800px; margin-left: auto; margin-right: auto; border: 1px solid #747474aa;" src="https://i.ameo.link/cpo.svg"></img>

And our goal is to write out a big span of memory so that it ends up like this:

<img alt="A grid with 4 rows and 16 columns which represents the memory layout of a packed series of `MiniVec`s.  There are thicker boxes drawn around each pair of two bytes, and each pair is labeled with a number.  Most of the numbers are zero, but the numbers representing the length of each `MiniVec` are always 1.  The boxes representing the 'id 0' field have monotonically increasing numbers counting up from 1 and are colored in blue." style="display: flex; width: 100%; max-width: 800px; margin-left: auto; margin-right: auto; border: 1px solid #747474aa;" src="https://i.ameo.link/cpp.svg"></img>

To do this with SIMD, I treat `MiniVec` as essentially being a `[u16; 8]`.  The compiler can (and does) change the order of fields in structs, but that doesn't matter since all the inner fields are guaranteed to have 16-bit alignment - matching them up with individual lanes of a `u16x16` SIMD vector.

To start, I initialize my SIMD vector of `MiniVec`s to write using a bit of `transmute`.  It's all just bits at the end of the day:

```rs
let data: [u16; 16] = std::mem::transmute([
  MiniVec {
    len: 1,
    elements: [
      Slot { id: 0 },
      Slot { id: 0 },
      Slot { id: 0 },
      // ...
    ],
  },
  MiniVec {
    len: 1,
    elements: [
      Slot { id: 1 },
      Slot { id: 0 },
      Slot { id: 0 },
      // ...
    ],
  },
]);
let data = u16x16::from_array(data);
```

Then, each turn of the loop I add this vector to it:

```rs
let to_add: [u16; 16] = std::mem::transmute(
  [MiniVec {
    len: 0,
    elements: [
      Slot { id: CHUNK_SIZE as u16 },
      Slot { id: 0 },
      Slot { id: 0 },
      // ...
    ],
  }; 2],
);
let to_add = u16x16::from_array(to_add);
```

So each turn of the loop, the IDs of the first slots in the `MiniVec`s get incremented by 1 while leaving the `len` field the same.  This results in a beautiful unrolled inner loop that consists purely of add and store operations:

```nasm
.LBB0_25:
vpaddw  ymm9, ymm0, ymm1
vpaddw  ymm11, ymm0, ymm2
vpaddw  ymm10, ymm0, ymm3
vmovdqa ymmword ptr [rdx - 224], ymm0
add     rcx, 8
vmovdqa ymmword ptr [rdx - 192], ymm9
vmovdqa ymmword ptr [rdx - 160], ymm11
vmovdqa ymmword ptr [rdx - 128], ymm10
vpaddw  ymm11, ymm0, ymm4
vpaddw  ymm10, ymm0, ymm5
vmovdqa ymmword ptr [rdx - 96], ymm11
vmovdqa ymmword ptr [rdx - 64], ymm10
vpaddw  ymm11, ymm0, ymm6
vpaddw  ymm10, ymm0, ymm7
vpaddw  ymm0, ymm8, ymm0
vmovdqa ymmword ptr [rdx - 32], ymm11
vmovdqa ymmword ptr [rdx], ymm10
add     rdx, 256
cmp     r15, rcx
jne     .LBB0_25
```

Although this does entail writing more raw data to memory than a method that sparsely initializes the `len` and `elements[0]` fields, this SIMD method ends up being slightly faster.  This is probably because it's able to write more data per instruction, and there are no data dependencies on the results of those writes.

As a result of all of these changes, the solution's speed improved by a whopping 23.6%, putting the new runtime at **25.14µs**.

Most of these gains came from using the smaller integer sizes, trimming `MiniVec`, and dropping the needlessly stored `size` field in `Slot`.  Simplifying those types facilitated a sort of chain reaction of optimizations that resulted in a huge (relative) improvement in performance.

<!--
8a2d2407743be09deb5e9f01825442fd8d3aeb1a (MINUS pop_front opt)
25.14µs PC
-->

## Optimized `MiniVec::pop_front()`

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px" class="timing-diff"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family:'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">24.7µs <span style="margin-left: 5px; color: #4dc617">(-1.8%)</span></div></div>

At some point, I found a neat little optimization to make the performance of `pop_front()` on `MiniVec` much simpler.

If you remember back, `pop_front` is used when moving files down in the case that there are other files in the same span that exist after it.  It was previously implemented the obvious way by copying all of those `Slot`s down and decrementing `len`.

This is a (comparatively) expensive operation that requires a good bit of code to accomplish, so I thought up a way to avoid it completely.

Instead of touching `len` or any other elements, I manually pushed one extra `0` to the end of the `orig_counts` vector which stores the size of each file in the input.  Then, when removing the first element from a `MiniVec`, I just set its id to `ID_COUNT + 1` so it will be read as a zero during checksumming.  Since a checksum operation on a file with id=0 returns zero, this has the same effect as deleting the file while only requiring a single instruction to implement.

It's pretty rare for this code path to be needed though, so this change only resulted in a 1.8% perf uplift, bringing the runtime down to **24.7µs**.  We certainly take those, though.

<!--
8a2d2407743be09deb5e9f01825442fd8d3aeb1a clean
24.7µs PC
-->

## Fine-Tuning

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px" class="timing-diff"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family:'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">23.28µs <span style="margin-left: 5px; color: #4dc617">(-5.7%)</span></div></div>

At this point, I had pretty much reached the end of my optimization rope.  I had gotten to know this program so well, I could look at any snippet of its decompiled assembly and tell you what piece of the Rust source code it mapped back to.

That being said, I did find a few final tweaks to eek out a last bit of performance:

 * Using a smaller vector size for the free spot finding loop

<div class="note">It turns out that SIMD does provide a tiny benefit for that free-spot finding loop, but only if a tiny vector size of 64 bits is used.</div>

64 bits is smaller than even the smallest 128-bit `xmm` registers, but this is still technically SIMD.  The compiler emits a 64-bit load instruction and just puts the result into a 128-bit register anyway, zeroing out the upper 64 bits.  It seems that the added memory bandwidth of loading more data than that makes using bigger vectors not worth it.

 * Changing all array accesses to use `get_unchecked()`

This change had a surprisingly small impact on performance, and it even seemed to regress performance slightly in a few cases.  Since all of my buffer sizes and input sizes were static anyway, it's not too surprising that the compiler was able to elide many of those bounds checks as it was.

 * Re-order control flow and re-structure some pointer math

I spent some time playing with different pointer offset schemes and variable layouts for the inner loop.  Some of these prompted the compiler to generate quite differently structured code with perf that changed ±5% or so.  But the level we're at now, that's less than 1µs of difference anyway.

<!--
6279fa3f6f371b979c2f476b577c012d5344e854
23.282µs PC
-->

## Final Result

<div class="good padded">That puts the final runtime for the problem on my machine at <b>23.282µs</b>.</div>

That's 3 orders of magnitude faster than where it started.  As is common for this kind of thing, the vast majority of that improvement came from a few comparatively small/simple chnages.

Despite that, don't think I can claim that my solution is "optimal".  Especially when considering the fact that some changes sped up code locally while regressing it on the benchmark bot (which even has a very similar CPU architecture to my own), I wouldn't be surprised if it was be possible to make significant progress beyond this point.

My final code for Day 9 can be found [on Github](https://github.com/Ameobea/advent-of-code-2024/blob/main/src/day9.rs) if you'd like to take a look or try your hand at pushing it even further.

And here's the full disassembly [on Godbolt](https://rust.godbolt.org/z/bef76sP4T).

## Takeaways

Here are my main takeaways:

 - Rust's Portable SIMD is quite mature and very usable at this point.
   - It's missing a few specialized pieces of functionality, but it's more than sufficient for most use cases.
   - It can produce performance on-par with hand-crafted solutions through a very ergonomic and `unsafe`-free API.
 - Having a good algorithm and data structures is more important than having an extremely well optimized implementation.  That's not new info, but this experience certainly re-affirms it.
 - Advent of Code is a great way to learn high-peformance Rust, especially if you hang out and learn from the people in [the Discord](https://discord.gg/rust-lang-community).
 - Modern CPUs are extremely complicated, and their performance characteristics are hard to predict and vary widely between different architectures and models.  The only real way to know if a change will be beneficial to performance is to try it out and benchmark the results.

I'm sure most of that won't be news to you if you browse any other performance-focused blogs or writings.

<div class="good">The main reason I spent the time doing this optimization is because it's extremely fun!</div>

There are few things as satisfying as scraping away layers of overhead from code and seeing that runtime number slowly but surely grow smaller and smaller.  Plus, the friendly competition of competing on the benchbot leaderboard added a lot as well.

----

I've written [other](https://cprimozic.net/blog/speeding-up-webcola-with-webassembly/) optimization retrospective posts like these as well if you're interested. To catch future posts like this, you can subscribe to my blog via RSS at the top of the page, or follow me on the platform of your choice:

 - Bluesky [@ameo.dev](https://bsky.app/profile/ameo.dev)
 - Twitter [@ameobea10](https://twitter.com/ameobea10)
 - Mastodon [@ameo@mastodon.ameo.dev](https://mastodon.ameo.dev/@ameo)
