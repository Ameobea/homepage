import init, { init_triangles, generate, render } from './engine.js';

const CHAIN_COUNT = 3;
const FPS = 24;

const start = async () => {
  await init();
  init_triangles(window.innerWidth, window.innerHeight);
  for (let i = 0; i < CHAIN_COUNT; i++) {
    render(i);
  }

  const handle = setInterval(() => {
    try {
      for (let i = 0; i < CHAIN_COUNT; i++) {
        generate(i);
      }
    } catch (err) {
      clearInterval(handle);
      console.error('Error generating triangle chain:', err);
    }
  }, 1000 / FPS);
};

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  start().catch((err) => console.error('Error initializing triangles:', err));
}
