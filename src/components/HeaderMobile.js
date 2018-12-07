import React, { useState } from 'react';
import { Link } from 'gatsby';

import HamburgerMenuIcon from '../images/hamburgerMenu.svg';

const styles = {
  root: {
    height: 0,
    backgroundColor: 'rgba(36, 36, 36, 0.92)',
    paddingBottom: 30,
    flexDirection: 'row',
    display: 'none',
  },
  title: {
    fontSize: 18,
    fontFamily: "'Oxygen Mono', monospace",
    display: 'flex',
    flex: 1,
    justifyContent: 'center',
    fontWeight: 600,
    paddingTop: 10,
  },
  expanded: {
    position: 'absolute',
    top: 8,
    left: 59,
    width: 100,
    height: 125,
    backgroundColor: 'rgba(45, 45, 45, 0.95)',
    borderStyle: 'solid',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(200,200,200,0.4)',
    textAlign: 'center',
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  expandedLink: {
    display: 'flex',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: '100%',
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200,200,200,0.4)',
    textAlign: 'center',
  },
};

const ExpandedLink = ({ to, text }) => (
  <Link to={to} style={styles.expandedLink}>
    {text}
  </Link>
);

const HeaderMenuExpanded = ({ setMenuOpen }) => (
  <div style={styles.expanded}>
    <ExpandedLink to="/" text="Home" />
    <ExpandedLink to="/portfolio/" text="Portfolio" />
    <ExpandedLink to="/contact/" text="Contact" />
    <ExpandedLink to="/about/" text="About" />
  </div>
);

const HeaderMobile = () => {
  const [menuOpen, setMenuOpen] = useState(0);

  return (
    <div style={styles.root} className="header-mobile">
      <img
        height={38}
        width={38}
        src={HamburgerMenuIcon}
        alt="hamburger menu"
        style={{
          position: 'absolute',
          cursor: 'pointer',
          left: 7,
          top: 4,
          zIndex: 10,
        }}
        onClick={() => setMenuOpen(!menuOpen)}
      />
      <div style={styles.title}>Casey Primozic&apos;s Homepage</div>

      {menuOpen ? <HeaderMenuExpanded /> : null}
    </div>
  );
};

// This is wrapped with `React.memo` in order to work around a bug in the hot reloader:
// https://github.com/gatsbyjs/gatsby/issues/9489#issuecomment-433872202
export default React.memo(HeaderMobile);
