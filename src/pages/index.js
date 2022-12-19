import React, { Suspense, useState, useEffect } from 'react';
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
    building <Link to="/portfolio/">web applications</Link> and creating tools
    that people find useful.
  </div>
);

const IndexPage = () => {
  const [spotifyTops, setSpotifyTops] = useState(null);
  useEffect(() => {
    if (window && !spotifyTops) {
      const newSpotifyTops = (
        <Suspense fallback={null}>
          <SpotifyFavorites />
        </Suspense>
      );

      setSpotifyTops(newSpotifyTops);
    }
  });

  return (
    <>
      <IndexHeader />
      <Layout
        showHeader={false}
        description="The homepage of Casey Primozic / Ameo"
      >
        <div style={styles.title}>
          <h1 style={styles.headline}>Casey Primozic // ameo</h1>
          <ProfilePicture />
        </div>

        <TagLine />

        <IndexLinkBlockSet>
          <IndexLinkBlock to="/portfolio/" text="Projects + Work Portfolio" />
          <IndexLinkBlock to="/blog/" text="Blog" />
          <IndexLinkBlock to="/contact/" text="Contact" />
          <IndexLinkBlock
            to="/professional/"
            text="Professional Skills and Experience"
          />
        </IndexLinkBlockSet>

        {spotifyTops}

        <a
          style={{ display: 'none' }}
          rel="me"
          href="https://mastodon.ameo.dev/@ameo"
        >
          Mastodon
        </a>
      </Layout>
    </>
  );
};

export default IndexPage;
