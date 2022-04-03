import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { StaticQuery, graphql } from 'gatsby';

import './layout.css';
import Header from '../components/Header';
import HeaderMobile from '../components/HeaderMobile';
import { filterNils } from 'ameo-utils';

const styles = {
  root: {
    margin: '0 auto',
    maxWidth: 1080,
    padding: '0px 1.0875rem 1.45rem',
    paddingTop: '1.45rem',
    backgroundColor: 'rgb(15,15,15)',
  },
};

const Layout = ({
  showHeader = true,
  children,
  title,
  description,
  siteName,
  style = {},
  image,
  meta = [],
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
        meta={filterNils([
          {
            name: 'og:title',
            content: title ? title : data.site.siteMetadata.title,
          },
          {
            name: 'og:site_name',
            content: siteName ?? 'Homepage of Casey Primozic / ameo',
          },
          description
            ? {
                name: 'og:description',
                content: description || 'Homepage of Casey Primozic / ameo',
              }
            : null,
          description
            ? {
                name: 'description',
                content: description || 'Homepage of Casey Primozic / ameo',
              }
            : null,
          image ? { name: 'og:image', content: image } : null,
          {
            name: 'keywords',
            content: 'Casey Primozic, Ameo, AmeoBea',
          },
          {
            name: 'twitter:site',
            content: 'ameobea10',
          },
          {
            name: 'twitter:creator',
            content: 'ameobea10',
          },
          {
            name: 'twitter:title',
            content: title ? title : data.site.siteMetadata.title,
          },
          ...meta,
        ])}
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
  <StaticQuery
    query={query}
    render={(data) => <Layout {...data} {...props} />}
  />
);

WrappedLayout.propTypes = {
  children: PropTypes.node.isRequired,
  showHeader: PropTypes.bool,
};

export default WrappedLayout;
