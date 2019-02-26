import React, {
  Fragment,
  useRef,
  useEffect,
  useState,
  CSSProperties,
} from 'react';
import Img from 'gatsby-image';
import * as R from 'ramda';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause } from '@fortawesome/free-solid-svg-icons';

import { ANewTab } from '../util';

const styles: { [key: string]: CSSProperties } = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    flexBasis: 160,
    height: 160,
    marginBottom: 30,
    fontSize: 14,
    marginRight: 10,
    alignItems: 'center',
    color: 'white',
  },
  imageBoxContent: {
    display: 'flex',
    flexDirection: 'column',
    height: 160,
  },
  data: {
    zIndex: 2,
    padding: 4,
    alignItems: 'flex-start',
    width: 160,
    height: 160,
  },
  imageContainer: {
    position: 'absolute',
    width: 160,
    height: 160,
    zIndex: -1,
  },
  playPauseButton: {
    cursor: 'pointer',
    display: 'inline-block',
    mixBlendMode: 'exclusion',
    fontSize: 20,
  },
  link: {
    zIndex: 2,
    color: 'white',
  },
  imageBoxGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 10,
    textAlign: 'center',
  },
  timeframeSelector: {
    paddingBottom: 30,
  },
  showMore: {
    textDecoration: 'underline',
    cursor: 'pointer',
    fontSize: 21,
    textAlign: 'center',
  },
};

const ImageBox = ({ image, imgAlt, children }) => (
  <div style={styles.root}>
    <div className="track">
      <Img
        alt={imgAlt}
        fluid={image.localFile.childImageSharp.fluid}
        style={styles.imageContainer}
        className="image-wrapper"
      />

      <div style={styles.imageBoxContent}>{children}</div>
    </div>
  </div>
);

export const Track = ({
  title,
  artists,
  previewUrl,
  album,
  image,
  playing,
  setPlaying,
}) => {
  const isPlaying = playing === previewUrl;
  const audioTag = useRef(null);
  useEffect(() => {
    const audioElem = audioTag.current;
    if (!audioElem) {
      return;
    }

    audioElem.volume = 0.2;
    if (!onended) {
      audioElem.onended = () => setPlaying(false);
    }

    if (isPlaying) {
      audioElem.play();
    } else {
      audioElem.pause();
    }
  });

  return (
    <ImageBox
      imgAlt={`Album art for ${title} on ${album} by ${artists
        .map(R.prop('name'))
        .join(', ')}`}
      image={image}
    >
      <div style={styles.data} className="track-datum">
        <div>{title}</div>
        <div>{album}</div>
        <span style={{ zIndex: 2 }}>
          {artists.map(({ name, uri }, i) => (
            <Fragment key={uri || name}>
              <a href={uri} style={styles.link}>
                {name}
              </a>
              {i !== artists.length - 1 ? ', ' : null}
            </Fragment>
          ))}
        </span>
        <audio preload="none" ref={audioTag} src={previewUrl} />
      </div>

      <div
        style={{ display: 'flex', padding: 4 }}
        onClick={() => setPlaying(isPlaying ? false : previewUrl)}
      >
        <FontAwesomeIcon
          icon={isPlaying ? faPause : faPlay}
          style={styles.playPauseButton}
        />
      </div>
    </ImageBox>
  );
};

const PREFERRED_GENRES = new Set([
  'vapor twitch',
  'vapor soul',
  'art pop',
  'indie pop',
  'indietronica',
  'folk-pop',
  'chillwave',
]);

type ArtistProps = {
  name: string;
  genres: string[];
  image: object;
  uri: string;
};

const Genre = ({ genre }: { genre: string }) => {
  const to = `http://everynoise.com/engenremap-${genre.replace(' ', '')}.html`;
  return <ANewTab to={to} text={genre} style={{ color: 'white' }} />;
};

export const Artist = ({ name, genres, image, uri }: ArtistProps) => {
  // Make sure that preferred genres show up and aren't trimmed off
  const [preferred, other] = R.partition(
    genre => PREFERRED_GENRES.has(genre),
    genres
  );
  const trimmedGenres = [...preferred, ...other].slice(0, 6);

  return (
    <ImageBox imgAlt={name} image={image}>
      <div style={styles.data} className="track-datum">
        <div>
          <a href={uri} style={styles.link}>
            {name}
          </a>
        </div>
        <div>
          {trimmedGenres.map((genre, i) => (
            <Fragment>
              <Genre genre={genre} />
              {i !== trimmedGenres.length - 1 ? ', ' : null}
            </Fragment>
          ))}
        </div>
      </div>
    </ImageBox>
  );
};

const TimeframeSelector = ({ timeframe, setTimeframe }) => (
  <div style={styles.timeframeSelector}>
    Timeframe:{' '}
    {['short', 'medium', 'long'].map((frame, i, frames) => (
      <Fragment key={frame}>
        <span
          style={{
            textDecoration: 'underline',
            ...(frame === timeframe
              ? { fontWeight: 'bold', fontSize: 22 }
              : { cursor: 'pointer' }),
          }}
          onClick={() => setTimeframe(frame)}
        >
          {frame}
        </span>
        {i !== frames.length - 1 ? ' \u2022 ' : null}
      </Fragment>
    ))}
  </div>
);

export const ImageBoxGrid = ({ renderItem, initialItems, maxItems, title }) => {
  const [timeframe, setTimeframe] = useState('short');
  const [isExpanded, setIsExpanded] = useState(false);
  const itemCount = isExpanded ? maxItems : initialItems;

  return (
    <Fragment>
      <h3 style={styles.header}>{title}</h3>
      <TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} />
      <div style={styles.imageBoxGrid}>
        {R.times(R.identity, itemCount).map(i => renderItem(i, timeframe))}
      </div>
      {!isExpanded ? (
        <div onClick={() => setIsExpanded(true)} style={styles.showMore}>
          Show More
        </div>
      ) : null}
    </Fragment>
  );
};
