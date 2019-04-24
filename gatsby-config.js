const process = require('process');

// Load environment variables from `.env`
require('dotenv').config();

module.exports = {
  siteMetadata: {
    title: "Casey Primozic's Homepage",
    description: 'Personal website of Casey Primozic / Ameo',
    siteUrl: 'https://cprimozic.net',
  },
  plugins: [
    'gatsby-plugin-typescript',
    'gatsby-plugin-react-helmet',
    'gatsby-plugin-sass',
    'gatsby-transformer-json',
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
        name: 'workExperience',
        path: `${__dirname}/src/workExperience.json`,
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'licenses',
        path: `${__dirname}/src/licenses.csv`,
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'blog',
        path: `${__dirname}/src/blog`,
      },
    },
    'gatsby-transformer-sharp',
    'gatsby-plugin-sharp',
    {
      resolve: 'gatsby-transformer-remark',
      options: {
        tableOfContents: {
          heading: null,
          maxDepth: 6,
        },
        plugins: [
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
          {
            resolve: 'gatsby-remark-images',
            options: {
              maxWidth: 840,
              withWebp: true,
              backgroundColor: 'rgba(36, 36, 36, 0.92)',
            },
          },
        ],
      },
    },
    {
      resolve: 'gatsby-plugin-manifest',
      options: {
        name: 'gatsby-starter-default',
        short_name: 'starter',
        start_url: '/',
        background_color: '#663399',
        theme_color: '#663399',
        display: 'minimal-ui',
        icon: 'src/images/favicon.png', // This path is relative to the root of the site.
      },
    },
    'gatsby-transformer-csv',
    {
      resolve: 'gatsby-plugin-google-analytics',
      options: {
        trackingId: 'UA-131544751-1',
        // Puts tracking script in the head instead of the body
        head: false,
        // Setting this parameter is optional
        anonymize: false,
        // Setting this parameter is also optional
        respectDNT: true,
        // Any additional create only fields (optional)
        sampleRate: 100,
        siteSpeedSampleRate: 0,
        cookieDomain: 'cprimozic.net',
      },
    },
    {
      resolve: 'gatsby-source-spotify',
      options: {
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        refreshToken: process.env.SPOTIFY_REFRESH_TOKEN,
        fetchPlaylists: true, // optional. Set to false to disable fetching of your playlists
        timeRanges: ['short_term', 'medium_term', 'long_term'], // optional. Set time ranges to be fetched
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
            serialize: ({ query: { site, allMarkdownRemark } }) =>
              allMarkdownRemark.edges.map(
                ({
                  node: {
                    frontmatter: { date, title },
                    excerpt,
                    fields: { slug },
                    html,
                  },
                }) => {
                  const postUrl = `${site.siteMetadata.siteUrl}/blog${slug}`;
                  return {
                    description: excerpt,
                    date,
                    title,
                    url: postUrl,
                    guid: postUrl,
                  };
                }
              ),
            query: `
              {
                allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
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
                      excerpt
                    }
                  }
                }
              }
            `,
            output: '/rss.xml',
            title: 'Gatsby RSS Feed',
          },
        ],
      },
    },
  ],
};
