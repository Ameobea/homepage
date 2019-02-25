import React, { Suspense } from 'react';
import { Link } from 'gatsby';

import Layout from '../components/layout';
import ProfilePicture from '../components/ProfilePicture';
import {
  IndexLinkBlock,
  IndexLinkBlockSet,
} from '../components/IndexLinkBlock';
import IndexHeader from '../components/IndexHeader';
import './index.css';

const SpotifyFavorites = React.lazy(() => import('../components/Spotify'));

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
  tagLine: { fontSize: 18, paddingBottom: 14 },
};

const TagLine = () => (
  <div style={styles.tagLine}>
    I&apos;m a software developer interested in all kinds of programming. I love
    building <Link to="/portfolio/">websites</Link> and creating tools that
    people find useful.
  </div>
);

const IndexPage = () => (
  <React.Fragment>
    <IndexHeader />
    <Layout
      showHeader={false}
      description="The homepage of Casey Primozic / Ameo"
    >
      <div style={styles.title}>
        <h1 style={styles.headline}>Casey Primozic - Ameo</h1>
        <ProfilePicture size={125} />
      </div>

      <TagLine />

      <IndexLinkBlockSet>
        <IndexLinkBlock to="/portfolio/" text="Projects + Work Portfolio" />
        <IndexLinkBlock to="/contact/" text="Contact" />
        <IndexLinkBlock to="/blog/" text="Blog" />
        <IndexLinkBlock
          to="/professional/"
          text="Professional Skills and Experience"
        />
      </IndexLinkBlockSet>

      <Suspense fallback={null}>
        <SpotifyFavorites />
      </Suspense>
    </Layout>
  </React.Fragment>
);

export default IndexPage;
