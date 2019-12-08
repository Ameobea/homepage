import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import ControlPanel from 'react-control-panel';

import waveforms, { waveformSampleCount, baseFrequency } from './waveforms';
import './WavetableDemo.scss';

const ctx = new AudioContext();
const globalGain = new GainNode(ctx);
globalGain.gain.value = 0.1;
globalGain.connect(ctx.destination);

const initWavetable = async () => {
  // Register our custom `AudioWorkletProcessor`, and create an `AudioWorkletNode` that serves as a
  // handle to an instance of one.
  await ctx.audioWorklet.addModule(
    'https://notes.ameo.design/WaveTableNodeProcessor.js'
  );
  const workletHandle = new AudioWorkletNode(ctx, 'wavetable-node-processor');

  // Using those waveforms we generated earlier, construct a flat array of waveform samples with
  // which to fill the wavetable
  const wavetableDef = [
    [waveforms[0], waveforms[1]],
    [waveforms[2], waveforms[3]],
  ];

  const dimensionCount = 2;
  const waveformsPerDimension = 2;
  const samplesPerDimension = waveformSampleCount * waveformsPerDimension;

  const tableSamples = new Float32Array(
    dimensionCount * waveformsPerDimension * waveformSampleCount
  );
  for (let dimensionIx = 0; dimensionIx < dimensionCount; dimensionIx++) {
    for (let waveformIx = 0; waveformIx < waveformsPerDimension; waveformIx++) {
      for (let sampleIx = 0; sampleIx < waveformSampleCount; sampleIx++) {
        tableSamples[
          samplesPerDimension * dimensionIx +
            waveformSampleCount * waveformIx +
            sampleIx
        ] = wavetableDef[dimensionIx][waveformIx][sampleIx];
      }
    }
  }

  // Fetch the Wasm module as raw bytes
  const res = await fetch('https://notes.ameo.design/wavetable.wasm');
  const moduleBytes = await res.arrayBuffer();

  // Send the Wasm module, waveform data, and wavetable settings over to the processor thread
  workletHandle.port.postMessage({
    arrayBuffer: moduleBytes,
    waveformsPerDimension,
    dimensionCount,
    waveformLength: waveformSampleCount,
    baseFrequency,
    tableSamples,
  });

  return workletHandle;
};

const handleSettingsChange = (
  wavetableHandle: AudioWorkletNode,
  key: string,
  val: number
) => {
  if (key === 'volume') {
    globalGain.gain.value = val / 100;
    return;
  }
  // TODO
};

const getSettings = (start: () => void) => [
  {
    type: 'range',
    label: 'volume',
    min: 0,
    max: 100,
    initial: 10,
    steps: 100,
  },
  {
    type: 'range',
    label: 'dim 0 mix',
    min: 0,
    max: 1,
    initial: 0,
    steps: 100,
  },
  {
    type: 'range',
    label: 'dim 1 mix',
    min: 0,
    max: 1,
    initial: 0,
    steps: 100,
  },
  {
    type: 'range',
    label: 'dim 0x1 mix',
    min: 0,
    max: 1,
    initial: 0,
    steps: 100,
  },
  {
    type: 'checkbox',
    label: 'connect oscillator',
    initial: false,
  },
  {
    type: 'range',
    label: 'oscillator frequency',
    min: 0.01,
    max: 10000,
    initial: 2,
    scale: 'log',
    steps: 1000,
  },
  {
    type: 'button',
    label: 'start',
    action: start,
  },
];

const WavetableDemo: React.FC<{}> = () => {
  const [
    wavetableHandle,
    setWavetableHandle,
  ] = useState<AudioWorkletNode | null>(null);
  const vizCanvas = useRef<HTMLCanvasElement | null>(null);
  const isStarted = useRef(false);

  useEffect(() => {
    if (typeof AudioWorkletNode !== 'function') {
      return;
    }

    initWavetable().then(setWavetableHandle);
  }, []);

  const start = useCallback(() => {
    if (isStarted.current || !wavetableHandle) {
      return;
    }

    ctx.resume();
    wavetableHandle.connect(globalGain);
    isStarted.current = true;
  }, [wavetableHandle]);

  const settings = useMemo(() => getSettings(start), [start]);

  if (typeof AudioWorkletNode !== 'function') {
    return (
      <div className="wavetable-demo">
        <span>
          Unfortunately, your browser doesn&apos;t support the{' '}
          <code>AudioWorkletProcessor</code> API required by the wavetable. Try
          using Chrome, and maybe leave a note for your local browser developers
          letting them know you&apos;d really love to have access to this
          awesome API!
        </span>
      </div>
    );
  }

  if (!wavetableHandle) {
    return <div className="wavetable-demo">Loading...</div>;
  }

  return (
    <div className="wavetable-demo">
      <ControlPanel
        style={{ width: 400, margin: 8 }}
        title="wavetable controls"
        onChange={(key, val) => handleSettingsChange(wavetableHandle, key, val)}
        settings={settings}
      />

      <canvas className="wavetable-viz-canvas" ref={vizCanvas} />
    </div>
  );
};

export default WavetableDemo;
