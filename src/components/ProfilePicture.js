import React from 'react';
import { StaticQuery, graphql } from 'gatsby';
import Img from 'gatsby-image';

const ProfilePicture = ({ size = 150 }) => (
  <StaticQuery
    query={graphql`
      query {
        placeholderImage: file(relativePath: { eq: "face.jpg" }) {
          childImageSharp {
            fluid(maxWidth: 250, quality: 85) {
              ...GatsbyImageSharpFluid
            }
          }
        }
      }
    `}
    render={data => (
      <div
        style={{
          flexBasis: size,
          marginBottom: '1.45rem',
        }}
      >
        <Img
          fluid={data.placeholderImage.childImageSharp.fluid}
          imgStyle={{
            clipPath: 'circle(46% at center 50%)',
            objectPosition: 'center 37%',
          }}
          style={{ height: size, display: 'flex', flex: 1, minWidth: 110 }}
        />
      </div>
    )}
  />
);
export default ProfilePicture;
