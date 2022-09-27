import React, { Suspense, useEffect } from 'react';
import { graphql } from 'gatsby';
import rehypeReact from 'rehype-react';

import CollapsibleNNViz from './CollapsibleNNViz';
import Layout from './layout';
import RssIcon from '../images/rss.svg';
import './BlogPost.css';

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

const getPostMetadata = (
  post: any
): { image: string | null; meta: any; description?: string } | null => {
  if (post.frontmatter?.title.includes('Webcola')) {
    return {
      image: 'https://ameo.link/u/921.png',
      meta: [
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: 'https://ameo.link/u/921.png' },
        {
          name: 'twitter:image:alt',
          content:
            'A screenshot of the spotify artist relationship graph from my Spotifytrack site, which was produced using WebCola',
        },
      ],
    };
  } else if (post.frontmatter?.title.includes('Exploring Neural Networks')) {
    return {
      image: 'https://nn.ameo.dev/nn-viz-og2.jpeg',
      description:
        'Introduces a browser-based sandbox for building, training, visualizing, and experimenting with neural networks.  Includes background information on the tool, usage information, technical implementation details, and a collection of observations and findings from using it myself.',
      meta: [
        { name: 'twitter:card', content: 'summary_large_image' },
        {
          name: 'twitter:image',
          content: 'https://nn.ameo.dev/nn-viz-og2.jpeg',
        },
        { name: 'og:image:width', content: '1129' },
        { name: 'og:image:height', content: '747' },
        {
          name: 'og:image:alt',
          content:
            'A screenshot of the neural network sandbox web application showing various visualizations including network response visualization, layers visualization, neuron response plot, and costs plot',
        },
        {
          name: 'twitter:image:alt',
          content:
            'A screenshot of the neural network sandbox web application showing various visualizations including network response visualization, layers visualization, neuron response plot, and costs plot',
        },
      ],
    };
  } else if (
    post.frontmatter?.title
      .toLowerCase()
      .includes('logic through the lens of neural networks')
  ) {
    return {
      image: 'https://nn-logic-demos.ameo.dev/nn-logic-og.png',
      description:
        "A chronicle of findings and observations I've made while experimenting with learning logic and neural networks.  Topics include developing a new activation function, estimating Boolean and Kolmogorov complexity, and reverse-engineering a neural network's solution.",
      meta: [
        { name: 'twitter:card', content: 'summary_large_image' },
        {
          name: 'twitter:image',
          content: 'https://nn-logic-demos.ameo.dev/nn-logic-og.png',
        },
        { name: 'og:image:width', content: '630' },
        { name: 'og:image:height', content: '630' },
        {
          name: 'og:image:alt',
          content:
            "A screenshot of a 3D wireframe cube with some areas filled in with colored voxels.  The cube's corners are labeled with input combinations like TTF, TFT, FFF",
        },
        {
          name: 'twitter:image:alt',
          content:
            "A screenshot of a 3D wireframe cube with some areas filled in with colored voxels.  The cube's corners are labeled with input combinations like TTF, TFT, FFF",
        },
      ],
    };
  } else if (
    post.frontmatter?.title
      .toLowerCase()
      .includes('depth-based fragment culling')
  ) {
    return {
      image: 'https://ameo.link/u/aix.png',
      meta: [
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: 'https://ameo.link/u/aix.png' },
        { name: 'og:image:width', content: '1371' },
        { name: 'og:image:height', content: '806' },
        {
          name: 'og:image:alt',
          content:
            'A visualization of the output of the depth pass used as a part of the depth-based fragment culling algorithm.  Half of the image shows the depth pass output while the other half shows the fully rendered scene side by side.',
        },
        {
          name: 'twitter:image:alt',
          content:
            'A visualization of the output of the depth pass used as a part of the depth-based fragment culling algorithm.  Half of the image shows the depth pass output while the other half shows the fully rendered scene side by side.',
        },
      ],
    };
  }

  return null;
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
