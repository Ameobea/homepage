import { StaticImage } from 'gatsby-plugin-image';
import React from 'react';

import Layout from '../../components/layout';
import { ANewTab } from '../../components/util';

const Ants = () => (
  <Layout
    title="Ant Colony Simulation"
    description="About my ant colony simulation project - an agent-based simulation built using Minutiae as a school project"
  >
    <StaticImage
      src="../../images/projects/ants.png"
      alt="A screenshot of the ant colony simulation interface"
      formats={['auto', 'avif']}
    />
    I created this ant colony simulation as my final project for the Simulation
    and Modeling class that I took in my last year of college. It was written in
    Rust and compiled to WebAssembly so that it could run in the browser,
    rendering to a HTML canvas via WebGL. I created a slideshow and paper as
    part of the project and have included links to them below.
    <br />
    <br />
    <ANewTab to="https://i.ameo.link/64s.pdf" text="Presentation Slides" />
    <br />
    <ANewTab to="https://i.ameo.link/64t.pdf" text="Paper" />
  </Layout>
);

export default Ants;
