import React, { useState } from 'react';

interface HideButtonProps {
  onHide: () => void;
}

const HideButton: React.FC<HideButtonProps> = ({ onHide }) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onHide}
    onKeyDown={onHide}
    style={{ cursor: 'pointer', color: '#bbb', marginBottom: 2, fontSize: 15 }}
  >
    [hide]
  </div>
);

interface ExpandVizButtonProps {
  onExpand: () => void;
}

const ExpandVizButton: React.FC<ExpandVizButtonProps> = ({ onExpand }) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onExpand}
    onKeyDown={onExpand}
    style={{
      cursor: 'pointer',
      paddingTop: 4,
      paddingBottom: 4,
      color: '#ddd',
      marginTop: 8,
      marginBottom: 8,
      marginLeft: 20,
      marginRight: 20,
      fontSize: 20,
      textAlign: 'center',
      backgroundColor: 'rgb(80, 20, 220, 0.17)',
      borderBottom: '1px solid #777',
    }}
  >
    Click to open demo
  </div>
);

interface CollapsibleNNVizProps {
  preset?: string;
  defaultexpanded?: 'true' | 'false';
}

const CollapsibleNNViz: React.FC<CollapsibleNNVizProps> = ({
  preset,
  defaultexpanded = 'false',
}) => {
  const [expanded, setExpanded] = useState(defaultexpanded === 'true');

  if (expanded) {
    return (
      <>
        <HideButton onHide={() => setExpanded(false)} />
        <iframe
          src={`http://localhost:7007/?constrainedLayout=1${
            preset ? `&preset=${preset}` : ''
          }`}
          loading="lazy"
          style={{
            position: 'relative',
            height: 'calc(min(800px, 78.5vh))',
            width: '100%',
            outline: 'none',
            border: '1px solid #888',
            paddingRight: 2,
            boxSizing: 'border-box',
            paddingTop: 1,
          }}
        />
      </>
    );
  }

  return <ExpandVizButton onExpand={() => setExpanded(true)} />;
};

export default CollapsibleNNViz;
