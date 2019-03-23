import React from 'react';
import { graphql, StaticQuery } from 'gatsby';

import Layout from '../../components/layout';
import { ANewTab, BannerImage } from '../../components/util';

const Ants = ({ bannerImage }) => (
  <Layout
    title="Ant Colony Simulation"
    description="About my ant colony simulation project - an agent-based simulation built using Minutiae as a school project"
  >
    <BannerImage
      img={bannerImage}
      alt="A screenshot of the ant colony simulation interface"
    />
    I created this ant colony simulation as my final project for the Simulation
    and Modeling class that I took in my last year of college. It was written in
    Rust and compiled to WebAssembly so that it could run in the browser,
    rendering to a HTML canvas via WebGL. I created a slideshow and paper as
    part of the project and have included links to them below.
    <br />
    <br />
    <ANewTab to="https://ameo.link/u/64s.pdf" text="Presentation Slides" />
    <br />
    <ANewTab to="https://ameo.link/u/64t.pdf" text="Paper" />
  </Layout>
);

const query = graphql`
  query {
    bannerImage: file(relativePath: { eq: "projects/ants.png" }) {
      childImageSharp {
        fluid {
          ...GatsbyImageSharpFluid_withWebp
        }
      }
    }
  }
`;

const AntsWithQuery = () => <StaticQuery query={query} render={Ants} />;

export default AntsWithQuery;
