import React, { Suspense, useEffect, useState } from 'react';
import Prism from 'prismjs';
const ControlPanel = React.lazy(() => import('react-control-panel'));

import Layout from '../../components/layout';
import { ANewTab } from '../../components/util';
import './react-control-panel.css';

const settings = [
  { type: 'range', label: 'my range', min: 0, max: 100, initial: 20 },
  {
    type: 'range',
    label: 'log range',
    min: 0.1,
    max: 100,
    initial: 20,
    scale: 'log',
  },
  { type: 'text', label: 'my text', initial: 'my cool setting' },
  { type: 'checkbox', label: 'my checkbox', initial: true },
  { type: 'color', label: 'my color', format: 'rgb', initial: 'rgb(10,200,0)' },
  {
    type: 'button',
    label: 'gimme an alert',
    action: () => alert('hello!'),
  },
  {
    type: 'select',
    label: 'select one',
    options: ['option 1', 'option 2'],
    initial: 'option 1',
  },
  {
    type: 'multibox',
    label: 'check many',
    count: 3,
    initial: [true, false, true],
  },
];

const ReactControlPanel = () => {
  const [panel, setPanel] = useState(null);
  useEffect(() => Prism.highlightAll());
  useEffect(() => {
    if (window && !panel) {
      const newPanel = (
        <Suspense fallback={<div />}>
          <div
            className="control-panel"
            style={{ textAlign: 'center', paddingTop: 22 }}
          >
            <ControlPanel
              width={272}
              title="Example Panel"
              settings={settings}
            />
          </div>
        </Suspense>
      );

      setPanel(newPanel);
    }
  });

  return (
    <Layout>
      <center>
        <h2>react-control-panel</h2>
      </center>
      <p>
        <code>react-control-panel</code> is a direct port of the{' '}
        <ANewTab
          to="https://github.com/freeman-lab/control-panel.git"
          text={<code>control-panel</code>}
        />{' '}
        library. The goal was to maintain 100% the exact appearance and
        functionality of the original while making it usable via a React-based
        interface. I also added some additional tools like making it draggable,
        allowing its state to be externally managed through something like
        Redux, and adding a Proxy-based interface thorugh which the UI state can
        be manipulated externally.
      </p>
      <p>
        The bundle size for the demo application mirroring that of the original
        is actually smaller, probably due to using WebPack for bundling rather
        than browserify. Since this website is built using React/Gatsby.JS,
        I&apos;ve included a demo panel below using the actual library.
      </p>

      {panel}

      <p>It was created with the following:</p>
      <pre className="language-javascript">
        <code>
          {`const settings = [
  { type: 'range', label: 'my range', min: 0, max: 100, initial: 20 },
  {
    type: 'range',
    label: 'log range',
    min: 0.1,
    max: 100,
    initial: 20,
    scale: 'log',
  },
  { type: 'text', label: 'my text', initial: 'my cool setting' },
  { type: 'checkbox', label: 'my checkbox', initial: true },
  { type: 'color', label: 'my color', format: 'rgb', initial: 'rgb(10,200,0)' },
  {
    type: 'button',
    label: 'gimme an alert',
    action: () => alert('hello!'),
  },
  {
    type: 'select',
    label: 'select one',
    options: ['option 1', 'option 2'],
    initial: 'option 1',
  },
  {
    type: 'multibox',
    label: 'check many',
    count: 3,
    initial: [true, false, true],
  },
];\n\n`}
          {
            '<ControlPanel width={272} title="Example Panel" settings={settings} />'
          }
        </code>
      </pre>

      <p>
        But it can alternatively be used with components as children like this:
      </p>
      <pre className="language-javascript">
        <code>
          {`import ControlPanel, {
  Button,
  Checkbox,
  Multibox,
  Select,
  Text,
  Interval,
} from 'react-control-panel';

const initialState = {
  interval: [25, 50],
  text: 'my setting',
  checkbox: true,
  selection: 'option 1',
  'multiple checkboxes': [true, true],
};

const DemoPanel = () => (
  <ControlPanel
    theme="dark"
    title="Demo Panel"
    initialState={initialState}
    width={500}
    style={{ marginRight: 30 }}
  >
    <Interval label="interval" min={0} max={100} />
    <Text label="text" />
    <Checkbox label="checkbox" />
    <Button label="gimme an alert" action={() => alert('clicked')} />
    <Select label="selection" options={{ 'option 1': 1, 'option 2': 2 }} />
    <Multibox
      label="multiple checkboxes"
      colors={['rgb(100,120,230)', 'rgb(210,100,190)']}
      names={['box1', 'box2']}
    />
  </ControlPanel>
);`}
        </code>
      </pre>
    </Layout>
  );
};

export default ReactControlPanel;
