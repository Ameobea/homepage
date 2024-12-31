// require('prismjs/themes/prism-okaidia.css');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('./src/css/prism-laserwave.css');

window.vizStarted = false;
window.sentryInitialized = false;

const maybeInitTriangles = async () => {
  if (window.vizStarted) {
    return;
  }
  window.vizStarted = true;

  try {
    const engine = await require('./src/engine');
    await engine.default();
    engine.init_triangles(window.innerWidth, window.innerHeight);

    const genAllChains = () => {
      try {
        for (let i = 0; i < 3; i++) {
          engine.generate(i);
        }
      } catch (err) {
        console.error('Error generating triangle chain: ', err);
      }
    };

    for (let i = 0; i < 3; i++) {
      engine.render(i);
    }

    window.trianglesIntervalHandle = setInterval(genAllChains, 1000.0 / 24.0);
    window.pauseTriangles = () => clearInterval(window.trianglesIntervalHandle);
    window.resumeTriangles = () => {
      window.trianglesIntervalHandle = setInterval(genAllChains, 1000.0 / 24.0);
    };
  } catch (err) {
    console.error('Error initializing wasm: ', err);
  }
};

const maybeInitSentry = () => {
  if (
    window.sentryInitialized ||
    window.location.href.includes('://localhost')
  ) {
    return;
  }
  window.sentryInitialized = true;

  require.ensure(['@sentry/browser'], function (require) {
    const Sentry = require('@sentry/browser');
    window.sentry = Sentry;

    Sentry.init({
      dsn: 'https://29e81eafef8bd517b50dbe3209fd3f59@sentry.ameo.design/8',
    });
  });
};

exports.onClientEntry = () => {
  maybeInitSentry();

  maybeInitTriangles();
};
