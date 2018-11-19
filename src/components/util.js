import React from 'react';

export const ANewTab = ({ to, children, text, ...props }) => (
  <a href={to} target="_blank" rel="noopener noreferrer" {...props}>
    {children || text || ''}
  </a>
);
