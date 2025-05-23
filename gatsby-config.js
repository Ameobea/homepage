const process = require('process');

// Load environment variables from `.env`
require('dotenv').config();

const HEADER_LINK_SVG_CONTENT =
  '<svg aria-hidden="true" height="20" version="1.1" viewBox="0 0 16 16" width="20" style="stroke: rgb(220, 220, 220);"><path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z"></path></svg>';

module.exports = {
  siteMetadata: {
    title: "Casey Primozic's Homepage",
    description: 'Personal website of Casey Primozic / ameo',
    siteUrl: 'https://cprimozic.net',
  },
  assetPrefix: 'https://cprimozic.b-cdn.net',
  flags: {
    DEV_SSR: true,
  },
  plugins: [
    'gatsby-plugin-typescript',
    'gatsby-plugin-react-helmet',
    'gatsby-transformer-json',
    'gatsby-plugin-sitemap',
    'gatsby-plugin-image',
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'images',
        path: `${__dirname}/src/images`,
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'projectManifest',
        path: `${__dirname}/src/projectManifest.json`,
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'noteBlogPosts',
        path: `${__dirname}/src/noteBlogPosts.json`,
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'workExperience',
        path: `${__dirname}/src/workExperience.json`,
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'blog',
        path: `${__dirname}/src/blog`,
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'blog',
        path: `${__dirname}/src/blog/images`,
      },
    },
    {
      resolve: 'gatsby-transformer-remark',
      options: {
        plugins: [
          {
            resolve: 'gatsby-remark-images',
            options: {
              maxWidth: 840,
              withWebp: false,
              withAvif: true,
              backgroundColor: 'rgba(36, 36, 36, 0.92)',
              quality: 86,
            },
          },
          {
            resolve: 'gatsby-remark-autolink-headers',
            options: {
              icon: HEADER_LINK_SVG_CONTENT,
            },
          },
          {
            resolve: 'gatsby-remark-prismjs',
            options: {
              classPrefix: 'language-',
              inlineCodeMarker: null,
              aliases: { rs: 'rust' },
              showLineNumbers: false,
              noInlineHighlight: false,
            },
          },
          'gatsby-remark-copy-linked-files',
          {
            resolve: 'gatsby-remark-katex',
            options: {
              // Add any KaTeX options from https://github.com/KaTeX/KaTeX/blob/master/docs/options.md here
              strict: 'ignore',
              fleqn: true,
            },
          },
        ],
      },
    },
    'gatsby-transformer-sharp',
    'gatsby-plugin-sharp',
    {
      resolve: 'gatsby-source-spotify',
      options: {
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        refreshToken: process.env.SPOTIFY_REFRESH_TOKEN,
        fetchPlaylists: false, // optional. Set to false to disable fetching of your playlists
        timeRanges: ['short_term', 'medium_term', 'long_term'],
      },
    },
    {
      resolve: 'gatsby-plugin-feed',
      options: {
        query: `
          {
            site {
              siteMetadata {
                title
                description
                siteUrl
                site_url: siteUrl
              }
            }
          }
        `,
        feeds: [
          {
            serialize: ({
              query: { site, allMarkdownRemark, allNoteBlogPostsJson },
            }) => {
              const blogEntries = allMarkdownRemark.edges.map(
                ({
                  node: {
                    frontmatter: { date, title },
                    fields: { slug },
                    excerpt,
                  },
                }) => {
                  const postUrl = `${site.siteMetadata.siteUrl}/blog${slug}`;
                  return {
                    date: new Date(date).toUTCString(),
                    title,
                    url: postUrl,
                    guid: postUrl,
                    description: excerpt,
                  };
                }
              );
              const noteEntries = allNoteBlogPostsJson.edges.map(
                ({ node: { date, title, slug } }) => {
                  const postUrl = `${site.siteMetadata.siteUrl}/notes/posts/${slug}/`;
                  return {
                    date: new Date(date).toUTCString(),
                    title,
                    url: postUrl,
                    guid: postUrl,
                  };
                }
              );

              const allEntries = [...blogEntries, ...noteEntries];
              allEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
              return allEntries;
            },
            query: `{
              allMarkdownRemark(sort: {frontmatter: {date: DESC}}) {
                totalCount
                edges {
                  node {
                    fields {
                      slug
                    }
                    id
                    frontmatter {
                      title
                      date(formatString: "YYYY-MM-DD")
                    }
                    excerpt(pruneLength: 400)
                  }
                }
              }
  						allNoteBlogPostsJson {
                edges {
                  node {
                    title
                    slug
                    date
                  }
                }
              }
            }`,
            output: '/rss.xml',
            title: 'cprimozic.net Blog',
          },
        ],
      },
    },
  ],
};
