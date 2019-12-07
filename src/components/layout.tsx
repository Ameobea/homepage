import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import _Helmet from 'react-helmet';
import { StaticQuery, graphql } from 'gatsby';

import './layout.css';
import Header from '../components/Header';
import HeaderMobile from '../components/HeaderMobile';

const Helmet = _Helmet as any;

const styles = {
  root: {
    margin: '0 auto',
    maxWidth: 1080,
    padding: '0px 1.0875rem 1.45rem',
    paddingTop: '1.45rem',
    backgroundColor: 'rgb(26, 26, 26)',
  },
};

const Layout = ({
  showHeader = true,
  children,
  title,
  description,
  style = {},
  ...data
}) => (
  <>
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
      <>
        <HeaderMobile />
        <Header />
      </>
    ) : null}

    <div style={{ ...styles.root, ...style }}>{children}</div>
  </>
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

const WrappedLayout = ({ ...props }) => (
  <StaticQuery query={query} render={data => <Layout {...data} {...props} />} />
);

WrappedLayout.propTypes = {
  children: PropTypes.node.isRequired,
  showHeader: PropTypes.bool,
};

export default WrappedLayout;
