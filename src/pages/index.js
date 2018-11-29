import React from 'react';

import Layout from '../components/layout';
import ProfilePicture from '../components/ProfilePicture';
import {
  IndexLinkBlock,
  IndexLinkBlockSet,
} from '../components/IndexLinkBlock';
import IndexHeader from '../components/IndexHeader';

const styles = {
  title: {
    display: 'flex',
    flex: 1,
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
    flexWrap: 'wrap',
  },
  headline: { paddingLeft: '1.25rem', textAlign: 'center' },
  tagLine: { fontSize: 16, fontFamily: "'Oxygen Mono', monospace" },
};

const TagLine = () => (
  <div style={styles.tagLine}>
    {"I'm a software developer or whatever I feel would be good to put here."}
  </div>
);

const IndexPage = () => (
  <React.Fragment>
    <IndexHeader />
    <Layout showHeader={false}>
      <div style={styles.title}>
        <h1 style={styles.headline}>Casey Primozic - Ameo</h1>
        <ProfilePicture size={125} />
      </div>

      <TagLine />

      <IndexLinkBlockSet>
        <IndexLinkBlock to="/portfolio/" text="Projects + Work Portfolio" />
        <IndexLinkBlock to="/contact/" text="Contact" />
        <IndexLinkBlock to="/about/" text="About Me" />
      </IndexLinkBlockSet>
    </Layout>
  </React.Fragment>
);

export default IndexPage;
