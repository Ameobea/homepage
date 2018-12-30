import React from 'react';
import { graphql } from 'gatsby';
import Layout from './layout';

export const query = graphql`
  query($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      frontmatter {
        title
      }
    }
  }
`;

export default ({ data: { markdownRemark: post } }) => (
  <Layout
    title={post.frontmatter.title}
    description={`${
      post.frontmatter.title
    } - Casey Primozic's Personal Technical Blog`}
  >
    <div>
      <h1>{post.frontmatter.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.html }} />
    </div>
  </Layout>
);
