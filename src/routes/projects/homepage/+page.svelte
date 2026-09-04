<script lang="ts">
  import PageLayout from '$lib/components/PageLayout.svelte';
  import ResponsiveImage from '$lib/components/ResponsiveImage.svelte';

  let { data } = $props();
</script>

<PageLayout
  title="Building This Site"
  description="Info about the design and development of this website"
>
  <center>
    <h1>Building This Site</h1>
  </center>

  <ResponsiveImage
    entry={data.images['homepage/homepage.png']}
    alt="A screenshot of the homepage of cprimozic.net"
    maxWidth={667}
    style="margin-bottom: 40px"
  />

  <p>
    This website was created with React and
    <a href="https://www.gatsbyjs.org/" target="_blank" rel="noopener noreferrer">Gatsby</a>. Gatsby
    is a framework for building static websites with React, using methods like pre-rendering
    components into HTML and pre-fetching internal links after load to make the site performant,
    light-weight, and efficient.
  </p>
  <p>
    There is a considerable variety of plugins available for Gatsby as well, ranging from image
    optimization via
    <a
      href="https://www.gatsbyjs.org/packages/gatsby-plugin-sharp/"
      target="_blank"
      rel="noopener noreferrer"><code>gatsby-plugin-sharp</code></a
    >
    which uses the
    <a href="https://github.com/lovell/sharp" target="_blank" rel="noopener noreferrer"
      >Sharp image processing library</a
    >
    internally to create pre-generated, optimized versions of images in various sizes. In addition,
    it provides support for generating pages out of content such as markdown files. My old blog
    based on <a href="https://ghost.org/" target="_blank" rel="noopener noreferrer">Ghost</a>, was
    written entirely in Markdown, so I figured that this was a good opportunity to port it over and
    have everything in the same place. The Gatsby tutorial actually includes a
    <a
      href="https://www.gatsbyjs.org/tutorial/part-seven/#creating-pages"
      target="_blank"
      rel="noopener noreferrer">section</a
    >
    explaining how to go about doing this, so the process was pretty straightforward.
  </p>

  <h2>Background Animation</h2>
  <p>
    The triangles in the background of the site were a sketch I created a while back based on
    drawings I used to make when I was bored in school. I'd create what I thought of as bacteria
    colonies on papers, drawing them in the margins with each of the cylindrical bacteriums
    connected end to end. The triangles were an attempt to replicate that in code, stylized in the
    process.
  </p>
  <p>
    The animation itself is actually implemented via a SVG spanning the whole page. Using a Rust
    program that I compiled to WebAssembly, new triangle positions are computed from the endpoints
    of existing triangles. Triangles are kept from intersecting each other by using a
    <a href="https://docs.rs/ncollide2d/0.17.3/ncollide2d/" target="_blank" rel="noopener noreferrer"
      >collision library</a
    >
    and are rendered by calling into exported JavaScript functions which mutate the canvas. I
    created an
    <a href="https://triangles.ameo.design/" target="_blank" rel="noopener noreferrer"
      >interactive tool</a
    >
    to develop and tweak the animation, making use of the
    <a href="/projects/react-control-panel/"><code>react-control-panel</code></a>
    library to allow for live control over the animation's configuration.
  </p>

  <ResponsiveImage
    entry={data.images['homepage/triangles.png']}
    alt="A screenshot of the interactive tool that I used to create the triangles animation in the background of this site"
    maxWidth={667}
    style="margin-bottom: 40px"
  />

  <h2>Continuous Deployment</h2>
  <p>
    Since my blog is published on this site and all content is static, it is necessary to re-build
    the full site from scratch and upload it to the webserver where it's hosted every time a change
    is made. This quickly got tedious, so I set up
    <a href="https://circleci.com/" target="_blank" rel="noopener noreferrer">CircleCI</a> to
    automatically build and deploy the site after pushes to master. CircleCI provides free builds
    for open source projects, meaning that the process costs me nothing.
  </p>
  <p>
    CircleCI defines its build pipeline by a series of commands that are run within a Docker
    container. I use a NodeJS image as the base (since Node is required to build the bundle) and
    manually install several things including Rust (for building the background visualization) and
    <a href="https://github.com/WebAssembly/binaryen" target="_blank" rel="noopener noreferrer"
      >Binaryen</a
    >
    for the <code>wasm-opt</code> utility. Once the bundle is built, I <code>rsync</code> it to my
    deployment server using a SSH key that I set up as a CircleCI secret.
  </p>

  <h2>Old Homepage</h2>
  <p>
    This is the second iteration of my personal homepage. The original was first created back in
    2014 and was just a single page with some info and a quirky random number generation demo.
    Here's a picture of it:
  </p>
  <ResponsiveImage
    entry={data.images['homepage/old.png']}
    alt="A screenshot of the old ameobea.me homepage"
    maxWidth={667}
    style="margin-bottom: 40px"
  />

  <p>
    The goal with this new site is to serve as a my personal knowledgebase and archive. My goal is
    to index and catalog all of my projects, provide ample information about myself for people
    finding it via web searches or links from other places, and demonstrate my skills as a web
    developer.
  </p>
  <p>
    If you're curious about how I created this site, it's
    <a href="https://github.com/ameobea/homepage/" target="_blank" rel="noopener noreferrer"
      >open source</a
    >.
  </p>
</PageLayout>
