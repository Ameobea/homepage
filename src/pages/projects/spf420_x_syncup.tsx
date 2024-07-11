import React from 'react';
import { StaticQuery, graphql } from 'gatsby';
import { GatsbyImage } from 'gatsby-plugin-image';

import Layout from '../../components/layout';
import { ANewTab, BannerImage } from '../../components/util';

const SPF420XSyncup: React.FC<{ stickerPicker: any; poster: any }> = ({
  stickerPicker,
  poster,
}) => {
  return (
    <Layout
      title="SPF420 X SYNC^UP"
      description="An overview of the SPF420 X SYNC^UP online concert series and the tech stack I built up to make it possible"
    >
      <h1>SPF420 x SYNC^UP</h1>

      <BannerImage
        img={poster}
        alt="The poster for the March 28th SPF420 x SYNC^UP event, created by @paralyna"
        style={{ maxWidth: 300, marginLeft: 'auto', marginRight: 'auto' }}
      />

      <p>
        Originally, I was working with a group of people to help link up a set
        of three concerts taking places in different cities via live streams,
        allowing crowds from the different venues to see each other and feel
        connected with the online viewers. However, that got canceled due to
        COVID-19.
      </p>

      <p>
        Instead, we teamed up with the people behind the online concert series{' '}
        <ANewTab text="SPF420" to="https://twitter.com/SPF420_inc" />, which had
        been on hiatus for several years, to put on a fully online concert.
        Since I'd already done a bit of work for the livestreaming component of
        the SYNC^UP project, I took up the task of adapting it to work with the
        new idea. Instead of sharing streams of crowds from different venues
        with each other, the goal became allowing multiple artists to stream
        themselves DJing and combine it with streams of visuals from VJs.
      </p>

      <p>
        As luck would have it, I had a week off of work due to changing jobs and
        was also quarentined in my apartment, giving me a whole week to spend
        pretty much all on building out the setup for this concert. To see the
        result, check out the videos on Youtube:
      </p>

      <div style={{ textAlign: 'center' }}>
        <iframe
          width="100%"
          style={{ height: '50vh', outline: 'none', border: 'none' }}
          src="https://www.youtube-nocookie.com/embed/videoseries?list=PLKtSHnHH_YMcePyyNu3OF5IRLTik2QAdP"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          {...{ allowfullscreen: true }}
        ></iframe>
      </div>

      <p>
        The first concert was a massive success, and we have more planned. I'm
        still thinking about what kinds of changes or additions I want to add
        for the next iterations but am looking forward to being a part of the
        project as it continues to grow into the future.
      </p>

      <h2>Tech Stack</h2>
      <p>
        There were two main parts to the setup: the streaming architecture and
        the website + live interactive components. The livestream itself was
        hosted on Mixer and embedded into the webpage via an iframe.
      </p>

      <h2>Streaming Architecture</h2>
      <p>
        The streaming architecture for this project was quite complicated. The
        idea was simple: get a bunch of different artists streaming their audio
        and/or video to my server, combine it with other artists' audio/visuals
        dynamically, and relay the result to Mixer. However, due to a number of
        different hurdles and unexpected challenges, I ended up building an
        internal NodeJS and React app to manage routing streams and managing
        who's live, running an Ubuntu desktop instance inside Docker on a VM in
        the cloud, and even{' '}
        <ANewTab
          to="https://github.com/Ameobea/FFmpeg/tree/restartable-ffplay"
          text="forking FFMPEG"
        />
        .
      </p>

      <p>
        After everything was said and done, though, it worked quite well and all
        of the pieces worked well together to produce a dynamic and functional
        concert experience. I should write more about it at some point because
        it really is quite an impressive setup if I do say so myself.
      </p>

      <h2>Website, Chat, and Stickers</h2>
      <p>
        The main feature of this was a Rust websocket server that provided all
        of the functionality for the live chat, cursor trails, and stickers. It
        operated via protobufs over websocket allowing for the total bandwidth
        of the system to be kept as low as possible. The chat had built-in
        moderation capabilities, rate-limiting, and quality control (max
        username/message length, etc.). After a couple initial crashes and a
        hotfix due to Rust panicking when `.truncate()`ing a string in the
        middle of a Unicode codepoint, the server continued operating without
        issue for the whole event.
      </p>

      <p>
        The main interactivity besides the chat was the ability to see mouse
        trails of all other users as they move their mice around the background,
        producing a sort of "rave glow stick" effect, as well as the ability to
        place down stickers in the background. It was really cool to see people
        coordinate their sticker-placing in response to different events in the
        concert, like spamming down Miku stickers in the "Miku Pit" in response
        to Miku making an appearance in one of the tracks.
      </p>

      <p>
        One thing I'd like to look into is optimizing the performance of the
        stickers by using plain HTML images rather than rendering to a canvas.
        That way, instead of having to re-draw all of the hundreds of stickers
        every time anything happened, only changed images would need to be
        updated. Even without that optimization, however, performance seemed
        pretty good for most users and the site worked even on mobile devices.
      </p>

      <div style={{ textAlign: 'center' }}>
        <GatsbyImage
          image={stickerPicker.childImageSharp.gatsbyImageData}
          alt="A screenshot of the UI for picking which sticker a user placed when they clicked on the background of the site"
        />
      </div>
    </Layout>
  );
};

const query = graphql`
  {
    stickerPicker: file(
      relativePath: { eq: "projects/spf420_x_syncup/stickerpicker.png" }
    ) {
      childImageSharp {
        gatsbyImageData(
          width: 260
          height: 260
          placeholder: NONE
          layout: FIXED
          formats: [AVIF, AUTO]
        )
      }
    }
    poster: file(relativePath: { eq: "projects/spf420_x_syncup/poster.png" }) {
      childImageSharp {
        gatsbyImageData(quality: 85, layout: FULL_WIDTH, formats: [AVIF, AUTO])
      }
    }
  }
`;

const WrappedSPF420XSyncup: React.FC = () => (
  <StaticQuery query={query} render={SPF420XSyncup} />
);

export default WrappedSPF420XSyncup;
