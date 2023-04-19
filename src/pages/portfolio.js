import React, { useMemo, Fragment } from 'react';
import { Link, StaticQuery, graphql } from 'gatsby';
import { GatsbyImage } from 'gatsby-plugin-image';
import * as R from 'ramda';

import Layout from '../components/layout';
import './portfolio.css';

const ProjectInfoLink = ({ text, url, newTab = true }) => {
  if (!url) {
    return null;
  }

  return (
    <span className="portfolio-project-info-link">
      <a target={newTab ? '_blank' : undefined} href={url}>
        {text}
      </a>
    </span>
  );
};

const ProjectImage = ({ pageUrl, gatsbyImageData, imageAlt, even }) => {
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
    <Fragment>
      {gatsbyImageData ? (
        <Wrapper>
          <GatsbyImage
            formats={['auto', 'webp', 'avif']}
            image={gatsbyImageData}
            imgStyle={{
              objectPosition: 'center center',
              objectFit: 'contain',
              maxHeight: 400,
            }}
            alt={imageAlt}
          />
        </Wrapper>
      ) : null}
    </Fragment>
  );
};

const ProjectOverview = ({
  name,
  description,
  projectUrl,
  srcUrl,
  videoUrl,
  technologies,
  pageUrl,
  imageAlt,
  startDate,
  endDate,
  gatsbyImageData,
  even,
}) => (
  <div
    className={`portfolio-root ${
      even ? 'portfolio-root-even' : 'portfolio-root-odd'
    }`}
  >
    <div className="portfolio-project-overview-content">
      <div className="portfolio-project-header">
        <h2 className="portfolio-project-title">{name}</h2>
        <i className="portfolio-project-info-link">{`${startDate} - ${
          endDate || '(current)'
        }`}</i>
        <div className="portfolio-project-info">
          <ProjectInfoLink newTab={false} text="Details" url={pageUrl} />
          <ProjectInfoLink text="Website" url={projectUrl} />
          <ProjectInfoLink text="Source Code" url={srcUrl} />
          <ProjectInfoLink text="Video" url={videoUrl} />
        </div>
      </div>
      <p className="portfolio-project-description">{description}</p>
    </div>

    {gatsbyImageData ? (
      <ProjectImage
        pageUrl={pageUrl}
        gatsbyImageData={gatsbyImageData}
        imageAlt={imageAlt}
        even={even}
      />
    ) : null}
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
          videoUrl
          technologies
          pageUrl
          image
          imageAlt
          startDate
          endDate
        }
      }
    }
    allImageSharp(
      filter: { original: { src: { regex: "/^((?!spotify-).)*$/" } } }
    ) {
      edges {
        node {
          gatsbyImageData(
            quality: 85
            layout: FULL_WIDTH
            formats: [AVIF, AUTO, WEBP]
          )
          original {
            src
          }
        }
      }
    }
  }
`;

const IndexInner = ({ allProjectManifestJson, allImageSharp }) => {
  const projects = allProjectManifestJson.edges.map(R.prop('node'));
  const imageList = allImageSharp.edges.map(R.prop('node'));
  const imageMap = imageList.reduce(
    (acc, { original: { src }, gatsbyImageData }) => {
      const [_prefix, filename] = src.split('/static/');
      const nameParts = R.init(filename.split('-'));
      const name = nameParts.join('-');

      return { ...acc, [name]: gatsbyImageData };
    },
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

      {projects.map((props, i) => {
        const imageNameWithoutExtension = props.image?.split('.')[0];

        return (
          <ProjectOverview
            key={i}
            even={i % 2 == 0}
            {...props}
            gatsbyImageData={
              imageNameWithoutExtension
                ? imageMap[imageNameWithoutExtension]
                : undefined
            }
          />
        );
      })}
    </Layout>
  );
};

const PortfolioIndex = () => (
  <StaticQuery query={getProjectFilesQuery} render={IndexInner} />
);

export default PortfolioIndex;
