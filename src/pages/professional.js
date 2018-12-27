import React, { Fragment } from 'react';
import { StaticQuery, graphql } from 'gatsby';

import Layout from '../components/layout';
import { ANewTab } from '../components/util';

const styles = {
  infoSection: {
    marginBottom: 50,
  },
  company: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  date: {
    color: '#525959',
  },
  professionalSkills: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  professionalSkillsColumn: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    paddingLeft: 25,
    paddingRight: 25,
    paddingTop: 22,
    flexBasis: 350,
  },
  professionalSkillsColumnTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    paddingBottom: 5,
    fontSize: 23,
  },
};

const InfoSection = ({ title, children }) => (
  <Fragment>
    <center>
      <h2>{title}</h2>
    </center>

    <div style={styles.infoSection}>{children}</div>
  </Fragment>
);

const Education = () => (
  <InfoSection title="Education">
    <p>
      Graduated from{' '}
      <ANewTab to="https://valpo.edu/" text="Valparaiso University" />{' '}
      undergraduate class of 2018 with a Bachelors of Science degree.
      <ul>
        <li>Major in Computer Science</li>
        <li>Minor in French</li>
      </ul>
    </p>
  </InfoSection>
);

const WorkExperienceItem = ({
  company,
  website,
  location,
  title,
  startDate,
  endDate,
  descriptions,
}) => (
  <div>
    <span style={styles.company}>
      {website ? <ANewTab to={website} text={company} /> : company}
    </span>
    , {location} - <i>{title}</i> -{' '}
    <span style={styles.date}>
      {startDate} - {endDate}
    </span>
    <ul>
      {descriptions.map((description, i) => (
        <li key={i}>{description}</li>
      ))}
    </ul>
  </div>
);

const ProfessionalSkillsColumn = ({ title, items }) => (
  <div style={styles.professionalSkillsColumn}>
    <div style={styles.professionalSkillsColumnTitle}>{title}</div>
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </div>
);

const ProfessionalSkills = () => (
  <InfoSection title="Professional Skills">
    <div style={styles.professionalSkills}>
      <ProfessionalSkillsColumn
        title="Programming Languages"
        items={[
          'JavaScript/Node.JS/ES6 + Babel',
          'React/Redux',
          'HTML/CSS',
          'TypeScript',
          'Rust',
          'Python',
          'C/C++',
          'Ruby/Rails',
        ]}
      />
      <ProfessionalSkillsColumn
        title="Services and Utilities"
        items={[
          'Relational Databases (SQL, MySQL, PostgreSQL, SQLite)',
          'Document and Key/Value Databases (MongoDB, Redis, CoucbDB, DynamoDB)',
          'WebAssembly + Asm.JS',
          'Docker/Docker Compose/Docker Swarm/Kubernetes',
          'NumPy/Pandas/Jupyter Notebook/Anaconda',
          'Linux Server Administration/System Administration',
          'Amazon Web Services + Google Cloud',
        ]}
      />
    </div>
  </InfoSection>
);

const WorkExperience = ({ allWorkExperienceJson }) => (
  <InfoSection title="Work Experience">
    {allWorkExperienceJson.edges.map(({ node }, i) => (
      <WorkExperienceItem {...node} key={i} />
    ))}
  </InfoSection>
);

const ProfessionalExperience = ({ allWorkExperienceJson }) => (
  <Layout>
    <Education />
    <WorkExperience allWorkExperienceJson={allWorkExperienceJson} />
    <ProfessionalSkills />
  </Layout>
);

const query = graphql`
  {
    allWorkExperienceJson {
      edges {
        node {
          company
          website
          location
          title
          startDate
          endDate
          descriptions
        }
      }
    }
  }
`;

export default () => (
  <StaticQuery query={query} render={ProfessionalExperience} />
);
