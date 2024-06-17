import React from 'react';
import { Link } from 'gatsby';
import { StaticImage } from 'gatsby-plugin-image';

import { ANewTab } from '../../components/util';
import Layout from '../../components/layout';

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
};

const Volumetric = () => (
  <Layout
    title="Volumetric Rendering Experiment"
    description="An overview of my experiments in volumetric rendering via raymarching in the web browser"
  >
    <div style={styles.header}>
      <h2>
        Experiments in Volumetric Rendering via Raymarching in the Browser
      </h2>

      <span style={{ textAlign: 'center' }}>
        <StaticImage
          formats={['auto', 'webp', 'avif']}
          style={{ marginBottom: 40, width: 400, height: 400 }}
          src="../../images/projects/volumetric.png"
          alt="A view of the volumetric rendering output showing the generated 3D noise projected onto a canvas"
        />
      </span>
    </div>
    After reading about and browsing many other peoples&apos; work in computer
    graphics, I decided to try to implement raymarching application in the web
    browser. I was working heavily with noise generation and visualization at
    the time, creating my{' '}
    <Link to="/blog/creating-noise-function-compositor/">
      Noise Function Compositor
    </Link>{' '}
    which generated 3D noise, projected it as a 2D movie, and then colorized it
    to RGB. I wanted to take things up to the next dimension by creating a 3D
    visualization of noise. <br />
    <br />I was inspired by a lot of really impressive prior art (
    <ANewTab
      to="https://github.com/lebarba/WebGLVolumeRendering"
      text="WebGL Volume Rendering Made Easy"
    />{' '}
    and{' '}
    <ANewTab
      to="https://www.shadertoy.com/view/XslGRr"
      text="Volumetric raymarched clouds on Shadertoy"
    />{' '}
    to list a couple) and I wanted to try it out for myself from scratch. I
    found a library called <ANewTab to="https://gpu.rocks/" text="GPU.JS" />{' '}
    that allows JavaScript code (a subset of it anyway) that runs on the GPU. It
    transforms it into shader language, compiles it, and executes it on the GPU
    via WebGL and then returns the result back to normal JavaScript. My plan was
    pretty simple: I generated some 3D noise as values from 0.0 to 1.0 using the{' '}
    <ANewTab to="https://docs.rs/noise/0.5.1/noise/" text="noise-rs" /> library
    and stored it as a matrix. I then shipped that data over to GPU.JS using
    Emscripten (the whole asm.js and Rust component here was largely useless,
    but I built this out of an existing framework that used it much more
    extensively). <br />
    <br />
    Once the data was there, I used GPU.JS to convert the buffer into a texture
    and ship it over to the GPU. At that point, there only remaining step was
    the linear algebra and raymarching algorithm itself. I did my best to avoid
    using external guides or reference for the algorithm itself since it seemed
    pretty intuitive to me at the time, but after many hours of struggling and
    failed attempts I eventually ended up using some external resources for
    help. The hardest part was dealing with the "virtual screen" through which
    individual rays were fired (one per pixel) from the origin point in order to
    create the output image. There were all manner of normalizations, cross
    products, dot products, and other abstruse transformations that needed to be
    done to these vectors, and wrapping my head around it all was quite a
    challenge.
    <br />
    <br />
    After{' '}
    <ANewTab
      to="https://github.com/Ameobea/minutiae/blob/4d3206b18ba0dcbd0bb7ddc139373c1de9894997/volumetric/index.html#L57"
      text="a lot more linear algebra than I'd expected"
    />
    , I finally managed to create my renderer, very much from scratch. The
    performance was atrocious probably due to a mix of inefficient algorithms
    and the GPU.JS library not being the best choice for this particular job
    (writing actual GLSL directly would have been a lot better) but it worked
    and I was very happy. Adding in the logic and math for panning around the
    camera and moving it around took some additional effort, but the{' '}
    <ANewTab to="https://volumetric.ameo.design/" text="final product" />{' '}
    demonstrates that working pretty well.
    <br />
    <br />
    <hr />
    <br />I was originally planning to re-write the renderer using raw GLSL
    shaders and adding some nice additions like interactivity with the mouse and
    bilinear interpolation (I tried implementing that manually but was not
    successful, and the fact that it was a built-in feature in GLSL wasn't
    particularly inspiring). However, I ended up moving on to other things and
    never really did any additional work there.
    <br />
    <br />
    That being said, I'm still fascinated by computer graphics and would love to
    work on a similar project in the future. Although this project didn't go to
    far or turn into anything particularly interesting, I think that I succeeded
    in accomplishing what I set out to do (implement volumetric rendering from
    scratch in the web browser) and it gave me very useful intros into low-level
    compute graphics and linear algebra topics that I'd not previously
    encountered.
  </Layout>
);

export default Volumetric;
