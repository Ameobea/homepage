import React from 'react';

import Layout from '../components/layout';
import ProfilePicture from '../components/ProfilePicture';
import {
  IndexLinkBlock,
  IndexLinkBlockSet,
} from '../components/IndexLinkBlock';

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
};

const TagLine = () => (
  <div style={{ fontFamily: 'monospace', fontSize: 16 }}>
    {"I'm a software developer or whatever I feel would be good to put here."}
  </div>
);

const IndexPage = () => (
  <Layout>
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
);

export default IndexPage;
