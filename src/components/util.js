import React from 'react';
import Img from 'gatsby-image';
import { OutboundLink } from 'gatsby-plugin-google-analytics';

export const ANewTab = ({ to, children, text, ...props }) => (
  <OutboundLink href={to} target="_blank" rel="noopener noreferrer" {...props}>
    {children || text || ''}
  </OutboundLink>
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
