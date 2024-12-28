---
title: 'Optimizing Advent of Code 2024 (TODO BETTER TITLE)'
date: '2024-12-28'
opengraph: "{\"TODO\": \"TODO\"}"
---

TODO

## Overview

<img alt="A diagram demonstrating how the algorithm for day 9 part 2 of Advent of Code 2024 operates.  It shows rows of cells filled with numbers of blanks.  Each row shows the state of the filesystem after one iteration of defragmenting.  There are arrows drawn to indicate where files are removed from and written to." style="display: flex; width: 100%; max-width: 740px; margin-left: auto; margin-right: auto; border: 1px solid #747474aa;" src="https://i.ameo.link/cpa.svg"></img>

## Initial Solution

cccabd1
139ms PC

## Tree-Based Solution

379fd454d5906b771336569fa1775ccb02cc25ef (minus `start_span_ix_by_needed_size` accounting)
25ms PC

## Start Span Index Accounting / `start_span_ix_by_needed_size`

379fd454d5906b771336569fa1775ccb02cc25ef
224µs PC

<img alt="A diagram showing the tree structure used to solve Advent of Code 2024 day 9 part 2.  It has two rows of boxes with arrows pointing to each other in a chain from left to right.  The boxes represent slots in the filesystem described by the problem and  contain text indicating the contents of each slot like '1 x 1' or '1 x <null set>'.  The bottom row has a special split node indicated by [...|...] which branches off in a tree to additional nodes which represent the strategy used by the algorithm to split a free space node into a filled node and a smaller free space node while retaining ordering." style="display: flex; width: 100%; max-width: 800px; margin-left: auto; margin-right: auto; border: 1px solid #747474aa;" src="https://i.ameo.link/cpb.svg"></img>

## Flattened Spans Solution

bb506718ee08d212a765ac4c3384aa4eb3d5a979
85.3µs PC

<img alt="A diagram created with TikZ to illustrate a data structure for solving advent of code 2024 day 9 part 2.  It show two rows of nested nodes that represent slots of filled and free space on an imaginary filesystem.  The nodes are split in the middle with the left showing a set of contiguous files with different IDs along with their sizes, and the right side shows how much free space is available after that file indicated by the null set symbol.  The first row shows the original filesystem layout after parsing and the second shows the result after running the algorithm for the problem." style="display: flex; width: 100%; max-width: 800px; margin-left: auto; margin-right: auto; border: 1px solid #747474aa;" src="https://i.ameo.link/cpc.svg"></img>

 * If removing the first element of a span (which is always the only element removed) that has elements behind it, its free space is added to the span before it.

## Spans SoA

266ae4e
92.3µs PC

<img alt="A diagram created with TikZ to demonstrate a struct-of-arrays scheme applied to the data structures used to solve Advent of Code 2024 day 9 part 2. There are two rows showing labeled 'Stored Files' and 'Empty Space'. The stored files row has nested cells which contain a length and 4 inner data entries, some of which are empty. The empty spaces row is a simple one-dimensional array which contains a single digit in each cell." style="display: flex; width: 100%; max-width: 800px; margin-left: auto; margin-right: auto; border: 1px solid #747474aa;" src="https://i.ameo.link/cpj.svg"></img>

## `MiniVec`

7443ee33e452faa8fb5a25d2590db0f35dc032c7
70µs PC

 * Profiled and noticed that the check to see if `SmallVec` had spilled to the heap or not was very hot
 * Picked a constant for max vector size with no spilling.  Technically invalid, but works for all tested inputs.

## Constant-Time Checksumming

47b1b66685e2c251e2eb265a1a4bc404fb238859
64.7µs PC

## Better Input Parsing

b5283592678d5951e632532cb87bc38788fae9ab
58.7µs PC

 * Reduce allocations, pre-allocate vectors, sparse minivec initialization

## SIMD Input Parsing

> NOW BASING OFF OF: 69638bb81aca90d77ec7f9d8b7b04d8c4f732499
> branch: manual-2
> With manual removals

524aa7eb99803c8b33af14ae96882bf15197e779
37.4µs PC

 * aligned input vector as well as data vectors for counts + free lists

## SIMD Free Spot Scanning

TODO

7c4f449f44e728589f6451d32e6cc6172b71bea6
39.1µs PC

## `max_unmoved_src_id` Accounting

a7137edf0877d264ff949d7097b3d93555e4b620
34.170µs PC

 - allows fully empty chunks at the end to be skipped during checksum computation

## `finished_digit_count` Bookkeeping

ee872a0e07037a4de59889185f2e30da400b3d1b
> this also puts us even with 69638bb81aca90d77ec7f9d8b7b04d8c4f732499
32.915µs PC

 - allows for early exit of the main loop after we've found a stopping place for every char
 - includes code that marks all bigger digits finished as well as the current digit since if
   there's no space left to fit 5, no way you can fit 6+ either.
   - This emits a `memset` call I can't get rid of, but since this path is only going to get hit
     a few times it's cold enough to not matter + be worth it

## SIMD `MiniVec` Initialization

8a2d2407743be09deb5e9f01825442fd8d3aeb1a (MINUS pop_front opt)
25.14µs PC

 * using smaller int sizes for data and locals
 * fit `MiniVec` inside 16 bytes with manual padding
   - removed the count from slots and look them up from the original array instead
 * Pure SIMD initialization of minivecs
   - compiles into a beautiful 10x unrolled loop of basically pure SIMD
   - writes the correct ID into the vector
   - very slightly faster than manually setting just the 4-byte (len, id0) part, probably because we can set two at once with SIMD and it's cacheline-sized anyway

<img alt="TODO" style="display: flex; width: 100%; max-width: 800px; margin-left: auto; margin-right: auto; border: 1px solid #747474aa;" src="https://i.ameo.link/cpo.svg"></img>

<img alt="TODO" style="display: flex; width: 100%; max-width: 800px; margin-left: auto; margin-right: auto; border: 1px solid #747474aa;" src="https://i.ameo.link/cpp.svg"></img>

## Optimized `MiniVec::pop_front()`

8a2d2407743be09deb5e9f01825442fd8d3aeb1a clean
24.7µs PC

## Fine-Tuning

6279fa3f6f371b979c2f476b577c012d5344e854
23.282µs PC

 - smaller vector size for the inner empty slot finding loop
   - turns out that u8x8 faster than u8x16 faster than u8x32
   - u8x8 is pretty slightly - but significantly - faster than u8x16 on both local and benchmark
     machine
   - the same SIMD instruction, operating on 128-bit XMM register, is used for u8x8 case, just
     with top bits zeroed
   - the overhead of fetching just 64 extra bytes seems to outweigh the cost of having less chance
     of finding the needle in the first vector
 - Use `get_unchecked` everywhere
 - Moved around some math in the inner empty slot checking loop which impacted code layout and had little perf impacts
