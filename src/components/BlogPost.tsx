import React, { useEffect } from 'react';
import { graphql } from 'gatsby';
import rehypeReact from 'rehype-react';

import WavetableDemo from './WavetableDemo';
import Layout from './layout';
import './BlogPost.scss';

const renderAst = new rehypeReact({
  createElement: React.createElement,
  components: { 'wavetable-demo': WavetableDemo },
}).Compiler;

export const query = graphql`
  query($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      htmlAst
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
      description={`${post.frontmatter.title} - Casey Primozic's Blog`}
      style={{ maxWidth: 880 }}
      image={(() => {
        if (post.frontmatter.title.includes('Webcola')) {
          return 'https://ameo.link/u/921.png';
        }

        return null;
      })()}
      meta={
        post.frontmatter.title.includes('Webcola')
          ? [
              { name: 'twitter:card', content: 'summary_large_image' },
              { name: 'twitter:image', content: 'https://ameo.link/u/921.png' },
              {
                name: 'twitter:image:alt',
                content:
                  'A screenshot of the spotify artist relationship graph from my Spotifytrack site, which was produced using WebCola',
              },
            ]
          : undefined
      }
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
        {renderAst(post.htmlAst)}
      </div>
    </Layout>
  );
};
