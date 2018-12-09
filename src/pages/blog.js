import React from 'react';
import { graphql, StaticQuery, Link } from 'gatsby';

import Layout from '../components/layout';

const styles = {
  postLinks: {
    display: 'flex',
    flexDirection: 'column',
    paddingLeft: 25,
    paddingRight: 25,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#161616',
  },
  postLink: {
    paddingTop: 8,
    paddingBottom: 9,
    fontSize: 21,
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
    <Link to={`blog${slug}`}>{title}</Link> -{' '}
    <span style={styles.postDate}>{date}</span>
  </li>
);

const BlogIndex = ({ allMarkdownRemark }) => (
  <Layout>
    <center>
      <h1>Technical Blog</h1>
    </center>

    <ul style={styles.postLinks}>
      {allMarkdownRemark.edges.map(({ node }, i) => (
        <PostLink {...node.frontmatter} slug={node.fields.slug} key={i} />
      ))}
    </ul>
  </Layout>
);

export default () => <StaticQuery query={query} render={BlogIndex} />;
