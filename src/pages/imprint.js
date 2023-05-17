import React from 'react';
import { StaticQuery, graphql, Link } from 'gatsby';
import * as R from 'ramda';

import Layout from '../components/layout';
import { ANewTab } from '../components/util';

const LinkedinIconCredit = () => (
  <>
    LinkedIn icon made by{' '}
    <a href="https://www.flaticon.com/authors/simpleicon" title="SimpleIcon">
      SimpleIcon
    </a>{' '}
    from{' '}
    <a href="https://www.flaticon.com/" title="Flaticon">
      www.flaticon.com
    </a>{' '}
    is licensed by{' '}
    <a
      href="http://creativecommons.org/licenses/by/3.0/"
      title="Creative Commons BY 3.0"
      target="_blank"
      rel="noopener noreferrer"
    >
      CC 3.0 BY
    </a>
  </>
);

const HamburgerIconCredit = () => (
  <>
    Hamburger menu icon made by{' '}
    <ANewTab to="https://www.iconfinder.com/tmthymllr" text="Timothy Miller" />{' '}
    and licensed by licensed by{' '}
    <a
      href="http://creativecommons.org/licenses/by/3.0/"
      title="Creative Commons BY 3.0"
      target="_blank"
      rel="noopener noreferrer"
    >
      CC 3.0 BY
    </a>
    . I changed the color to white, so the derivative work is also licensed
    under CC 3.0 BY.
  </>
);

const ImprintContent = () => (
  <Layout title="Imprint" description="Imprint + Credits for cprimozic.net">
    <div>
      <p>
        Full source code of this website is available{' '}
        <ANewTab to="https://github.com/ameobea/homepage" text="on Github" />.
      </p>
      <LinkedinIconCredit />
      <br />
      <br />
      <HamburgerIconCredit />
      <br />
      <br />
      <Link to="/text/">A1.362713562</Link>
    </div>
  </Layout>
);

export default ImprintContent;
