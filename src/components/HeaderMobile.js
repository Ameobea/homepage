import React, { useState } from 'react';
import { Link } from 'gatsby';

const HeaderMobile = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="header-mobile">
      <Link to="/portfolio/" text="Portfolio" />
      <Link to="/contact/" text="Contact" />
      <Link to="/about/" text="About" />
    </div>
  );
};

export default HeaderMobile;
