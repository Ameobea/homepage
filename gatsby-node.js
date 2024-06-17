const path = require('path');
const { createFilePath } = require('gatsby-source-filesystem');
const { RetryChunkLoadPlugin } = require('webpack-retry-chunk-load-plugin');

exports.onCreateNode = ({ node, getNode, actions }) => {
  const { createNodeField } = actions;
  if (node.internal.type === 'MarkdownRemark') {
    const slug = createFilePath({ node, getNode, basePath: 'pages' });
    createNodeField({
      node,
      name: 'slug',
      value: slug,
    });
  }
};

const queryAllMarkdownRemark = (graphql) =>
  graphql(`
    {
      allMarkdownRemark {
        edges {
          node {
            fields {
              slug
            }
            frontmatter {
              title
            }
          }
        }
      }
    }
  `);

exports.createPages = ({ graphql, actions: { createPage } }) => {
  const BlogPost = path.resolve('./src/components/BlogPost.tsx');

  return new Promise((resolve) => {
    queryAllMarkdownRemark(graphql).then((result) => {
      result.data.allMarkdownRemark.edges.forEach(({ node }) => {
        createPage({
          path: `blog${node.fields.slug}`,

          component: BlogPost,
          context: {
            // Data passed to context is available
            // in page queries as GraphQL variables.
            slug: node.fields.slug,
            title: node.frontmatter.title,
          },
        });
      });

      resolve();
    });
  });
};

exports.onCreateWebpackConfig = ({ actions }) =>
  actions.setWebpackConfig({
    experiments: {
      asyncWebAssembly: true,
    },
    plugins: [
      new RetryChunkLoadPlugin({
        // optional stringified function to get the cache busting query string appended to the script src
        // if not set will default to appending the string `?cache-bust=true`
        cacheBust: 'function() { return Date.now(); }',
        // optional value to set the amount of time in milliseconds before trying to load the chunk again. Default is 0
        retryDelay: 300,
        // optional value to set the maximum number of retries to load the chunk. Default is 1
        maxRetries: 5,
        // optional list of chunks to which retry script should be injected
        // if not set will add retry script to all chunks that have webpack script loading
        // chunks: ['chunkName'],
        // optional code to be executed in the browser context if after all retries chunk is not loaded.
        // if not set - nothing will happen and error will be returned to the chunk loader.
        lastResortScript: 'window.location.reload()',
      }),
    ],
  });
