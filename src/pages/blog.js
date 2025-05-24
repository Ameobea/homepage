import React, { useMemo } from 'react';
import * as R from 'ramda';
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
    paddingLeft: 20,
    paddingRight: 20,
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
    color: '#676e6e',
  },
};

const query = graphql`
  {
    allMarkdownRemark(sort: { frontmatter: { date: DESC } }) {
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
  }
`;

const formatDateYMD = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const PostLink = ({ title, date, slug }) => (
  <li style={styles.postLink}>
    {slug.includes('notes/posts/') ? (
      <a href={slug}>{title}</a>
    ) : (
      <Link to={slug}>{title}</Link>
    )}{' '}
    - <span style={styles.postDate}>{formatDateYMD(date)}</span>
  </li>
);

const BlogIndex = ({ allMarkdownRemark, allNoteBlogPostsJson }) => {
  const blogPosts = useMemo(
    () =>
      allMarkdownRemark.edges.map(({ node }) => ({
        title: node.frontmatter.title,
        date: node.frontmatter.date,
        slug: `/blog${node.fields.slug}`,
      })),
    [allMarkdownRemark]
  );
  const notePosts = useMemo(
    () =>
      allNoteBlogPostsJson.edges.map(({ node }) => ({
        title: node.title,
        date: node.date,
        slug: `/notes/posts/${node.slug}/`,
      })),
    [allNoteBlogPostsJson]
  );
  const allPosts = useMemo(
    () =>
      R.sortBy(
        ({ date }) => -new Date(date).getTime(),
        [...blogPosts, ...notePosts]
      ),
    [blogPosts, notePosts]
  );

  return (
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
        {allPosts.map(({ title, date, slug }) => (
          <PostLink title={title} date={date} slug={slug} key={slug} />
        ))}
      </ul>
    </Layout>
  );
};

const Blog = () => <StaticQuery query={query} render={BlogIndex} />;

export default Blog;
