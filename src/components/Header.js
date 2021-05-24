import React from 'react';
import { Link } from 'gatsby';

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: 'transparent',
    padding: '2px 300px 8px 300px',
    flexWrap: 'wrap',
  },
  homeLink: {
    left: 8,
    display: 'flex',
    flex: 1,
    fontSize: 20,
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
    fontSize: 18,
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
    <NavLink to="/portfolio/" text="Portfolio" />•
    <NavLink to="/contact/" text="Contact" />•
    <NavLink to="/blog/" text="Blog" />•
    <NavLink
      to="/professional/"
      text="Professional Experience"
      style={{ flexBasis: 205 }}
    />
  </div>
);

const Header = () => (
  <div style={styles.root} className="header">
    <Link to="/" style={styles.homeLink}>
      {'Casey Primozic'}
    </Link>
    <NavLinks />
  </div>
);

export default Header;
