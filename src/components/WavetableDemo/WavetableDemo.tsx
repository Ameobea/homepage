import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import ControlPanel from 'react-control-panel';

import waveforms, { waveformSampleCount, baseFrequency } from './waveforms';
import WavyJones from './WavyJones';
import './WavetableDemo.scss';

const ctx = new AudioContext();
const globalGain = new GainNode(ctx);
globalGain.gain.value = 5 / 150;
globalGain.connect(ctx.destination);

const oscillator = new OscillatorNode(ctx);
oscillator.frequency.value = 2;
oscillator.start();

// Map the oscillator's output range from [-1, 1] to [0, 1]
const oscillatorCSN = new ConstantSourceNode(ctx);
oscillatorCSN.offset.value = 1; // Add one to the output signals, making the range [0, 2]
const oscillatorGain = new GainNode(ctx);
oscillatorGain.gain.value = 0.5; // Divide the result by 2, making the range [0, 1]

oscillator.connect(oscillatorCSN.offset);
oscillatorCSN.connect(oscillatorGain);
oscillatorCSN.start();
// `gainNode` now outputs a signal in the proper range to modulate our mix param

const initWavetable = async () => {
  // Register our custom `AudioWorkletProcessor`, and create an `AudioWorkletNode` that serves as a
  // handle to an instance of one.
  await ctx.audioWorklet.addModule(
    'https://notes.ameo.design/WaveTableNodeProcessor.js'
  );
  const workletHandle = new AudioWorkletNode(ctx, 'wavetable-node-processor');
  workletHandle.parameters.get('frequency')!.value = 516.41;

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
  val: any,
  state: { [key: string]: any }
) => {
  switch (key) {
    case 'volume': {
      globalGain.gain.value = val / 150;
      return;
    }
    case 'frequency': {
      wavetableHandle.parameters.get('frequency').value = val;
      return;
    }
    case 'dim 0 mix': {
      wavetableHandle.parameters.get('dimension_0_mix').value = val;
      return;
    }
    case 'dim 1 mix': {
      wavetableHandle.parameters.get('dimension_1_mix').value = val;
      return;
    }
    case 'dim 0x1 mix': {
      if (!state['connect oscillator']) {
        wavetableHandle.parameters.get('dimension_0x1_mix').value = val;
      }
      return;
    }
    case 'connect oscillator': {
      const param = wavetableHandle.parameters.get('dimension_0x1_mix');

      if (val) {
        param.value = 0;
        oscillatorGain.connect(param);
      } else {
        oscillatorGain.disconnect(param);
        param.value = state['dim 0x1 mix'];
      }
      return;
    }
    case 'oscillator frequency': {
      oscillator.frequency.value = val;
      return;
    }
    case 'oscillator waveform': {
      oscillator.type = val;
      return;
    }
    default: {
      throw new Error(`Unhandled key: "${key}"`);
    }
  }
};

const getSettings = (toggleStarted: () => void) => [
  {
    type: 'range',
    label: 'volume',
    min: 0,
    max: 100,
    initial: 5,
    steps: 100,
  },
  {
    type: 'range',
    label: 'frequency',
    min: 10,
    max: 10000,
    initial: 516.41,
    scale: 'log',
    steps: 1000,
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
    type: 'select',
    label: 'oscillator waveform',
    options: ['sine', 'triangle', 'sawtooth', 'square'],
    initial: 'sine',
  },
  {
    type: 'button',
    label: 'start/stop',
    action: toggleStarted,
  },
];

const WavetableDemo: React.FC<{}> = () => {
  const [
    wavetableHandle,
    setWavetableHandle,
  ] = useState<AudioWorkletNode | null>(null);
  const wavyJonesInstance = useRef<AnalyserNode | null>(null);
  const isStarted = useRef(false);

  useEffect(() => {
    if (typeof AudioWorkletNode !== 'function') {
      return;
    }

    initWavetable().then(setWavetableHandle);
  }, []);

  const toggleStarted = useCallback(() => {
    if (!wavetableHandle) {
      return;
    }

    if (isStarted.current) {
      wavetableHandle.disconnect(wavyJonesInstance.current);
      isStarted.current = false;
      return;
    }

    ctx.resume();

    // Initialize WavyJones Instance
    if (!wavyJonesInstance.current) {
      wavyJonesInstance.current = WavyJones(ctx, 'wavyjones-viz', 80);
    }

    wavetableHandle.connect(wavyJonesInstance.current);
    wavyJonesInstance.current.connect(globalGain);
    isStarted.current = true;
  }, [wavetableHandle]);

  const settings = useMemo(() => getSettings(toggleStarted), [toggleStarted]);

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
        style={{
          minWidth: 300,
          maxWidth: 400,
          margin: 8,
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
        }}
        title="wavetable controls"
        onChange={(key, val, state) =>
          handleSettingsChange(wavetableHandle, key, val, state)
        }
        settings={settings}
      />

      <div id="wavyjones-viz" className="wavyjones-viz" />
    </div>
  );
};

export default WavetableDemo;
