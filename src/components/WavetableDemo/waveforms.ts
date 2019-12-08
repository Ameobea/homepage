export const SAMPLE_RATE = 44100;
export const baseFrequency = 30; // 30hz

export const waveformSampleCount = SAMPLE_RATE / baseFrequency;

const bufs = new Array(4).fill(null).map((_, i) => new Float32Array());

for (let x = 0; x < 440; x++) {
  bufs[0][x] = Math.sin(x * ((Math.PI * 2) / waveformSampleCount));
}

// triangle wave; goes from -1 to 1 for one half the period and 1 to -1 for the other half
for (let i = 0; i < waveformSampleCount; i++) {
  // Number of half-periods of this wave that this sample lies on.
  const halfPeriodIx = i / (waveformSampleCount / 2);
  const isClimbing = Math.floor(halfPeriodIx) % 2 == 0;
  // `%1` is a trick to get the decimal part of a number in JS
  let val = 2 * (halfPeriodIx % 1) - 1;

  // If we're on the second half of the waveform, we flip the sign
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
  // What fraction of the way we are through the current period
  const periodIxFract = (i / waveformSampleCount) % 1;

  // Scale from [0, 1] to [-1, 1]
  bufs[3][i] = periodIxFract * 2 - 1;
}

export default bufs;
