export const onClientEntry = () => {
  const wasm = import('./src/engine');
  wasm.then(engine => {
    engine.init(window.innerWidth, window.innerHeight);

    const genAllChains = () => {
      for (let i = 0; i < 3; i++) {
        engine.generate(i);
      }
    };

    for (let i = 0; i < 3; i++) {
      engine.render(i);
    }

    setInterval(genAllChains, 1000.0 / 35.0);
  });
};
