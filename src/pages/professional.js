import React from 'react';
import { StaticQuery, graphql } from 'gatsby';

import Layout from '../components/layout';
import { ANewTab } from '../components/util';

const styles = {
  workExperience: {},
  company: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  date: {
    color: '#525959',
  },
  professionalSkills: {
    display: 'flex',
  },
  professionalSkillsColumn: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    paddingLeft: 25,
    paddingRight: 25,
  },
  professionalSkillsColumnTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    paddingBottom: 5,
  },
};

const WorkExperience = ({
  company,
  website,
  location,
  title,
  startDate,
  endDate,
  descriptions,
}) => (
  <div style={styles.workExperience}>
    <span style={styles.company}>
      {website ? <ANewTab to={website} text={company} /> : company}
    </span>
    , {location} - <i>{title}</i> - <span style={styles.date}>{startDate}</span>{' '}
    - <span style={styles.date}>{endDate}</span>
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
  <div style={styles.professionalSkills}>
    <ProfessionalSkillsColumn
      title="Programming Languages"
      items={[
        'JavaScript/Node.JS/React/Redux/ES6 + Babel',
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
        'Relational Databases (MySQL/PostgreSQL/Sqlite/SQL',
        'Document and Key/Value Databases (MongoDB, Redis, CoucbDB, DynamoDB)',
        'WebAssembly + Asm.JS',
        'Docker/Docker Compose/Docker Swarm/Kubernetes',
        'NumPy/Pandas/Jupyter Notebook/Anaconda',
        'Linux Server Administration/System Administration',
        'Amazon Web Services + Google Cloud',
      ]}
    />
  </div>
);

const ProfessionalExperience = ({ allWorkExperienceJson }) => (
  <Layout>
    <center>
      <h2>Work Experience</h2>
    </center>
    {allWorkExperienceJson.edges.map(({ node }, i) => (
      <WorkExperience {...node} key={i} />
    ))}

    <center style={{ paddingTop: 20 }}>
      <h2>Professional Skills</h2>
    </center>
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
