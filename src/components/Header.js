import React from 'react';
import { Link } from 'gatsby';

import './Header.css';

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexWrap: 'wrap',
    maxWidth: 880,
    marginLeft: 'auto',
    marginRight: 'auto',
    marginBottom: 6,
    paddingLeft: 8,
    paddingRight: 2,
  },
  navLinks: {
    display: 'flex',
    flex: 1,
    justifyContent: 'flex-end',
    marginTop: 2,
    textDecorationThickness: 1,
    textUnderlineOffset: 2,
  },
};

const NavLink = ({ to, text, style = {} }) => (
  <Link className="nav-link" to={to} style={style}>
    {text}
  </Link>
);

const NavLinks = () => (
  <div style={styles.navLinks}>
    <a
      href="https://twitter.com/ameobea10/"
      target="blank"
      className="nav-link"
    >
      @ameobea10
    </a>
    •
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
    <Link to="/" className="home-link">
      <b>cprimozic.net</b>
    </Link>
    <NavLinks />
  </div>
);

export default Header;
