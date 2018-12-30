import React from 'react';
import Img from 'gatsby-image';

export const ANewTab = ({ to, children, text, ...props }) => (
  <a href={to} target="_blank" rel="noopener noreferrer" {...props}>
    {children || text || ''}
  </a>
);

export const BannerImage = ({ img, alt }) => (
  <center>
    <Img
      style={{ maxWidth: 667, marginBottom: 40 }}
      fluid={img.childImageSharp.fluid}
      alt={alt}
    />
  </center>
);
