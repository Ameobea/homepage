import React from 'react';

import Layout from '../components/layout';
import { ANewTab } from '../components/util';

const Contact = () => (
  <Layout>
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
        <a href="mailto&#58;&#109;%6&#53;&#64;a%6De%&#54;F&#46;l%6&#57;%6&#69;k">
          me&#64;a&#109;eo&#46;link
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
    </ul>
  </Layout>
);

export default Contact;
