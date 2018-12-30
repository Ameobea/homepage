import React from 'react';
import { StaticQuery, graphql } from 'gatsby';
import * as R from 'ramda';

import Layout from '../components/layout';
import { ANewTab } from '../components/util';

const Licenses = ({ licenses }) => (
  <ul>
    {licenses.map(({ name, summary }, i) => (
      <li key={i}>{`${name}: ${summary}`}</li>
    ))}
  </ul>
);

const LinkedinIconCredit = () => (
  <React.Fragment>
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
  </React.Fragment>
);

const HamburgerIconCredit = () => (
  <React.Fragment>
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
  </React.Fragment>
);

const ImprintContent = ({ licenses }) => (
  <Layout title="Imprint" description="Imprint + Credits for cprimozic.net">
    <div>
      <p>
        Full source code of this website is available{' '}
        <ANewTab to="https://github.com/ameobea/homepage" text="on Github" />.
      </p>
      <h2>Licenses of dependencies used on the site</h2>
      <Licenses licenses={licenses} />
      <LinkedinIconCredit />
      <HamburgerIconCredit />
    </div>
  </Layout>
);

const Imprint = () => (
  <StaticQuery
    query={graphql`
      {
        allLicensesCsv {
          edges {
            node {
              name
              repository
              summary
            }
          }
        }
      }
    `}
    render={({ allLicensesCsv }) => {
      const licenses = allLicensesCsv.edges.map(R.prop('node'));
      const dedupedLicenses = R.dropRepeatsWith(
        R.eqBy(R.prop('name')),
        licenses
      );
      return <ImprintContent licenses={dedupedLicenses} />;
    }}
  />
);

export default Imprint;
