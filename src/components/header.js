import React from 'react';
import { Link } from 'gatsby';

import githubLogo from '../images/social/github.svg';
import redditLogo from '../images/social/reddit.svg';
import twitterLogo from '../images/social/twitter.svg';

const ANewTab = ({ href, children, ...props }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
    {children}
  </a>
);

const LogoLink = ({ logoImage, url, alt = '' }) => (
  <div style={{ display: 'inline', paddingLeft: 6, paddingRight: 6 }}>
    <ANewTab href={url}>
      <img
        src={logoImage}
        alt={alt}
        height={16}
        style={{ marginBottom: 0, marginTop: 6 }}
      />
    </ANewTab>
  </div>
);

const LogoLinks = () => (
  <React.Fragment>
    <LogoLink
      logoImage={githubLogo}
      url="https://github.com/ameobea"
      alt="Github logo linking to my personal Github profile"
    />
    <LogoLink
      logoImage={redditLogo}
      url="https://reddit.com/u/ameobea"
      alt="Reddit logo linking to my Reddit profile"
    />
    <LogoLink
      logoImage={twitterLogo}
      url="https://twitter.com/ameobea10"
      alt="Twitter logo linking to my personal Twitter"
    />
  </React.Fragment>
);

const Header = ({ siteTitle }) => (
  <div
    style={{
      background: 'rgb(44, 44, 44)',
      marginBottom: '0',
    }}
  >
    <div
      style={{
        margin: '0 auto',
        padding: '0.25rem',
      }}
    >
      <LogoLinks />
      <ANewTab
        href="https://ameo.link/blog/"
        style={{ fontSize: 16, textDecoration: 'none' }}
      >
        Blog
      </ANewTab>
    </div>
  </div>
);

export default Header;
