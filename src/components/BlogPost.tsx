import React, { useEffect } from 'react';
import { graphql } from 'gatsby';
import rehypeReact from 'rehype-react';

import WavetableDemo from './WavetableDemo';
import Layout from './layout';
import RssIcon from '../images/rss.svg';
import './BlogPost.ccss';

const renderAst = new rehypeReact({
  createElement: React.createElement,
  components: { 'wavetable-demo': WavetableDemo },
}).Compiler;

export const query = graphql`
  query ($slug: String!) {
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
  htmlContent
    ? htmlContent.replace(/<a href="\//g, '<a href="/blog/')
    : htmlContent;

const patchHTMLAST = (ast) => {
  // There is a funny bug somewhere in one of the dozens-hundreds of libraries being used to transform markdown which
  // is causing a problem with `srcset`.  Images are being converted into HTML in the markdown which automatically
  // references the sources of the generated resized/converted images.  The generated `srcset` prop is being somehow
  // converted into an array of strings before being passed to `rehype-react` which is then concatenating them and
  // generating invalid HTML.
  //
  // This code handles converting `srcset` arrays into valid strings.
  if (ast.properties?.srcSet && Array.isArray(ast.properties.srcSet)) {
    ast.properties.srcSet = ast.properties.srcSet.join(', ');
  }
  if (ast.children) {
    ast.children = ast.children.map(patchHTMLAST);
  }
  return ast;
};

const AboveFoldContent: React.FC = () => (
  <div className="above-fold-content">
    <a
      href="/rss.xml"
      style={{
        display: 'block',
        marginTop: -18,
        marginBottom: 4,
        textAlign: 'right',
      }}
    >
      Subscribe to Blog via RSS{' '}
      <img
        src={RssIcon}
        style={{
          height: 18,
          width: 18,
          marginBottom: -3,
          marginTop: -21,
          marginLeft: 6,
        }}
      />
    </a>
  </div>
);

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
        <AboveFoldContent />

        {post.tableOfContents ? (
          <div className="markdown-remark-toc-wrapper">
            <div
              className="markdown-remark-toc"
              dangerouslySetInnerHTML={{
                __html: fixTOCLinks(post.tableOfContents),
              }}
            />
          </div>
        ) : null}
        {post.htmlAst ? renderAst(patchHTMLAST(post.htmlAst)) : null}
      </div>
    </Layout>
  );
};
