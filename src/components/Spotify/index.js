/**
 * Displays a listing of what I've been listening to on Spotify recently, complete with album art,
 * song info, and other cool things.
 */

import React, { useState, Fragment } from 'react';
import { StaticQuery, graphql } from 'gatsby';

import { Track, Artist, ImageBoxGrid } from './ImageBox';

const mapTrackDataToTrackProps = ({
  node: {
    id,
    name,
    preview_url,
    artists,
    album: { name: albumName },
    image,
  },
}) => ({
  id,
  title: name,
  previewUrl: preview_url,
  artists,
  album: albumName,
  image,
});

const SpotifyFavorites = ({ topTracks, topArtists, playing, setPlaying }) => (
  <>
    <ImageBoxGrid
      initialItems={5}
      maxItems={20}
      title="My Recent Favorite Tracks on Spotify"
      renderItem={(i, timeframe) => {
        if (!topTracks[timeframe][i]) {
          return null;
        }

        const { id, ...props } = mapTrackDataToTrackProps(
          topTracks[timeframe][i]
        );

        return (
          <Track
            key={id}
            playing={playing}
            setPlaying={setPlaying}
            {...props}
          />
        );
      }}
    />

    <ImageBoxGrid
      title="My Recent Favorite Artists on Spotify"
      initialItems={5}
      maxItems={20}
      renderItem={(i, timeframe) => {
        const artist = topArtists[timeframe][i];
        if (!artist) {
          return null;
        }
        const {
          node: { name, genres, image, uri, id },
        } = artist;

        return (
          <Artist
            key={id}
            name={name}
            genres={genres}
            image={image}
            uri={uri}
          />
        );
      }}
    />
  </>
);

export const pickedTopArtistFragment = graphql`
  fragment PickedTopArtist on SpotifyTopArtist {
    id
    name
    genres
    uri
    image {
      localFile {
        childImageSharp {
          fixed(width: 160, height: 160) {
            ...GatsbyImageSharpFixed_withWebp_noBase64
          }
        }
      }
    }
  }
`;

export const pickedTopTrackFragment = graphql`
  fragment PickedTopTrack on SpotifyTopTrack {
    id
    name
    preview_url
    artists {
      name
      uri
    }
    album {
      name
    }
    image {
      localFile {
        childImageSharp {
          fixed(width: 160, height: 160) {
            ...GatsbyImageSharpFixed_withWebp_noBase64
          }
        }
      }
    }
  }
`;

const topTracksQuery = graphql`
  {
    allSpotifyTopTrackShort: allSpotifyTopTrack(
      filter: { time_range: { eq: "short_term" } }
      sort: { fields: order }
      limit: 1000
    ) {
      edges {
        node {
          ...PickedTopTrack
        }
      }
    }

    allSpotifyTopArtistShort: allSpotifyTopArtist(
      filter: { time_range: { eq: "short_term" } }
      sort: { fields: order }
      limit: 1000
    ) {
      edges {
        node {
          ...PickedTopArtist
        }
      }
    }

    allSpotifyTopTrackMedium: allSpotifyTopTrack(
      filter: { time_range: { eq: "medium_term" } }
      sort: { fields: order }
      limit: 1000
    ) {
      edges {
        node {
          ...PickedTopTrack
        }
      }
    }

    allSpotifyTopArtistMedium: allSpotifyTopArtist(
      filter: { time_range: { eq: "medium_term" } }
      sort: { fields: order }
      limit: 1000
    ) {
      edges {
        node {
          ...PickedTopArtist
        }
      }
    }

    allSpotifyTopTrackLong: allSpotifyTopTrack(
      filter: { time_range: { eq: "long_term" } }
      sort: { fields: order }
      limit: 1000
    ) {
      edges {
        node {
          ...PickedTopTrack
        }
      }
    }

    allSpotifyTopArtistLong: allSpotifyTopArtist(
      filter: { time_range: { eq: "long_term" } }
      sort: { fields: order }
      limit: 1000
    ) {
      edges {
        node {
          ...PickedTopArtist
        }
      }
    }
  }
`;

const SpotifyFavoritesWithQuery = () => {
  const [playing, setPlaying] = useState(false);

  const ChildComponent = ({
    allSpotifyTopTrackShort: { edges: topTracksShort },
    allSpotifyTopArtistShort: { edges: topArtistsShort },
    allSpotifyTopTrackMedium: { edges: topTracksMedium },
    allSpotifyTopArtistMedium: { edges: topArtistsMedium },
    allSpotifyTopTrackLong: { edges: topTracksLong },
    allSpotifyTopArtistLong: { edges: topArtistsLong },
  }) => {
    const topTracks = {
      short: topTracksShort,
      medium: topTracksMedium,
      long: topTracksLong,
    };

    const topArtists = {
      short: topArtistsShort,
      medium: topArtistsMedium,
      long: topArtistsLong,
    };

    return (
      <SpotifyFavorites
        playing={playing}
        setPlaying={setPlaying}
        topTracks={topTracks}
        topArtists={topArtists}
      />
    );
  };

  return <StaticQuery query={topTracksQuery} render={ChildComponent} />;
};

export default SpotifyFavoritesWithQuery;
