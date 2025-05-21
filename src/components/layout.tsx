import React from 'react';
import { Helmet } from 'react-helmet';
import { graphql, useStaticQuery } from 'gatsby';

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
    backgroundColor: 'rgb(24,24,24)',
  },
};

const query = graphql`
  query SiteTitleQuery {
    site {
      siteMetadata {
        title
      }
    }
  }
`;

interface LayoutProps {
  showHeader?: boolean;
  children: React.ReactNode;
  title?: string;
  description?: string;
  siteName?: string;
  style?: React.CSSProperties;
  image?: string | null | undefined;
  meta?: { name: string; content: string }[];
}

const Layout: React.FC<LayoutProps> = ({
  showHeader = true,
  children,
  title,
  description,
  siteName,
  style = {},
  image,
  meta = [],
}) => {
  const data = useStaticQuery(query);
  return (
    <>
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

      {showHeader ? (
        <>
          <HeaderMobile />
          <Header />
        </>
      ) : null}

      <div style={{ ...styles.root, ...style }}>{children}</div>
    </>
  );
};

export default Layout;
