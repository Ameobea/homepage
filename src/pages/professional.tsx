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

interface WorkExperienceItemProps {
  company: string;
  website: string;
  location: string;
  title: string;
  startDate: string;
  endDate: string;
  descriptions: string[];
}

const WorkExperienceItem: React.FC<WorkExperienceItemProps> = ({
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
    {descriptions ? (
      <ul>
        {descriptions.map((description, i) => (
          <li key={i}>{description}</li>
        ))}
      </ul>
    ) : null}
  </div>
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
    <center>
      <a
        style={{ fontSize: 22 }}
        href="https://ameo.dev/resume-2024.pdf"
        target="_blank"
      >
        Download Resume
      </a>
    </center>
    <br />
    <br />
    <Education />
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
