import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import { StaticQuery, graphql } from 'gatsby';

import './layout.css';
import Header from '../components/Header';
import HeaderMobile from '../components/HeaderMobile';

const styles = {
  root: {
    margin: '0 auto',
    maxWidth: 960,
    padding: '0px 1.0875rem 1.45rem',
    paddingTop: '1.45rem',
    backgroundColor: 'rgba(26, 26, 26, 0.94)',
  },
};

const Layout = ({
  showHeader = true,
  children,
  title,
  description,
  ...data
}) => (
  <Fragment>
    {/* Yeah this causes infinite recursion in dev mode due to some issues with the
    `Suspense`/hooks used on the homepage. */}
    {process.env.NODE_ENV !== 'development' ? (
      <Helmet
        title={
          title
            ? `${title} - ${data.site.siteMetadata.title}`
            : data.site.siteMetadata.title
        }
        meta={[
          {
            name: 'description',
            content: description || 'Homepage of Casey Primozic (Ameo)',
          },
          {
            name: 'keywords',
            content: 'Casey Primozic, Ameo, homepage, AmeoBea',
          },
        ]}
      >
        <html lang="en" />
      </Helmet>
    ) : null}

    {showHeader ? (
      <Fragment>
        <HeaderMobile />
        <Header />
      </Fragment>
    ) : null}

    <div style={styles.root}>{children}</div>
  </Fragment>
);

const query = graphql`
  query SiteTitleQuery {
    site {
      siteMetadata {
        title
      }
    }
  }
`;

const WrappedLayout = props => (
  <StaticQuery query={query} render={data => <Layout {...data} {...props} />} />
);

WrappedLayout.propTypes = {
  children: PropTypes.node.isRequired,
  showHeader: PropTypes.bool,
};

export default WrappedLayout;
