import React from 'react';

import { ANewTab } from './util';
import githubLogo from '../images/social/github.svg';
import redditLogo from '../images/social/reddit.svg';
import twitterLogo from '../images/social/twitter.svg';

const styles = {
  headerWrapper: {
    background: 'rgb(44, 44, 44)',
    marginBottom: '0',
  },
  header: {
    margin: '0 auto',
    padding: '0.25rem',
  },
  textLink: { fontSize: 16, textDecoration: 'none', paddingRight: 4 },
  logoLink: { display: 'inline', paddingLeft: 6, paddingRight: 6 },
  logo: { marginBottom: 0, marginTop: 6 },
};

const LogoLink = ({ logoImage, url, alt = '' }) => (
  <div style={styles.logoLink}>
    <ANewTab href={url}>
      <img src={logoImage} alt={alt} height={16} style={styles.logo} />
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
  <div style={styles.headerWrapper}>
    <div style={styles.header}>
      <LogoLinks />
      <ANewTab href="https://ameo.link/blog/" style={styles.textLink}>
        Blog
      </ANewTab>
      <ANewTab href="https://ameo.link/resume" style={styles.textLink}>
        Résumé
      </ANewTab>
    </div>
  </div>
);

export default Header;
