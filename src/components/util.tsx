import React from 'react';
import Img from 'gatsby-image';
import { OutboundLink } from 'gatsby-plugin-google-analytics';

type ANewTabProps = {
  to: string;
  children?: React.ReactElement;
  text: string;
  [other: string]: any;
};

export const ANewTab = ({ to, children, text, ...props }: ANewTabProps) => (
  <OutboundLink href={to} target="_blank" rel="noopener noreferrer" {...props}>
    {children || text || ''}
  </OutboundLink>
);
export const BannerImage = ({ img, alt }) => (
  <span style={{ textAlign: 'center' }}>
    <Img
      style={{ maxWidth: 667, marginBottom: 40 }}
      fluid={img.childImageSharp.fluid}
      alt={alt}
    />
  </span>
);
