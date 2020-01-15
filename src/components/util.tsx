import React from 'react';
import Img from 'gatsby-image';

type ANewTabProps = {
  to: string;
  children?: React.ReactElement;
  text: string;
} & React.AnchorHTMLAttributes<any>;

export const ANewTab = ({ to, children, text, ...props }: ANewTabProps) => (
  <a href={to} target="_blank" rel="noopener noreferrer" {...props}>
    {children || text || ''}
  </a>
);

export const BannerImage = ({ img, alt, style = {} }) => (
  <span style={{ textAlign: 'center' }}>
    <Img
      style={{ maxWidth: 667, marginBottom: 40, ...style }}
      fluid={img.childImageSharp.fluid}
      alt={alt}
    />
  </span>
);

export const truncateWithElipsis = (s: string, maxLength: number): string => {
  let truncated = s.slice(0, maxLength);
  if (truncated.length !== s.length) {
    truncated += '…';
  }

  return truncated;
};
