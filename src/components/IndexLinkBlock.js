/**
 * A responsive text block that functions as a link to a different page on the site.
 */

import React from 'react';
import { Link } from 'gatsby';

export const IndexLinkBlockSet = ({ children }) => (
  <div
    style={{
      display: 'flex',
      flex: 1,
      justifyContent: 'space-evenly',
      flexWrap: 'wrap',
    }}
  >
    {children}
  </div>
);

export const IndexLinkBlock = ({ text, to }) => (
  <Link
    to={to}
    style={{ fontFamily: 'monospace', textAlign: 'center', fontSize: 28 }}
  >
    <div
      style={{
        display: 'flex',
        flex: 0,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 250,
        height: 150,
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: 'rgba(200,200,200,0.4)',
        fontWeight: 'bold',
        margin: 25,
      }}
    >
      {text}
    </div>
  </Link>
);
