export const SAMPLE_RATE = 44100;
export const baseFrequency = 30; // 30hz

export const waveformSampleCount = SAMPLE_RATE / baseFrequency;

const bufs = new Array(4)
  .fill(null)
  .map((_, i) => new Float32Array(waveformSampleCount));

// sine wave.  The sine function has a period of 2π, and we need to scale that the range of
// (sample_rage / desired_frequency)
for (let x = 0; x < waveformSampleCount; x++) {
  bufs[0][x] = Math.sin(x * ((Math.PI * 2) / waveformSampleCount));
}

// triangle wave; goes from -1 to 1 for one half the period and 1 to -1 for the other half
for (let i = 0; i < waveformSampleCount; i++) {
  // Number of half-periods of this wave that this sample lies on.
  const halfPeriodIx = i / (waveformSampleCount / 2);
  const isClimbing = Math.floor(halfPeriodIx) % 2 == 0;
  let val = 2 * (halfPeriodIx % 1) - 1;
  if (!isClimbing) {
    val = -val;
  }

  bufs[1][i] = val;
}

// square wave; half a period -1, half a period 1
for (let i = 0; i < waveformSampleCount; i++) {
  const halfPeriodIx = i / (waveformSampleCount / 2);
  const isFirstHalf = Math.floor(halfPeriodIx) % 2 == 0;

  bufs[2][i] = isFirstHalf ? -1 : 1;
}

// sawtooth; climb from -1 to 1 over 1 period
for (let i = 0; i < waveformSampleCount; i++) {
  const periodIxFract = (i / waveformSampleCount) % 1;

  bufs[3][i] = periodIxFract * 2 - 1;
}

export default bufs;
