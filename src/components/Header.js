import React from 'react';
import { Link } from 'gatsby';

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#333',
    paddingLeft: 12,
    paddingTop: 4,
    paddingBottom: 4,
    paddingright: 12,
    fontFamily: "'Oxygen Mono', monospace",
  },
  homeLink: {
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
  },
  navLink: {
    fontSize: 14,
    paddingLeft: 6,
    paddingRight: 6,
  },
};

const NavLink = ({ to, text }) => (
  <Link to={to} style={styles.navLink}>
    {text}
  </Link>
);

const NavLinks = () => (
  <div style={styles.navLinks}>
    <NavLink to="/portfolio/" text="Portfolio" />
    <NavLink to="/contact/" text="Contact" />
    <NavLink to="/about/" text="About" />
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
