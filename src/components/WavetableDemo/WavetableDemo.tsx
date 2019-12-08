import React, { useState, useEffect } from 'react';
import ControlPanel from 'react-control-panel';

import waveforms, { waveformSampleCount, baseFrequency } from './waveforms';

const ctx = new AudioContext();
const globalGain = new GainNode(ctx);
globalGain.gain.value = 0.1;
globalGain.connect(ctx.destination);

const initWavetable = async () => {
  // Register our custom `AudioWorkletProcessor`, and create an `AudioWorkletNode` that serves as a
  // handle to an instance of one.
  await ctx.audioWorklet.addModule('/WaveTableNodeProcessor.js');
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
  const res = await fetch('./wavetable.wasm');
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

const WavetableDemo: React.FC<{}> = () => {
  const [
    wavetableHandle,
    setWavetableHandle,
  ] = useState<AudioWorkletNode | null>(null);

  useEffect(() => {
    if (typeof AudioWorkletNode !== 'function') {
      return;
    }

    initWavetable().then(setWavetableHandle);
  }, []);

  if (typeof AudioWorkletNode !== 'function') {
    return (
      <div>
        Unfortunately, your browser doesn't support the{' '}
        <code>AudioWorkletProcessor</code> API required by the wavetable. Try
        using Chrome, and maybe leave a note for your local browser developers
        letting them know you'd really love to have access to this awesome API!
      </div>
    );
  }

  if (!wavetableHandle) {
    return <span>Loading...</span>;
  }

  return (
    <ControlPanel
      initialState={{ volume: 10 }}
      onChange={(key, val) => handleSettingsChange(wavetableHandle, key, val)}
      settings={[
        {
          label: 'volume',
          min: 0,
          max: 100,
          steps: 100,
        },
      ]}
    />

    // TODO: Add waveform visualization
  );
};
