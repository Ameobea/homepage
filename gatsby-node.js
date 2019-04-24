const path = require('path');
const { createFilePath } = require('gatsby-source-filesystem');

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

const queryAllMarkdownRemark = graphql =>
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

exports.createPages = ({ graphql, actions: { createPage } }) =>
  new Promise((resolve, reject) => {
    queryAllMarkdownRemark(graphql).then(result => {
      result.data.allMarkdownRemark.edges.forEach(({ node }) => {
        createPage({
          path: `blog${node.fields.slug}`,

          component: path.resolve('./src/components/BlogPost.tsx'),
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
