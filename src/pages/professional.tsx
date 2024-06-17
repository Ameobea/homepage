import React from 'react';
import { StaticQuery, graphql } from 'gatsby';

import Layout from '../components/layout';
import { ANewTab } from '../components/util';

const styles: { [key: string]: React.CSSProperties } = {
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

const InfoSection: React.FC<{
  title: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <>
    <div style={{ textAlign: 'center' }}>
      <h2>{title}</h2>
    </div>

    <div style={styles.infoSection}>{children}</div>
  </>
);

const Education: React.FC = () => (
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

const WorkExperienceItem: React.FC<{
  company: string;
  website: string;
  location: string;
  title: string;
  startDate: string;
  endDate: string;
  descriptions: string[];
}> = ({
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

const ProfessionalSkillsColumn: React.FC<{
  title: string;
  items: (string | { value: string; children: string[] })[];
}> = ({ title, items }) => (
  <div style={styles.professionalSkillsColumn}>
    <div style={styles.professionalSkillsColumnTitle}>{title}</div>
    <ul>
      {items.map((item, i) =>
        typeof item === 'string' ? (
          <li key={i}>{item}</li>
        ) : (
          <>
            <li key={i}>
              {item.value}
              <ul>
                <li>
                  {item.children.map((child) => (
                    <li key={i}>{child}</li>
                  ))}
                </li>
              </ul>
            </li>
          </>
        )
      )}
    </ul>
  </div>
);

const ProfessionalSkills: React.FC = () => (
  <InfoSection title="Professional Skills">
    <div style={styles.professionalSkills}>
      <ProfessionalSkillsColumn
        title="Programming Languages"
        items={[
          'Rust',
          {
            value: 'JavaScript Ecosystem',
            children: [
              'Node.JS',
              'Modern lanauge features inc. ES6, Babel, etc.',
              'Helper libs inc. Lodash, Ramda, funfix',
            ],
          },
          {
            value: 'TypeScript',
            children: [
              'Integration into React + Redux apps',
              'Typesafe APIs',
              'Advanced patterns inc. conditional types, mapped types, etc.',
            ],
          },
          'React/Redux/Redux Thunk/Redux Saga/',
          'HTML/CSS/SCSS',
          {
            value: 'Python',
            children: ['NumPY', 'Pandas', 'Python Notebooks', 'TensorFlow'],
          },
          'C/C++',
          'Ruby/Rails',
        ]}
      />
      <ProfessionalSkillsColumn
        title="Services and Utilities"
        items={[
          {
            value: 'Relational Databases',
            children: ['SQL', 'MySQL', 'PostgreSQL', 'SQLite'],
          },
          {
            value: 'Document and Key/Value Database',
            children: [
              'ElasticSearch',
              'MongoDB',
              'Redis',
              'CoucbDB',
              'DynamoDB',
            ],
          },
          'WebAssembly + Asm.JS',
          {
            value: 'Docker + Containerization',
            children: [
              'Docker Compose',
              'Kubernetes',
              'Containerized CI/CD',
              'Google Cloud Run + other Serverless',
            ],
          },
          'Linux Server Administration/System Administration',
          'Amazon Web Services + Google Cloud',
        ]}
      />
    </div>
  </InfoSection>
);

const WorkExperience: React.FC<{ allWorkExperienceJson: { edges: any[] } }> = ({
  allWorkExperienceJson,
}) => (
  <InfoSection title="Work Experience">
    {allWorkExperienceJson.edges.map(({ node }, i) => (
      <WorkExperienceItem {...node} key={i} />
    ))}
  </InfoSection>
);

const ProfessionalExperience: React.FC<{
  allWorkExperienceJson: { edges: any[] };
}> = ({ allWorkExperienceJson }) => (
  <Layout
    title="Professional Experience"
    description="Work experience and professional skills"
  >
    <Education />
    <ProfessionalSkills />
    <WorkExperience allWorkExperienceJson={allWorkExperienceJson} />
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

const Professional: React.FC = () => (
  <StaticQuery query={query} render={ProfessionalExperience} />
);

export default Professional;
