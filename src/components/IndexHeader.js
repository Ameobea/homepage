import React from 'react';
import Link from 'gatsby-link';

import { ANewTab } from './util';
import githubLogo from '../images/social/github.svg';
import redditLogo from '../images/social/reddit.svg';
import twitterLogo from '../images/social/twitter.svg';
import linkedinLogo from '../images/social/linkedin.svg';

const styles = {
  headerWrapper: {
    background: 'rgb(44, 44, 44)',
    marginBottom: '0',
    display: 'flex',
  },
  header: {
    margin: '0 auto',
    padding: '0.25rem',
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    justifyItems: 'space-between',
  },
  textLink: {
    fontSize: 16,
    paddingLeft: 4,
    paddingRight: 4,
  },
  logoLinks: { paddingRight: 2 },
  logoLink: { display: 'inline', paddingLeft: 6, paddingRight: 6 },
  logo: { marginBottom: 0, marginTop: 6 },
  leftLinks: {
    display: 'flex',
    flex: 1,
  },
  rightLinks: {
    display: 'flex',
    flex: 0.2,
    justifyContent: 'flex-end',
  },
};

const LogoLink = ({ logoImage, url, alt = '', style = {} }) => (
  <div style={{ ...styles.logoLink, ...style }}>
    <ANewTab href={url}>
      <img src={logoImage} alt={alt} height={16} style={styles.logo} />
    </ANewTab>
  </div>
);

const NonLogoLink = ({ url, text }) => (
  <ANewTab href={url} style={styles.textLink} text={text} />
);

const LogoLinks = () => (
  <div style={styles.logoLinks}>
    <LogoLink
      logoImage={githubLogo}
      url="https://github.com/ameobea"
      alt="Github logo with transparent background"
    />
    <LogoLink
      logoImage={redditLogo}
      url="https://reddit.com/u/ameobea"
      alt="Reddit logo with transparent background"
    />
    <LogoLink
      logoImage={twitterLogo}
      url="https://twitter.com/ameobea10"
      alt="Twitter logo with transparent background"
    />
    <LogoLink
      logoImage={linkedinLogo}
      url="https://www.linkedin.com/in/casey-primozic-1712a3120/"
      alt="Linked log with transparent background"
      style={{ paddingLeft: 2 }}
    />
  </div>
);

const Header = ({ siteTitle }) => (
  <div style={styles.headerWrapper}>
    <div style={styles.header}>
      <div style={styles.leftLinks}>
        <LogoLinks />
        <NonLogoLink url="https://ameo.link/blog/" text="Blog" />
        <NonLogoLink url="https://ameo.link/resume" text="Résume" />
      </div>

      <div style={styles.rightLinks}>
        <i>
          <Link to="/imprint/" style={styles.textLink}>
            Imprint
          </Link>
        </i>
      </div>
    </div>
  </div>
);

export default Header;
