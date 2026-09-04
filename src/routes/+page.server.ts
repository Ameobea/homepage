import fs from 'node:fs';
import { getImageEntry } from '$lib/server/images';
import { SPOTIFY_DATA } from '$lib/server/paths';
import type { SpotifyData } from '$lib/spotify';

export const load = () => {
  if (!fs.existsSync(SPOTIFY_DATA)) {
    throw new Error(`${SPOTIFY_DATA} not found; run \`bun run spotify\` first`);
  }
  return {
    face: getImageEntry('content/images/face.jpg'),
    spotify: JSON.parse(fs.readFileSync(SPOTIFY_DATA, 'utf8')) as SpotifyData,
  };
};
