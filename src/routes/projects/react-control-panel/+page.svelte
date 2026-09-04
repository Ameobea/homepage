<script lang="ts">
  import PageLayout from '$lib/components/PageLayout.svelte';

  const settingsSample = `const settings = [
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

<ControlPanel width={272} title="Example Panel" settings={settings} />`;

  const childrenSample = `import ControlPanel, {
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
);`;
</script>

<PageLayout
  title="react-control-panel"
  description="An overview of the development of the react-control-panel library"
>
  <center>
    <h2>react-control-panel</h2>
  </center>

  <p>
    <code>react-control-panel</code> is a direct port of the
    <a
      href="https://github.com/freeman-lab/control-panel.git"
      target="_blank"
      rel="noopener noreferrer"><code>control-panel</code></a
    >
    library. The goal was to maintain 100% the exact appearance and functionality of the original
    while making it usable via a React-based interface. I also added some additional tools like
    making it draggable, allowing its state to be externally managed through something like Redux,
    and adding a Proxy-based interface thorugh which the UI state can be manipulated externally.
  </p>
  <p>
    The bundle size for the demo application mirroring that of the original is actually smaller,
    probably due to using WebPack for bundling rather than browserify. Since this website is built
    using React/Gatsby.JS, I've included a demo panel below using the actual library.
  </p>

  <p>It was created with the following:</p>
  <pre><code>{settingsSample}</code></pre>

  <p>But it can alternatively be used with components as children like this:</p>
  <pre><code>{childrenSample}</code></pre>
</PageLayout>
