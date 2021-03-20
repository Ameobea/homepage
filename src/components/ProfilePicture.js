import React from 'react';
import { StaticImage } from 'gatsby-plugin-image';

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

const ProfilePicture = () => (
  <div style={{ ...styles.root, flexBasis: 125 }}>
    <StaticImage
      width={250}
      height={250}
      src="../images/face.jpg"
      alt="A picture of Casey Primozic (Ameo)"
      imgStyle={styles.imageStyle}
      style={{ ...styles.imageContainer }}
    />
  </div>
);

export default ProfilePicture;
