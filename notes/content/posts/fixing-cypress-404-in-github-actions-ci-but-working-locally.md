+++
title = "Fixing Cypress Tests Failing with 404 Errors in Github Actions CI but Working Locally"
date = "2024-11-24T18:58:31-08:00"
+++

I have some very basic Cypress tests set up for one of my personal projects - a single-page application created with React.  I have some simple Github Actions configured to automatically run those tests every time I push to the repository.

At some point somewhat randomly, those tests started failing in CI.  It was probably due to some dependency getting upgraded or a change in the environment in which Github Actions runs.  The tests still ran fine locally when using the same commands and configuration, though, and I struggled to figure out why.

I was using the official [Cypress Github Action](https://github.com/cypress-io/github-action) to run the tests.  The config I was using is very basic with little to nothing special going on

```yml
  cypress-test:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4

      - name: Download built site artifacts
        uses: actions/download-artifact@v4.1.7
        with:
          name: dist
          path: ./dist

      # Run Cypress tests
      - name: Cypress Run
        uses: cypress-io/github-action@v6
        with:
          browser: chrome
          start: yarn cypress:serve
          wait-on: 'http://localhost:9000'
```

Here's the error I was getting in CI:

```txt
  2) Entrypoint
       Should render composition 46 without errors:
     CypressError: `cy.visit()` failed trying to load:

http://localhost:9000/composition/46

The response we received from your web server was:

  > 404: Not Found

This was considered a failure because the status code was not `2xx`.
```

When running Cypress locally, all the tests pass without issue.

The application I was testing is a single-page app.  The `/composition/46` path doesn't map to anything on the filesystem and instead is handled by the application itself.  I had configured my `cypress:serve` script using [`http-server`](https://www.npmjs.com/package/http-server) to proxy missing URLs back to the root `index.html` file, just like other SPA dev servers do.

And here's what I had in my package.json for that `cypress:serve` script:

```json
{
  "scripts": {
     "cypress:serve": "http-server dist -p 9000 -P http://localhost:9000? -c-1"
  }
}
```

To re-iterate, this command works totally fine when running locally.  I can run `yarn cypress:serve`, navigate to <http://localhost:9000/composition/43>, and view the expected page which is returned with a 200 response code.

## The Problem + The Fix

After multiple hours of banging my head against this problem, I finally figured out what was causing the issue.

For whatever reason, using `localhost` in the proxy path for the `http-server` command doesn't work in Github Actions.  I'm not sure if it has something to do with DNS, ipv6, the networking that GH Actions uses to communicate between commands, or something else.

In any case the fix turned out to be as easy as replacing `localhost` with `127.0.0.1` in my `http-server` command:

```diff
diff --git a/package.json b/package.json
index 1331d39..c6ba50e 100644
--- a/package.json
+++ b/package.json
@@ -51,7 +51,7 @@
     "prettier": "prettier --write \"src/**/*.{ts,js,tsx}\"",
     "cypress:open": "cypress open",
     "cypress:run": "cypress run --browser chrome",
-    "cypress:serve": "http-server dist -p 9000 -P http://localhost:9000? -c-1"
+    "cypress:serve": "http-server dist -p 9000 -P http://127.0.0.1:9000? -c-1"
   },
   "dependencies": {
     "@pixi/app": "^7.4.2",
```

So if you're having similar issues and use a similar setup, give that a try.
