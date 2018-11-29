import React from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import { StaticQuery, graphql } from 'gatsby';

import './layout.css';
import Header from '../components/Header';
import HeaderMobile from '../components/HeaderMobile';

const Layout = ({ children, showHeader = true }) => (
  <StaticQuery
    query={graphql`
      query SiteTitleQuery {
        site {
          siteMetadata {
            title
          }
        }
      }
    `}
    render={data => (
      <React.Fragment>
        <Helmet
          title={data.site.siteMetadata.title}
          meta={[
            {
              name: 'description',
              content: 'Homepage of Casey Primozic (Ameo)',
            },
            {
              name: 'keywords',
              content: 'Casey Primozic, Ameo, homepage, AmeoBea',
            },
          ]}
        >
          <html lang="en" />
        </Helmet>
        {showHeader ? (
          <React.Fragment>
            <HeaderMobile />
            <Header />
          </React.Fragment>
        ) : null}

        <div
          style={{
            margin: '0 auto',
            maxWidth: 960,
            padding: '0px 1.0875rem 1.45rem',
            paddingTop: '1.45rem',
            backgroundColor: 'rgba(36, 36, 36, 0.92)',
          }}
        >
          {children}
        </div>
      </React.Fragment>
    )}
  />
);

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
