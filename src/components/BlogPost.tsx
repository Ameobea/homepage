import React, { useEffect } from 'react';
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

/**
 * The TOC generation code doesn't know how to handle pages that aren't mounted at the site's root.
 * In order to get around this and allow for the TOC links to work correctly, we must manually
 * insert `/blog` at the beginning of all of the generated links.
 *
 * @param htmlContent The raw HTML of the TOC
 */
const fixTOCLinks = (htmlContent: string): string =>
  htmlContent.replace(/<a href="\//g, '<a href="/blog/');

export default ({ data: { markdownRemark: post } }) => {
  useEffect(() => {
    document.getElementById('svg').style.visibility = 'hidden';

    return () => {
      document.getElementById('svg').style.visibility = 'visible';
    };
  });

  return (
    <Layout
      title={post.frontmatter.title}
      description={`${post.frontmatter.title} - Casey Primozic's Personal Technical Blog`}
    >
      <div className="blog-post">
        <h1>{post.frontmatter.title}</h1>
        <div className="markdown-remark-toc-wrapper">
          <div
            className="markdown-remark-toc"
            dangerouslySetInnerHTML={{
              __html: fixTOCLinks(post.tableOfContents),
            }}
          />
        </div>
        <div dangerouslySetInnerHTML={{ __html: post.html }} />
      </div>
    </Layout>
  );
};
