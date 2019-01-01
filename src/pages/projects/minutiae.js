import React from 'react';
import { graphql, StaticQuery, Link } from 'gatsby';

import Layout from '../../components/layout';
import { BannerImage, ANewTab } from '../../components/util';

const Minutiae = ({ fishImage }) => (
  <Layout
    title="Minutiae"
    description="An overview of the Minutiae simulation framework"
  >
    <p>
      <b>Minutiae</b> is an agent-based simulation framework written in Rust
      that operates on a finite 2D universe of cells and entities. All state and
      logic are type checked by the Rust compiler, making writing bug-free
      simulations easier. Minutiae is a personal project that I mainly created
      to serve as the basis for a variety of other personal projects. As such,
      it contains features that are largely custom and not general purpose, as
      well as being unstable.
    </p>

    <h2>Design + Architecture</h2>
    <p>
      Minutiae is an agent-based simulation framework, meaning that the active
      portions are <b>entities</b>. Entities reside at a single coordinate in
      the universe and behave according to logic provided by the programmer. In
      short, entities use information about the universe including the state of
      cells and other entities to create <b>actions</b> which are dispatched to
      the simulation <b>engine</b>. The engine queries all entities in the world
      for their actions and then applies them to the universe according to
      rules. This process proceeds each tick, after which <b>middleware</b> can
      be used to do things like render the simulation state to a visualization,
      perform manual updates to individual cells, or other things.
    </p>

    <h2>Code Sketches</h2>
    <p>
      One of the uses for which I&apos;ve found Minutiae to be especially well
      fit is in creating small, self-contained code sketches. A perfect example
      of one of these is this{' '}
      <ANewTab to="https://ameo.link/fish.html" text="fish sketch" />:
    </p>
    <BannerImage
      alt="A Minutiae simulation of fish showing blue pixels (fish) and green pixels which they seek out and consume (food)."
      img={fishImage}
    />

    <p>
      The fish (blue pixels) move randomly until a food particle (green pixel)
      comes within their view range, at which point they move towards it and
      consume it. The core of the fish entity logic can be found{' '}
      <ANewTab
        to="https://github.com/Ameobea/minutiae/blob/master/fish/src/entity_logic/fish.rs#L10"
        text="here"
      />
      .
    </p>
    <p>
      In some cases including my{' '}
      <Link to="/blog/creating-noise-function-compositor/">
        noise function compositor
      </Link>
      , Minutiae is used simply as a convenient container for a 2D universe with
      built-in methods for rendering to GIF, HTML Canvas via WebAssembly, or
      even text to the terminal. Some standalone examples of this behavior can
      be seen here:{' '}
      <ANewTab to="https://ameo.link/noise/" text="https://ameo.link/noise/" />{' '}
      and{' '}
      <ANewTab
        to="https://ameo.link/colors/"
        text="https://ameo.link/colors/"
      />
      .
    </p>

    <h2>Client/Server Support</h2>
    <p>
      In addition to creating simulations that run locally, Minutiae also has
      support for creating networked simulations that run remotely and can be
      connected to by multiple clients.
    </p>

    <h2>Interactive Simulations</h2>
    <p>
      Minutiae is capable of supporting more complex and interactive
      simulations, such as{' '}
    </p>
  </Layout>
);

const query = graphql`
  query {
    fishImage: file(relativePath: { eq: "projects/minutiae/fish.png" }) {
      childImageSharp {
        fluid {
          ...GatsbyImageSharpFluid_withWebp
        }
      }
    }
  }
`;

export default () => <StaticQuery query={query} render={Minutiae} />;
