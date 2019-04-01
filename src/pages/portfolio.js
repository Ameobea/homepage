import React, { useMemo } from 'react';
import { Link, StaticQuery, graphql } from 'gatsby';
import Img from 'gatsby-image';
import * as R from 'ramda';

import Layout from '../components/layout';
import './portfolio.css';

const ProjectInfoLink = ({ text, url }) => {
  if (!url) {
    return null;
  }

  return (
    <i className="portfolio-project-info-link">
      <a href={url}>{text}</a>
    </i>
  );
};

const ProjectImage = ({ pageUrl, fluidImage, imageAlt, even }) => {
  const wrapperClassname = `portfolio-image-wrapper ${
    even ? 'portfolio-image-wrapper-left' : 'portfolio-image-wrapper-right'
  }`;
  const Wrapper = useMemo(
    () =>
      pageUrl
        ? ({ children }) => (
            <Link className={wrapperClassname} to={pageUrl}>
              {children}
            </Link>
          )
        : ({ children }) => <div className={wrapperClassname}>{children}</div>,
    [wrapperClassname, pageUrl]
  );

  return (
    <React.Fragment>
      {fluidImage ? (
        <Wrapper>
          <Img
            fluid={fluidImage}
            imgStyle={{
              objectPosition: 'center center',
              objectFit: 'contain',
              maxHeight: 400,
            }}
            alt={imageAlt}
          />
        </Wrapper>
      ) : null}
    </React.Fragment>
  );
};

const ProjectOverview = ({
  name,
  description,
  projectUrl,
  srcUrl,
  technologies,
  pageUrl,
  imageAlt,
  startDate,
  endDate,
  fluidImage,
  even,
}) => (
  <div
    className={`portfolio-root ${
      even ? 'portfolio-root-even' : 'portfolio-root-odd'
    }`}
  >
    <div className="portfolio-project-overview-content">
      <div className="portfolio-project-header">
        <h2 className="portfolio-project-title">
          {pageUrl ? <Link to={`/projects/${pageUrl}`}>{name}</Link> : name}
        </h2>
        <i className="portfolio-project-info-link">{`${startDate} - ${endDate ||
          '(current)'}`}</i>
        <div className="portfolio-project-info">
          <ProjectInfoLink text="Website" url={projectUrl} />
          <ProjectInfoLink text="Source Code" url={srcUrl} />
        </div>
      </div>
      <p className="portfolio-project-description">{description}</p>
    </div>

    <ProjectImage
      pageUrl={pageUrl}
      fluidImage={fluidImage}
      imageAlt={imageAlt}
      even={even}
    />
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
          imageAlt
          startDate
          endDate
        }
      }
    }
    allImageSharp {
      edges {
        node {
          fluid(maxWidth: 1200, quality: 85) {
            originalName
            ...GatsbyImageSharpFluid_withWebp
          }
        }
      }
    }
  }
`;

const IndexInner = ({ allProjectManifestJson, allImageSharp }) => {
  const projects = allProjectManifestJson.edges.map(R.prop('node'));
  const imageList = allImageSharp.edges.map(R.path(['node', 'fluid']));
  const imageMap = imageList.reduce(
    (acc, fluid) => ({ ...acc, [fluid.originalName]: fluid }),
    {}
  );

  return (
    <Layout
      title="Portfolio"
      description="Software development project portfolio of Casey Primozic / Ameo"
    >
      <center>
        <h1>Software Project Portfolio</h1>
      </center>
      <p>
        Writing software is my passion. Building web applications, websites,
        tools, utilities, or artsy code sketches is what I do in my free time
        and want to do for my career as well. Here is a collection of the
        notable software projects that I&apos;ve undertaken and published. The
        list isn&apos;t comprehensive and is always growing.
      </p>
      <hr />

      {projects.map((props, i) => (
        <ProjectOverview
          key={i}
          even={i % 2 == 0}
          {...props}
          fluidImage={imageMap[props.image]}
        />
      ))}
    </Layout>
  );
};

const PortfolioIndex = () => (
  <StaticQuery query={getProjectFilesQuery} render={IndexInner} />
);

export default PortfolioIndex;
