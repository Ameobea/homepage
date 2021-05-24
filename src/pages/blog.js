import React from 'react';
import { graphql, StaticQuery, Link } from 'gatsby';

import Layout from '../components/layout';
import RssIcon from '../images/rss.svg';

const styles = {
  header: {
    display: 'flex',
    alignItems: 'last baseline',
    paddingBottom: 0,
    marginBottom: 0,
  },
  postLinks: {
    display: 'flex',
    flexDirection: 'column',
    paddingLeft: 25,
    paddingRight: 25,
    paddingTop: 10,
    paddingBottom: 10,
  },
  postLink: {
    paddingTop: 3,
    paddingBottom: 6,
    fontSize: 17,
    listStyleType: 'square',
  },
  postDate: {
    color: '#525959',
  },
};

const query = graphql`
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
`;

const PostLink = ({ title, date, slug }) => (
  <li style={styles.postLink}>
    <Link to={`/blog${slug}`.replace('/blog/blog/', '/blog/')}>{title}</Link> -{' '}
    <span style={styles.postDate}>{date}</span>
  </li>
);

const BlogIndex = ({ allMarkdownRemark }) => (
  <Layout
    title="Blog"
    description="The personal technical blog of Casey Primozic"
    style={{ maxWidth: 860 }}
  >
    <center>
      <h1 style={styles.header}>
        <span style={{ paddingRight: 10, fontSize: 28, marginBottom: 0 }}>
          Casey Primozic&apos;s Blog
        </span>
        <a href="/rss.xml" style={{ display: 'flex' }}>
          <img
            src={RssIcon}
            style={{ height: 24, width: 24, marginBottom: 5, marginTop: -13 }}
          />
        </a>
      </h1>
    </center>

    <ul style={styles.postLinks}>
      {allMarkdownRemark.edges.map(({ node }, i) => (
        <PostLink {...node.frontmatter} slug={node.fields.slug} key={i} />
      ))}
    </ul>
  </Layout>
);

const Blog = () => <StaticQuery query={query} render={BlogIndex} />;

export default Blog;
