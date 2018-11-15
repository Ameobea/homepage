import React from 'react';
import { Link } from 'gatsby';

import Layout from '../components/layout';
import ProfilePicture from '../components/ProfilePicture';
import {
  IndexLinkBlock,
  IndexLinkBlockSet,
} from '../components/IndexLinkBlock';

const TagLine = () => (
  <div style={{ fontFamily: 'monospace', fontSize: 16 }}>
    I'm a software developer or whatever I feel would be good to put here.
  </div>
);

const IndexPage = () => (
  <Layout>
    <div
      style={{
        display: 'flex',
        flex: 1,
        justifyContent: 'flexStart',
        alignItems: 'center',
        paddingBottom: 40,
      }}
    >
      <ProfilePicture size={125} />
      <h1 style={{ paddingLeft: '1.25rem' }}>Casey Primozic - Ameo</h1>
    </div>

    <TagLine />

    <IndexLinkBlockSet>
      <IndexLinkBlock to="/portfolio/" text="Work Portfolio" />
      <IndexLinkBlock to="/portfolio/" text="Work Portfolio" />
      <IndexLinkBlock to="/portfolio/" text="Work Portfolio" />
    </IndexLinkBlockSet>
  </Layout>
);

export default IndexPage;
