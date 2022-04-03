import React, { useState, useEffect, useRef } from 'react';

/**
 * Adapted from https://overreacted.io/making-setinterval-declarative-with-react-hooks/
 */
export const useInterval = (callback, delay, deps = []) => {
  const savedCallback = useRef<() => void>();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback, ...deps]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }

    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay, ...deps]);
};

export const randInt = (min, max) =>
  Math.floor(Math.random() * (max - min) + min);

export const randBool = () => Math.random() > 0.5;

export const getSentry = (): typeof import('@sentry/browser') | undefined =>
  (window as any).sentry;
