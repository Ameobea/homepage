import React from 'react';
import { graphql } from 'gatsby';

import Layout from './layout';
import './BlogPost.scss';

export const query = graphql`
  query($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      tableOfContents
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
      <div className="markdown-remark-toc-wrapper">
        <div
          className="markdown-remark-toc"
          dangerouslySetInnerHTML={{ __html: post.tableOfContents }}
        />
      </div>
      <div dangerouslySetInnerHTML={{ __html: post.html }} />
    </div>
  </Layout>
);
