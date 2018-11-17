/**
 * A responsive text block that functions as a link to a different page on the site.
 */

import React from 'react';
import { Link } from 'gatsby';

const styles = {
  root: {
    fontFamily: 'monospace',
    textAlign: 'center',
    fontSize: 28,
    display: 'flex',
    flex: 0,
  },
  block: {
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
  },
};

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
  <Link to={to} style={styles.root}>
    <div style={styles.block}>{text}</div>
  </Link>
);
