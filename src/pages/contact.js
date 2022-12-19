import React from 'react';

import Layout from '../components/layout';
import { ANewTab } from '../components/util';

const Contact = () => (
  <Layout
    title="Contact Me"
    description="Contact information for Casey Primozic / Ameo"
  >
    <center>
      <h1>Contact Info</h1>
    </center>
    <p>
      There are plenty of ways to contact me! The best ones are below; pick
      whichever one works best for you.
    </p>
    <ul>
      <li>
        Email:{' '}
        <a href="ma&#105;lt&#111;&#58;%63a&#115;e&#121;&#64;cp&#114;&#105;moz&#105;&#99;&#46;n%65&#116;">
          cas&#101;y&#64;cpr&#105;mozic&#46;net
        </a>
      </li>
      <li>Discord: Ameo#0493</li>
      <li>
        Twitter (DM or @):{' '}
        <ANewTab to="https://twitter.com/ameobea10/" text="@ameobea10" />
      </li>
      <li>
        Reddit: <ANewTab to="https://reddit.com/u/ameobea" text="/u/ameobea" />
      </li>
      <li>
        Mastodon:{' '}
        <ANewTab
          to="https://mastodon.ameo.dev/@ameo"
          text="@ameo@mastodon.ameo.dev"
        />
      </li>
    </ul>
  </Layout>
);

export default Contact;
