import React from 'react';
import { graphql, StaticQuery, Link } from 'gatsby';

import Layout from '../../components/layout';
import { ANewTab, BannerImage } from '../../components/util';

const Homepage = ({ bannerImage, oldHomepageImage, trianglesImage }) => (
  <Layout
    title="Building This Site"
    description="Info about the design and development of this website"
  >
    <center>
      <h1>Building This Site</h1>
    </center>

    <BannerImage
      img={bannerImage}
      alt="A screenshot of the homepage of cprimozic.net"
    />

    <p>
      This website was created with React and{' '}
      <ANewTab to="https://www.gatsbyjs.org/" text="Gatsby" />. Gatsby is a
      framework for building static websites with React, using methods like
      pre-rendering components into HTML and pre-fetching internal links after
      load to make the site performant, light-weight, and efficient.
    </p>
    <p>
      There is a considerable variety of plugins available for Gatsby as well,
      ranging from image optimization via{' '}
      <ANewTab
        to="https://www.gatsbyjs.org/packages/gatsby-plugin-sharp/"
        text={<code>gatsby-plugin-sharp</code>}
      />{' '}
      which uses the{' '}
      <ANewTab
        to="https://github.com/lovell/sharp"
        text="Sharp image processing library"
      />{' '}
      internally to create pre-generated, optimized versions of images in
      various sizes. In addition, it provides support for generating pages out
      of content such as markdown files. My old blog based on{' '}
      <ANewTab to="https://ghost.org/" text="Ghost" />, was written entirely in
      Markdown, so I figured that this was a good opportunity to port it over
      and have everything in the same place. The Gatsby tutorial actually
      includes a{' '}
      <ANewTab
        to="https://www.gatsbyjs.org/tutorial/part-seven/#creating-pages"
        text="section"
      />{' '}
      explaining how to go about doing this, so the process was pretty
      straightforward.
    </p>

    <h2>Background Animation</h2>
    <p>
      The triangles in the background of the site were a sketch I created a
      while back based on drawings I used to make when I was bored in school.
      I&apos;d create what I thought of as bacteria colonies on papers, drawing
      them in the margins with each of the cylindrical bacteriums connected end
      to end. The triangles were an attempt to replicate that in code, stylized
      in the process.
    </p>
    <p>
      The animation itself is actually implemented via a SVG spanning the whole
      page. Using a Rust program that I compiled to WebAssembly, new triangle
      positions are computed from the endpoints of existing triangles. Triangles
      are kept from intersecting each other by using a{' '}
      <ANewTab
        to="https://docs.rs/ncollide2d/0.17.3/ncollide2d/"
        text="collision library"
      />{' '}
      and are rendered by calling into exported JavaScript functions which
      mutate the canvas. I created an{' '}
      <ANewTab to="https://triangles.ameo.design/" text="interactive tool" /> to
      develop and tweak the animation, making use of the{' '}
      <Link to="/projects/react-control-panel/">
        <code>react-control-panel</code>
      </Link>{' '}
      library to allow for live control over the animation&apos;s configuration.
    </p>

    <BannerImage
      img={trianglesImage}
      alt="A screenshot of the interative tool that I used to create the triangles animation in the background of this site"
    />

    <h2>Continuous Deployment</h2>
    <p>
      Since my blog is published on this site and all content is static, it is
      necessary to re-build the full site from scratch and upload it to the
      webserver where it&apos;s hosted every time a change is made. This quickly
      got tedious, so I set up{' '}
      <ANewTab to="https://circleci.com/" text="CircleCI" /> to automatically
      build and deploy the site after pushes to master. CircleCI provides free
      builds for open source projects, meaning that the process costs me
      nothing.
    </p>
    <p>
      CircleCI defines its build pipeline by a series of commands that are run
      within a Docker container. I use a NodeJS image as the base (since Node is
      required to build the bundle) and manually install several things
      including Rust (for building the background visualization) and{' '}
      <ANewTab to="https://github.com/WebAssembly/binaryen" text="Binaryen" />{' '}
      for the <code>wasm-opt</code> utility. Once the bundle is built, I{' '}
      <code>rsync</code> it to my deployment server using a SSH key that I set
      up as a CircleCI secret.
    </p>

    <h2>Old Homepage</h2>
    <p>
      This is the second iteration of my personal homepage. The original was
      first created back in 2014 and was just a single page with some info and a
      quirky random number generation demo. Here&apos;s a picture of it:
    </p>
    <BannerImage
      img={oldHomepageImage}
      alt="A screenshot of the old ameobea.me homepage"
    />

    <p>
      The goal with this new site is to serve as a my personal knowledgebase and
      archive. My goal is to index and catalog all of my projects, provide ample
      information about myself for people finding it via web searches or links
      from other places, and demonstrate my skills as a web developer.
    </p>
    <p>
      If you&apos;re curious about how I created this site, it&apos;s{' '}
      <ANewTab to="https://github.com/ameobea/homepage/" text="open source" />.
    </p>
  </Layout>
);

const query = graphql`{
  bannerImage: file(relativePath: {eq: "projects/homepage/homepage.png"}) {
    childImageSharp {
      gatsbyImageData(layout: FULL_WIDTH)
    }
  }
  oldHomepageImage: file(relativePath: {eq: "projects/homepage/old.png"}) {
    childImageSharp {
      gatsbyImageData(layout: FULL_WIDTH)
    }
  }
  trianglesImage: file(relativePath: {eq: "projects/homepage/triangles.png"}) {
    childImageSharp {
      gatsbyImageData(layout: FULL_WIDTH)
    }
  }
}
`;

const WrappedHomepage = () => <StaticQuery query={query} render={Homepage} />;

export default WrappedHomepage;
