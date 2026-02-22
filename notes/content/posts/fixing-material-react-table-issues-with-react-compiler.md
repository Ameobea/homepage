+++
title = "Fixing `material-react-table` Issues With React Compiler"
date = "2026-02-17T07:54:04-08:00"
+++

## The Problem

I was developing a UI that made use of the [`material-react-table`](https://v2.material-react-table.com/) library, specifically version 2.13.3. I was encountering very strange issues where the rendered table would get stuck, display stale values, or otherwise break in weird and unexpected ways.

Some extra context:

- I was using the `useMaterialReactTable` hook to render the table in lower-level way compared to the top level `MaterialReactTable` component or others
- The issue happened in both dev mode as well as in release mode, but the issues were intermittent and seemed to depend on other unrelated app state in some cases

## The Cause

After much debugging, I finally figured out that the issues were caused by the project's use of [React Compiler](https://react.dev/learn/react-compiler). This is an official React project which is designed to increase efficiency of React apps by analyzing the code and applying optimizations like automatic memoization.

It seems like some of the optimizations applied by `react-compiler` cause issues with the `material-react-table` library or one of its dependencies (the v2 version that we were using anyway).

## The Fix

I added a magical annotation to the component that used the `useMaterialReactTable` hook to disable react compiler for that component:

```ts
const MyComponent = () => {
  'use no memo'

  const table = useMaterialReactTable({ ... })

  // ...
}
```

The problems immediately went away and the table worked fully as I expected in both dev and release modes.
