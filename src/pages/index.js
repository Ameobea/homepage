import React from 'react';
import { Link } from 'gatsby';

import Layout from '../components/layout';
import ProfilePicture from '../components/ProfilePicture';

const IndexPage = () => (
  <Layout>
    <div
      style={{
        display: 'flex',
        flex: 1,
        justifyContent: 'flexStart',
        alignItems: 'center',
      }}
    >
      <ProfilePicture size={125} />
      <h1 style={{ paddingLeft: '1.25rem' }}>Casey Primozic - Ameo</h1>
    </div>
    <Link to="/portfolio/">Work Portfolio</Link>
  </Layout>
);

export default IndexPage;
