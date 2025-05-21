import React, { Suspense, useEffect } from 'react';
import { graphql } from 'gatsby';
import rehypeReact from 'rehype-react';

import CollapsibleNNViz from './CollapsibleNNViz';
import Layout from './layout';
import RssIcon from '../images/rss.svg';
import './BlogPost.css';
import 'katex/dist/katex.min.css';

const LazyWavetableDemo = React.lazy(() => import('./WavetableDemo'));

const WavetableDemo: React.FC = () => (
  <Suspense fallback={<>Loading...</>}>
    <LazyWavetableDemo />
  </Suspense>
);

const renderAst = new rehypeReact({
  createElement: React.createElement,
  components: {
    'wavetable-demo': WavetableDemo,
    'collapsible-nn-viz': CollapsibleNNViz,
  },
}).Compiler;

export const query = graphql`
  query ($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      htmlAst
      tableOfContents
      frontmatter {
        title
        opengraph
        description
        imageUrl
        imageAlt
        imageWidth
        imageHeight
        date
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
        marginTop: -16,
        marginBottom: 4,
        textAlign: 'right',
        marginLeft: 'auto',
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

interface Opengraph {
  image?: string | null;
  meta?: { name: string; content: string }[];
  description?: string;
}

const getPostMetadata = (post: any): Opengraph | null => {
  if (!post.frontmatter) {
    return null;
  }

  if (post.frontmatter.opengraph) {
    return JSON.parse(post.frontmatter.opengraph);
  }

  const opengraph: Opengraph = {
    meta: [{ name: 'article:published_time', content: post.frontmatter.date }],
  };
  if (post.frontmatter.description) {
    opengraph.description = post.frontmatter.description;
  }
  if (post.frontmatter.imageUrl) {
    opengraph.meta!.push({
      name: 'og:image',
      content: post.frontmatter.imageUrl,
    });
  }
  if (post.frontmatter.imageAlt) {
    opengraph.meta!.push({
      name: 'og:image:alt',
      content: post.frontmatter.imageAlt,
    });
  }
  if (post.frontmatter.imageWidth) {
    opengraph.meta!.push({
      name: 'og:image:width',
      content: post.frontmatter.imageWidth.toString(),
    });
  }
  if (post.frontmatter.imageHeight) {
    opengraph.meta!.push({
      name: 'og:image:height',
      content: post.frontmatter.imageHeight.toString(),
    });
  }

  if (Object.keys(opengraph).length === 0) {
    return null;
  }

  return opengraph;
};

export default ({ data: { markdownRemark: post } }) => {
  useEffect(() => {
    try {
      (window as any).pauseTriangles();
    } catch (_err) {
      // pass
    }
    try {
      document.getElementById('svg')!.style.visibility = 'hidden';
    } catch (_err) {
      // pass
    }

    return () => {
      try {
        (window as any).resumeTriangles();
      } catch (_err) {
        // pass
      }
      try {
        document.getElementById('svg')!.style.visibility = 'visible';
      } catch (_err) {
        // pass
      }
    };
  });

  const metadata = getPostMetadata(post);

  return (
    <Layout
      title={post.frontmatter.title}
      description={metadata?.description}
      siteName="Casey Primozic's Blog"
      style={{ maxWidth: 880 }}
      image={metadata?.image ?? null}
      meta={metadata?.meta}
    >
      <div className="blog-post">
        <h1>{post.frontmatter.title}</h1>
        <time className="published-at" dateTime={post.frontmatter.date}>
          {post.frontmatter.date}
        </time>
        <AboveFoldContent />
        <div className="spacer" style={{ height: 6 }} />

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
