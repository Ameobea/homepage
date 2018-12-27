import React from 'react';
import { graphql, StaticQuery } from 'gatsby';
import Img from 'gatsby-image';

import Layout from '../../components/layout';

const BannerImage = ({ img, alt }) => (
  <center>
    <Img
      style={{ maxWidth: 667, marginBottom: 40 }}
      fluid={img.childImageSharp.fluid}
      alt={alt}
    />
  </center>
);

const Homepage = ({ bannerImage, oldHomepageImage }) => (
  <Layout>
    <center>
      <h1>Building This Site</h1>
    </center>

    <BannerImage
      img={bannerImage}
      alt="A screenshot of the homepage of cprimozic.net"
    />

    <p>TODO</p>

    <BannerImage
      img={oldHomepageImage}
      alt="A screenshot of the old ameobea.me homepage"
    />
  </Layout>
);

const query = graphql`
  query {
    bannerImage: file(relativePath: { eq: "projects/homepage/homepage.png" }) {
      childImageSharp {
        fluid {
          ...GatsbyImageSharpFluid_withWebp
        }
      }
    }
    oldHomepageImage: file(relativePath: { eq: "projects/homepage/old.png" }) {
      childImageSharp {
        fluid {
          ...GatsbyImageSharpFluid_withWebp
        }
      }
    }
  }
`;

export default () => <StaticQuery query={query} render={Homepage} />;
