/**
 * A responsive text block that functions as a link to a different page on the site.
 */

import React from 'react';
import { Link } from 'gatsby';

import './indexLinkBlock.css';

const styles = {
  blockSet: {
    display: 'flex',
    flex: 1,
    justifyContent: 'space-evenly',
    flexWrap: 'wrap',
  },
  root: {
    textAlign: 'center',
    fontSize: 24,
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
    lineHeight: '1.25em',
    paddingLeft: 12,
    paddingRight: 12,
  },
};

export const IndexLinkBlockSet = ({ children }) => (
  <div style={styles.blockSet}>{children}</div>
);

export const IndexLinkBlock = ({ text, to }) => (
  <Link to={to} style={styles.root}>
    <div style={styles.block} className="index-link-block-content">
      {text}
    </div>
  </Link>
);
