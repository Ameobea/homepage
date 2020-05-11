import React from 'react';
import { StaticQuery, graphql } from 'gatsby';
import Img from 'gatsby-image';

const styles = {
  root: {
    marginBottom: '1.45rem',
  },
  imageContainer: { display: 'flex', flex: 1, minWidth: 110 },
  imageStyle: {
    clipPath: 'circle(49% at center 50%)',
    objectPosition: '1px 46%',
  },
};

const ProfilePicture = ({ size = 150 }) => (
  <StaticQuery
    query={graphql`
      query {
        placeholderImage: file(relativePath: { eq: "face.jpg" }) {
          childImageSharp {
            fluid(maxWidth: 250, quality: 85) {
              ...GatsbyImageSharpFluid_withWebp
            }
          }
        }
      }
    `}
    render={(data) => (
      <div style={{ ...styles.root, flexBasis: size }}>
        <Img
          alt="A picture of Casey Primozic (Ameo)"
          fluid={data.placeholderImage.childImageSharp.fluid}
          imgStyle={styles.imageStyle}
          style={{ ...styles.imageContainer, height: size }}
        />
      </div>
    )}
  />
);

export default ProfilePicture;
