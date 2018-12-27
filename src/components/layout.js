import React from 'react';
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

const Layout = ({ showHeader = true, children, ...data }) => (
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

    <div style={styles.root}>{children}</div>
  </React.Fragment>
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
