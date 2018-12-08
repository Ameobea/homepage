import React from 'react';
import { Link } from 'gatsby';

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#333',
    paddingTop: 4,
    paddingBottom: 8,
    paddingright: 12,
    fontFamily: "'Oxygen Mono', monospace",
    paddingLeft: 300,
    paddingRight: 300,
    flexWrap: 'wrap',
  },
  homeLink: {
    left: 8,
    display: 'flex',
    flex: 1,
    fontSize: 16,
    fontWeight: 600,
    position: 'absolute',
  },
  navLinks: {
    display: 'flex',
    flex: 1,
    justifyContent: 'center',
    marginTop: 2,
  },
  navLink: {
    fontSize: 14,
    paddingLeft: 8,
    paddingRight: 8,
  },
};

const NavLink = ({ to, text, style = {} }) => (
  <Link to={to} style={{ ...styles.navLink, ...style }}>
    {text}
  </Link>
);

const NavLinks = () => (
  <div style={styles.navLinks}>
    <NavLink to="/portfolio/" text="Portfolio" />
    <NavLink to="/contact/" text="Contact" />
    <NavLink to="/about/" text="About" />
    <NavLink
      to="/professional/"
      text="Professional Experience"
      style={{ flex: 1.5 }}
    />
  </div>
);

const Header = () => (
  <div style={styles.root} className="header">
    <Link to="/" style={styles.homeLink}>
      {"Casey Primozic's Homepage"}
    </Link>
    <NavLinks />
  </div>
);

export default Header;
