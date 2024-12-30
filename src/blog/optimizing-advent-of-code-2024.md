---
title: 'Optimizing Advent of Code 2024 (TODO BETTER TITLE)'
date: '2024-12-28'
opengraph: "{\"TODO\": \"TODO\"}"
---

I took part in [Advent of Code 2024](https://adventofcode.com/2024) this year.  It's a yearly event where a new holiday-themed programming puzzle is released every day of December through Christmas, and people from all across the internet compete to see who can solve them the fastest.

<div class="note">I also took part in a side competition in the <a href="https://discord.gg/rust-lang-community" target="_blank">Rust language community Discord server</a> to see who can create the solution that <i>runs</i> the fastest.</div>

It's a great place to experiment around with writing low-level, high-performance Rust and learn from some extremely smart people who also competing and discussing their solutions in the chat.

One problem in particular stood out to me as perfect for this: **Day 9 Part 2**.  The core algorithm itself is quite simple and easy to implement, but I was surprised again and again as I worked by just how much room there was to make it faster.

This post is a summary of the individual improvements I made to my solution to speed it up.  I profiled it at each step to get an idea of how much each change contributed to the final speedup.  There's a nice spread of high-level algorithmic shortcuts, bespoke data structures, and low-level optimizations with SIMD that all contribute to my final program.

## Algorithm

I'll give a quick rundown of the actual Day 9 Part 2 problem to start off.  You can check it out yourself on the [AoC website](https://adventofcode.com/2024/day/9), but you'll have to complete part 1 before revealing the second part.

The problem describes an imaginary storage disk represented by an array data blocks.  Each block can either be empty or contain data for a file.  Each file has an ID which is assigned based on the order at which it initially appears on the disk.

The puzzle's input is ASCII text consisting of a list of numbers like this:

```
12211211201111
```

(although the actual puzzle input is much longer).

This input is used to encode the contents of the disk as alternating files and free spaces.

 - The first digit is the size of the first file, which starts at the beginning of the disk
 - The second digit is the number of free blocks following that file
 - The third digit is the size of the second file
 - The fourth digit is the number of free blocks following that file

... and so on for the rest of the input.

That example input yields the following disk layout when decoded:

<img alt="A diagram generated with TikZ showing the layout of the disk after parsing the example input.  It shows an array of boxes, some of which are filled with numbers and some of which are empty.  These represent the ordering of disk sectors and the ID of the file which occupies it (the number)." style="display: flex; width: 100%; max-width: 740px; margin-left: auto; margin-right: auto; border: 1px solid #747474aa;" src="https://i.ameo.link/cps.svg"></img>

The goal of our program is to perform a sort of defragmentation operation on this virtual disk, packing the files together more efficiently.

Here's the description of the actual algorithm directly from the Advent of Code site:

> Attempt to move whole files to the leftmost span of free space blocks that could fit the file. Attempt to move each file exactly once in order of decreasing file ID number starting with the file with the highest file ID number. If there is no span of free space to the left of a file that is large enough to fit the file, the file does not move.

So given that example input from before, here's how the algorithm would progress step by step:

<img alt="A diagram demonstrating how the algorithm for day 9 part 2 of Advent of Code 2024 operates.  It shows rows of cells filled with numbers of blanks.  Each row shows the state of the filesystem after one iteration of defragmenting.  There are arrows drawn to indicate where files are removed from and written to." style="display: flex; width: 100%; max-width: 740px; margin-left: auto; margin-right: auto; border: 1px solid #747474aa;" src="https://i.ameo.link/cpr.svg"></img>

Once every movable file is moved, the final step is to compute a checksum operation on the full filesystem which serves as the solution to the problem.  To compute it, you multiply the ID of the file stored in each sector by its index (empty sectors get a value of zero) and sum it up.

So for the example above, the checksum is `0*0 + 6*1 + 5*2 + 1+3 + 1*4 + ... = 137`

## Initial Naive Solution

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family:'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">139.1ms</div></div>

I wrote the initial solution to this problem as fast as I could in order to try to rank as high as possible on the leaderboards.  I spent little to no time optimizing for anything other than getting it working quickly.

First, I parsed the input and built up the following variables:

 - `input`: a `Vec<(usize, usize)>` holding `(file_size, free_space)` as parsed directly from the input text
 - `disk`: a `Vec<Option<usize>>` representing the initial state of the disk
 - `data_start_pos`: a `Vec<usize>` holding the index at which each file starts off at in the disk

My inner loop (after some cleanup) looks like this:

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

To benchmark my solutions, I used the excellent [Criterion](https://github.com/bheisler/criterion.rs) library which produces nicely formatted human-readable timings along with information about how much performance changed from the past run.

On my 7950x CPU, this initial solution takes a hefty **139 milliseconds** to run.  Even with that triple-nested loop conspicuously lurking in the code, I was surprised it ran that slowly given that there were only 10,000 files in the input string.

<!--
cccabd1
139ms PC0
-->

## Tree-Based Solution

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family:'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">25.2ms <span style="margin-left: 5px; color: #4dc617">(-81.9%)</span></div></div>

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

You might be a bit confused to see that `Split` variant.  Since copying a file into a free span might leave some extra free space at the end, this will require splitting the span into two.  Implementing these insertions efficiently would require either using a linked list-like data structure to hold these spans (which are notoriously difficult to implement in Rust and also known to be bad for performance).

As a workaround, I added in a separate growable vector of split spans that the parent span points into using those `inner` indices.  These child spans can in turn be split as well, resulting in a tree structure.

Here's how the tree would look after processing the example input from before:

<img alt="A diagram showing the tree structure used to solve Advent of Code 2024 day 9 part 2.  It has two rows of boxes with arrows pointing to each other in a chain from left to right.  The boxes represent spans in the filesystem described by the problem and  contain text indicating the contents of each span like '1 x 1' or '1 x <null set>'.  The bottom row has a special split node indicated by [...|...] which branches off in a tree to additional nodes which represent the strategy used by the algorithm to split a free space node into a filled node and a smaller free space node while retaining ordering." style="display: flex; width: 100%; max-width: 800px; margin-left: auto; margin-right: auto; border: 1px solid #747474aa;" src="https://i.ameo.link/cpb.svg"></img>

The checksum can be computed at the end using a recursive function that walks through the tree and counts the number of sectors that have been processed previously as it goes.

This implementation runs in **25.2 milliseconds** - a healthy improvement!  Getting to skip all of those individual sector checks is absolutely worth any overhead that the tree imposes.

In retrospect, I'm not sure if this custom tree data structure was worth the effort.  I feel like using a linked list here (or some kind of arena-allocated analog) would have been a much more natural fit while probably having similar or better performance.

<!--
379fd454d5906b771336569fa1775ccb02cc25ef (minus `start_span_ix_by_needed_size` accounting)
25ms PC
-->

## Start Span Index Accounting

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family:'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">224µs <span style="margin-left: 5px; color: #4dc617">(-99.1%)</span></div></div>

While debugging my tree-based solution, I had a realization:

<div class="good">Once a file of length <span class="math math-inline"><span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>n</mi></mrow><annotation encoding="application/x-tex">n</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height: 0.4306em;"></span><span class="mord mathnormal">n</span></span></span></span></span> is moved to sector <span class="math math-inline"><span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>i</mi></mrow><annotation encoding="application/x-tex">i</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height: 0.4306em;"></span><span class="mord mathnormal">i</span></span></span></span></span>, all subsequently moved files of length <span class="math math-inline"><span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>n</mi></mrow><annotation encoding="application/x-tex">n</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height: 0.4306em;"></span><span class="mord mathnormal">n</span></span></span></span></span> or greater must end up at a sector index greater than <span class="math math-inline"><span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>i</mi></mrow><annotation encoding="application/x-tex">i</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height: 0.4306em;"></span><span class="mord mathnormal">i</span></span></span></span></span>.</div>

This allows a tremendous amount of work to be skipped - especially as more and more files are moved.  To implement it in my code, I added an array to keep track of the minimum valid start index for each file size:

```rs
let mut start_span_ix_by_needed_size: [usize; 10] = [0; 10];
```

Every time a file is moved, the start indices for its size and all sizes greater than it can be updated:

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

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family: 'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">85.3µs <span style="margin-left: 5px; color: #4dc617">(-61.9%)</span></div></div>

After debugging and analyzing the performance of the tree-based spans for a while, I started to think up ways to improve them and avoid some of the indirection they impose.

The two biggest points I wanted to solve were that:

 - Splitting a span required mutating the tree structure and introducing indirection
 - Free spans were mixed in with empty spans which made finding the next empty span much more expensive than it theoretically needed to be

I wanted to figure out a way to store the spans in a flat manner.  My goal was to be able to scan through spans one after another while looking for a sufficiently large free span without needing to chase pointers or do any kind recursion.

I eventually wound up with a data structure like this:

```rs
struct File {
  pub id: usize,
  pub size: usize,
}

struct Span {
  files: SmallVec<[File; 4]>,
  empty_space: usize,
}
```

Each span holds both an array of files as well as some free space.  They start off with a single file each, matching the pattern of the input where each file is followed by a span of free space.  When files are moved down, the destination span's free space is decreased and the file is just added on to the list of files already there.

In the following visualization, the first row represents the state of the disk after parsing the example input and the second row is how it ends up after the algorithm finishes running.

<img alt="A diagram created with TikZ to illustrate a data structure for solving advent of code 2024 day 9 part 2.  It show two rows of nested nodes that represent spans of filled and free space on an imaginary filesystem.  The nodes are split in the middle with the left showing a set of contiguous files with different IDs along with their sizes, and the right side shows how much free space is available after that file indicated by the null set symbol.  The first row shows the original filesystem layout after parsing and the second shows the result after running the algorithm for the problem." style="display: flex; width: 100%; max-width: 800px; margin-left: auto; margin-right: auto; border: 1px solid #747474aa;" src="https://i.ameo.link/cpc.svg"></img>

I used the [`smallvec`](https://docs.rs/smallvec) crate to store the files for each span.  This saves space for 4 elements to be stored inline without needing to perform any allocations or dynamic resizes.  This is big enough for the vast majority of cases, and since the `File` struct is so small the extra space overhead isn't too big of a deal.

There's one detail that needs to be handled when _removing_ files from these spans.  The file that's moved is always the first one in the span (since files are only moved a single time), but there may be other files that already have been moved into the span after them.

If there are other files in the span after it, then the newly freed space needs to be added to the preceding span instead to preserve correct ordering of the disk.  This trick allows the deletions to be implemented without needing to dynamically add/remove spans from the disk.

These changes result in a >50% reduction in runtime, bringing the total down to **85.3µs**.

<!--
bb506718ee08d212a765ac4c3384aa4eb3d5a979
85.3µs PC
-->

## Spans SoA

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family:'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">92.3µs <span style="margin-left: 5px; color: #e30021">(+8.2%)</span></div></div>

Now we're getting to the point where most of the low-hanging fruit has been picked and we need to dig a bit deeper to improve things.

A common strategy when optimizing things like this is to switch data representation from array-of-structs to structs-of-arrays.  It's a well-documented strategy and generally results in the more efficient code being generated by making things like auto-vectorization a lot easier for the compiler to set up.

I switched my implementation to use SoA for the disk, storing the file `SmallVec`s and empty spaces in separate arrays:

<img alt="A diagram created with TikZ to demonstrate a struct-of-arrays scheme applied to the data structures used to solve Advent of Code 2024 day 9 part 2. There are two rows showing labeled 'Stored Files' and 'Empty Space'. The stored files row has nested cells which contain a length and 4 inner data entries, some of which are empty. The empty spaces row is a simple one-dimensional array which contains a single digit in each cell." style="display: flex; width: 100%; max-width: 800px; margin-left: auto; margin-right: auto; border: 1px solid #747474aa;" src="https://i.ameo.link/cpj.svg"></img>

<div class="warn padded">Surprisingly, switching to SoA actually resulted in a small regression to runtime performance for my code.</div>

My best guess for why this happened is that the split resulted in less efficient cache utilization for the data, or perhaps it introduced greater bounds checking overhead.  Despite this, I decided to stick with this optimization and aim to win back this performance later on.

<!--
266ae4e
92.3µs PC
-->

## `MiniVec`

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family:'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">70µs <span style="margin-left: 5px; color: #4dc617">(-24.2%)</span></div></div>

Now we're getting to the good stuff.

While profiling my code with `perf`, I noticed that a significant amount of time was getting spent in `SmallVec` checks to see if the data had been spilled to the heap or not.  When I actually checked to see how big these vectors were, I noticed that none ever grew to be larger than 6 elements.  This rang true even when testing with other inputs through the benchmark bot.

<div class="note">So, I decided to carry that assumption through to my code and create a custom <code>SmallVec</code> that has a hard-coded cap on max element count.</div>

_Technically_, this assumption isn't completely valid.  You could create an input which has a max-sized free space of 9 into which 9 1-size files are moved, so the actual max size that this vector would need to be is 9.

This is probably the biggest stretch I made for my solution, but despite that it did continue to work for all the inputs included in the benchmark bot - and that was the golden source of truth for correctness we were all working off of.

To implement this change, I created a struct called `MiniVec` to replace the `SmallVec` used previously:

```rs
struct MiniVec {
  pub len: u32,
  pub elements: [File; 6],
}
```

Nothing super special here, but I added in some unsafe bits to my methods for pushing and removing the first element to avoid bounds checks since I knew it would never hit them on any input.

This change was good for a solid 25% bump in performance, bringing the runtime down to **70µs**.

<!--
7443ee33e452faa8fb5a25d2590db0f35dc032c7
70µs PC
-->

## Constant-Time Checksumming

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family:'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">64.7µs <span style="margin-left: 5px; color: #4dc617">(-7.6%)</span></div></div>

As the core of the algorithm slowly became faster and faster, the checksum calculation (which previously had been almost invisible in profiling) had slowly grown to take up a relatively significant portion of the processing time.

Here's the code I had been using to compute the checksum:

```rs
impl File {
  fn checksum(&self, total_prev: usize) -> usize {
    (0..self.count)
      .map(|i| (total_prev + i) * self.id)
      .sum::<usize>()
  }
}
```

`total_prev` represents the total number of disk sectors that came before the start point of the span and is needed since the checksum uses the index of each sector as input.

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

You'll notice that `* id` is now a part of every single factor of this series, so that can be factored out as well leaving us with:

```py
(total_prev * count + (0 + 1 + 2 + ... + (count - 1))) * id
```

If you think back, the `count` comes from the input and has a max value of 9 since each count is a single digit.  This means that there are only 10 possible values for the repeated sum operation - which is a perfect use case for a lookup table.  So I added one in:

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

After all of this, the checksum operation boils down to this:

```rs
let checksum = (total_prev * count + ADD_FACTORIAL_LUT[count]) * id;
```

<div class="good">This makes computing the checksum for a file constant time and extremely efficient as well.</div>

This change only yields a 7.6% speed improvement, bringing the new time down to **64.7µs**.  This is mostly because the checksum computation still wasn't a very large portion of the total runtime.

Despite that, it's still one of the favorite individual optimizations I found for this problem.  Condensing it down to a closed-form solution like that was extremely satisfying to work out.

<!--
47b1b66685e2c251e2eb265a1a4bc404fb238859
64.7µs PC
-->

## Better Input Parsing

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family:'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">58.7µs <span style="margin-left: 5px; color: #4dc617">(-9.3%)</span></div></div>

In a similar spirit as the previous step, I decided to spend a bit of time optimizing the input parsing portion of the algorithm.  Although it only happens once compared to the code in the hot loop which runs thousands of times, there were some clear ways to improve it.

To start out, I pre-allocated all of the vectors using `Vec::with_capacity()`.  We know exactly how big the y need to be statically, so this ensures that the vector don't need to be resized and copied as they're initialized.

For the slots stored as a `Vec<MiniVec>`, I took it a step further.  I used some unsafe code to start the whole vector out as uninitialized and then populated only the pieces of it that needs values, leaving the rest uninitialized.  This is what `Vec` and `SmallVec` do under the hood anyway, so it's fine for use to do it as well.

This resulted in a tidy 9.3% perf improvement, bringing the new total down to **58.7µs**.

<!--
b5283592678d5951e632532cb87bc38788fae9ab
58.7µs PC
-->

## SIMD Input Parsing

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family:'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">37.4µs <span style="margin-left: 5px; color: #4dc617">(-36.3%)</span></div></div>

Now we're getting into the good stuff.

While looking at the input parsing code, I realized that my current parsing code was running essentially character by character.  Given that each character is just a single byte, that incurs a lot of overhead; the CPU is wasting a lot of potential memory bandwidth among other things.

Luckily we have a nice option available to us for having the CPU do multiple things at the same time: SIMD

TODO

 * aligned input vector as well as data vectors for counts + free lists

<!--
> NOW BASING OFF OF: 69638bb81aca90d77ec7f9d8b7b04d8c4f732499
> branch: manual-2
> With manual removals

524aa7eb99803c8b33af14ae96882bf15197e779
37.4µs PC
-->

## SIMD Free Spot Scanning

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family:'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">39.1µs <span style="margin-left: 5px; color: #e30021">(+4.5%)</span></div></div>

TODO

<!--
7c4f449f44e728589f6451d32e6cc6172b71bea6
39.1µs PC
-->

## `max_unmoved_src_id` Accounting

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family:'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">34.17µs <span style="margin-left: 5px; color: #4dc617">(-12.6%)</span></div></div>

TODO

 - allows fully empty chunks at the end to be skipped during checksum computation

<!--
a7137edf0877d264ff949d7097b3d93555e4b620
34.170µs PC
-->

## `finished_digit_count` Bookkeeping

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family:'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">32.92µs <span style="margin-left: 5px; color: #4dc617">(-3.7%)</span></div></div>

TODO

 - allows for early exit of the main loop after we've found a stopping place for every char
 - includes code that marks all bigger digits finished as well as the current digit since if
   there's no space left to fit 5, no way you can fit 6+ either.
   - This emits a `memset` call I can't get rid of, but since this path is only going to get hit
     a few times it's cold enough to not matter + be worth it

<!--
ee872a0e07037a4de59889185f2e30da400b3d1b
> this also puts us even with 69638bb81aca90d77ec7f9d8b7b04d8c4f732499
32.915µs PC
-->

## SIMD `MiniVec` Initialization

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family:'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">25.14µs <span style="margin-left: 5px; color: #4dc617">(-23.6%)</span></div></div>

TODO

 * using smaller int sizes for data and locals
 * fit `MiniVec` inside 16 bytes with manual padding
   - removed the count from spans and look them up from the original array instead
 * Pure SIMD initialization of minivecs
   - compiles into a beautiful 10x unrolled loop of basically pure SIMD
   - writes the correct ID into the vector
   - very slightly faster than manually setting just the 4-byte (len, id0) part, probably because we can set two at once with SIMD and it's cacheline-sized anyway

<img alt="A diagram created with TikZ illustrating the memory layout of the `MiniVec` struct used in the optimized solution for Advent of Code 2024 day 9 part 2.  The diagram shows a rectangle subdivided into 16 squares representing 16 bytes of memory.  There are thicker boxes drawn around each pair of two bytes, each of which is labeled.  From left to right, the labels say: length, id 0, id 1, id 2, id 3, id 4, id 5, Padding.  The two bytes under the padding label are shaded a lighter color of gray compared to the others." style="display: flex; width: 100%; max-width: 800px; margin-left: auto; margin-right: auto; border: 1px solid #747474aa;" src="https://i.ameo.link/cpo.svg"></img>

<img alt="A grid with 4 rows and 16 columns which represents the memory layout of a packed series of `MiniVec`s.  There are thicker boxes drawn around each pair of two bytes, and each pair is labeled with a number.  Most of the numbers are zero, but the numbers representing the length of each `MiniVec` are always 1.  The boxes representing the 'id 0' field have monotonically increasing numbers counting up from 1 and are colored in blue." style="display: flex; width: 100%; max-width: 800px; margin-left: auto; margin-right: auto; border: 1px solid #747474aa;" src="https://i.ameo.link/cpp.svg"></img>

<!--
8a2d2407743be09deb5e9f01825442fd8d3aeb1a (MINUS pop_front opt)
25.14µs PC
-->

## Optimized `MiniVec::pop_front()`

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family:'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">24.7µs <span style="margin-left: 5px; color: #4dc617">(-1.8%)</span></div></div>

TODO

<!--
8a2d2407743be09deb5e9f01825442fd8d3aeb1a clean
24.7µs PC
-->

## Fine-Tuning

<div style="display: flex; flex: 1; width: 100%; margin-top: -54px"><div style="margin-left: auto; display: flex; flex: 0; background: #141414; border: 1px solid #cccccc88; padding: 4px; font-family:'Input Mono', 'Fira Code', Consolas, Monaco, 'Andale Mono','Ubuntu Mono', monospace">23.28µs <span style="margin-left: 5px; color: #4dc617">(-5.7%)</span></div></div>

TODO

 - smaller vector size for the inner empty span finding loop
   - turns out that u8x8 faster than u8x16 faster than u8x32
   - u8x8 is pretty slightly - but significantly - faster than u8x16 on both local and benchmark
     machine
   - the same SIMD instruction, operating on 128-bit XMM register, is used for u8x8 case, just
     with top bits zeroed
   - the overhead of fetching just 64 extra bytes seems to outweigh the cost of having less chance
     of finding the needle in the first vector
 - Use `get_unchecked` everywhere
 - Moved around some math in the inner empty span checking loop which impacted code layout and had little perf impacts

<!--
6279fa3f6f371b979c2f476b577c012d5344e854
23.282µs PC
-->

## Conclusion

 - I very much doubt that my final solution is "optimal", and wouldn't be surprised if I'm not even close!
