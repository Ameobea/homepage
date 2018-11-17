import React from 'react';
import { Link, StaticQuery, graphql } from 'gatsby';
import * as R from 'ramda';

import Layout from '../components/layout';

const styles = {
  root: {
    display: 'block',
    width: '100%',
    columnCount: 2,
    columnWidth: 400,
    columnGap: 0,
  },
  projectWrapper: {
    breakInside: 'avoid',
    display: 'flex',
    flexDirection: 'column',
    paddingTop: 12,
    paddingLeft: 5,
    paddingRight: 5,
  },
  projectOverview: {
    display: 'flex',
    flexDirection: 'column',
  },
  projectHeader: {
    paddingBottom: 6,
  },
  projectTitle: {
    marginBottom: 4,
  },
  projectOverviewContent: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 250,
  },
  projectOverviewImage: {
    display: 'flex',
    minWidth: 250,
  },
  projectInfo: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  projectInfoLink: {
    fontFamily: 'monospace',
    color: '#999',
    display: 'flex',
    paddingRight: 10,
    minWidth: 100,
  },
  projectDescription: { paddingTop: 10 },
};

const ProjectInfoLink = ({ text, url }) => {
  if (!url) {
    return null;
  }

  return (
    <i style={styles.projectInfoLink}>
      <a href={url}>{text}</a>
    </i>
  );
};

const ProjectOverview = ({
  name,
  description,
  projectUrl,
  srcUrl,
  technologies,
  pageUrl,
  startDate,
  endDate,
  imageSrc,
}) => (
  <div style={styles.projectWrapper}>
    <div style={styles.projectHeader}>
      <h2 style={styles.projectTitle}>
        <Link to={`/projects/${pageUrl}`}>{name}</Link>
      </h2>
      <i style={styles.projectInfoLink}>{`${startDate} - ${endDate}`}</i>
      <div style={styles.projectInfo}>
        <ProjectInfoLink text="Project URL" url={projectUrl} />
        <ProjectInfoLink text="Source Code" url={srcUrl} />
      </div>
    </div>

    <div style={styles.projectOverview}>
      <Link to={`/projects/${pageUrl}`} style={styles.projectOverviewImage}>
        <img src={imageSrc} />
      </Link>
      <div style={styles.projectOverviewContent}>
        <p style={styles.projectDescription}>{description}</p>
      </div>
    </div>
  </div>
);

const getProjectFilesQuery = graphql`
  {
    allProjectManifestJson {
      edges {
        node {
          name
          description
          projectUrl
          srcUrl
          technologies
          pageUrl
          image
          startDate
          endDate
        }
      }
    }
    allImageSharp {
      edges {
        node {
          fluid {
            originalName
            src
          }
        }
      }
    }
  }
`;

const IndexInner = data => {
  const projects = data.allProjectManifestJson.edges.map(R.prop('node'));
  const imageList = data.allImageSharp.edges.map(R.path(['node', 'fluid']));
  const imageMap = imageList.reduce(
    (acc, { originalName, src }) => ({ ...acc, [originalName]: src }),
    {}
  );
  return (
    <Layout>
      <div style={styles.root}>
        {projects.map((props, i) => (
          <ProjectOverview
            key={i}
            {...props}
            even={i % 2 == 0}
            imageSrc={imageMap[props.image]}
          />
        ))}
      </div>
    </Layout>
  );
};

const PortfolioIndex = () => (
  <StaticQuery query={getProjectFilesQuery} render={IndexInner} />
);

export default PortfolioIndex;
