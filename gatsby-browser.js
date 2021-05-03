require('prismjs/themes/prism-okaidia.css');

window.vizStarted = false;
window.sentryInitialized = false;

const maybeInitTriangles = () => {
  if (window.vizStarted) {
    return;
  }
  window.vizStarted = true;

  const wasm = import('./src/engine');
  wasm.then((engine) => {
    try {
      engine.init(window.innerWidth, window.innerHeight);

      const genAllChains = () => {
        try {
          for (let i = 0; i < 3; i++) {
            engine.generate(i);
          }
        } catch (err) {
          // pass
        }
      };

      for (let i = 0; i < 3; i++) {
        engine.render(i);
      }

      setInterval(genAllChains, 1000.0 / 24.0);
    } catch (err) {
      // pass
    }
  });
};

const maybeInitSentry = () => {
  if (
    window.sentryInitialized ||
    window.location.href.includes('://localhost')
  ) {
    return;
  }
  window.sentryInitialized = true;

  require.ensure(['@sentry/browser', '@sentry/tracing'], function (require) {
    const Sentry = require('@sentry/browser');
    const { Integrations } = require('@sentry/tracing');

    Sentry.init({
      dsn: 'https://4978d691a4e44e32880b346327e6626c@sentry.ameo.design/8',
      integrations: [new Integrations.BrowserTracing()],
      tracesSampleRate: 1.0,
    });
  });
};

export const onClientEntry = () => {
  maybeInitSentry();

  maybeInitTriangles();
};
