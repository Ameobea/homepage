import React from 'react';
import { StaticQuery, graphql } from 'gatsby';
import Img from 'gatsby-image';

import Layout from '../../components/layout';
import { ANewTab } from '../../components/util';

const styles = {
  root: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
  },
};

const BannerImage = () => (
  <StaticQuery
    query={graphql`
      query {
        bannerImage: file(relativePath: { eq: "projects/cryptoviz.png" }) {
          childImageSharp {
            fluid {
              ...GatsbyImageSharpFluid
            }
          }
        }
      }
    `}
    render={data => <Img fluid={data.bannerImage.childImageSharp.fluid} />}
  />
);

const Cryptoviz = () => (
  <Layout>
    <div style={styles.root}>
      <center>
        <h1>Cryptoviz</h1>
      </center>
      <BannerImage />
      <h2 style={{ paddingTop: 28 }}>Overview</h2>
      <p>
        In financial markets with buyers and sellers, there's something called
        an <i>Order Book</i> which contains the number of units of all pending
        offers to buy and sell assets at every price level. This order book can
        be in many ways, but most only show the state of the book at a single
        point in time.
      </p>
      <p>
        Cryptoviz allows users to visualize the state of the orderbook as it
        changes, recording the behavior of market participants and making their
        effects on the orderbook visible.
      </p>

      <center>
        <iframe
          width="560"
          height="315"
          src="https://www.youtube-nocookie.com/embed/H5JtKzw37rA"
          frameBorder="0"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </center>

      <h2 style={{ paddingTop: 24 }}>Technical Info</h2>
      <p>
        Cryptoviz was built using the Canvas2D API along with a library called{' '}
        <ANewTab to="http://paperjs.org/" text="PaperJS" />. The red and blue
        lines and circles along with the lines and axis labels were drawn with
        PaperJS, while the white lines in the background were drawn using the
        Canvas2D API directly.
      </p>
      <p>
        For the data used to power the visualization, a direct WebSocket feed is
        opened to the Poloniex exchange's orderbook update feed. To start, these
        updates are recorded in an array and not applied to the
        visualization.Once that happens, a HTTP request is made to their public
        REST API to fetch the current state of the orderbook. The response from
        that contains a sequence number which can be used to pick the exact
        point at which to start applying orderbook updates; all recorded updates
        before the sequence number of the orderbook snapshot are discarded, and
        the ones after are applied.
      </p>
      <p>
        By following this procedure, a virtual orderbook is maintained matching
        the state of the actual orderbook on the exchange. Some extra logic is
        added to try to handle WebSocket feed disconnections, preventing
        messages from being applied out-of-order. Book modifications and trades
        are plotted on the canvas until it reaches the right side, at which
        point the entire history is re-rendered with a smaller zoom. The same
        thing is used when users manually zoom in by selecting a region with the
        mouse: A subsection of the history is rendered from left to right and
        composited on the canvas. Since the visualization always grows to the
        right, there is no need to re-render the entire thing every update;
        instead, new data can be added directly.
      </p>
    </div>
  </Layout>
);

export default Cryptoviz;
