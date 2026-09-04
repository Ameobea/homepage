import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import type { SpotifyArtist, SpotifyData, SpotifyTrack, Timeframe } from '../src/lib/spotify.ts';

// Spotifytrack caches artist metadata (genres) that Spotify's own API no longer serves
const STATS_URL = 'https://spotifytrack.net/api/stats/ameobea';
const OUT_JSON = path.join(process.cwd(), '.spotify.json');
const IMG_DIR = path.join(process.cwd(), 'static/spotify');
const ITEMS_PER_TIMEFRAME = 20;
const IMAGE_SIZE = 160;
const TIMEFRAMES: Timeframe[] = ['short', 'medium', 'long'];

interface ApiArtist {
  id: string;
  name: string;
  genres: string[] | null;
  images: { url: string }[] | null;
}

interface ApiTrack {
  id: string;
  name: string;
  preview_url: string | null;
  artists: ApiArtist[];
  album: { name: string; images: { url: string }[] };
}

interface ApiStats {
  tracks: Record<Timeframe, ApiTrack[]>;
  artists: Record<Timeframe, ApiArtist[]>;
}

const imageJobs = new Map<string, string>();

const localImage = (images: { url: string }[] | null): string | null => {
  const url = images?.[0]?.url;
  if (!url) {
    return null;
  }
  const name = createHash('sha1').update(url).digest('hex').slice(0, 12);
  imageJobs.set(name, url);
  return `/spotify/${name}`;
};

const artistUrl = (id: string) => `https://open.spotify.com/artist/${id}`;

const toTrack = (t: ApiTrack): SpotifyTrack => ({
  id: t.id,
  title: t.name,
  album: t.album.name,
  previewUrl: t.preview_url,
  artists: t.artists.map((a) => ({ name: a.name, url: artistUrl(a.id) })),
  image: localImage(t.album.images),
});

const toArtist = (a: ApiArtist): SpotifyArtist => ({
  id: a.id,
  name: a.name,
  url: artistUrl(a.id),
  genres: a.genres ?? [],
  image: localImage(a.images),
});

const processImage = async (name: string, url: string): Promise<boolean> => {
  const avif = path.join(IMG_DIR, `${name}.avif`);
  const webp = path.join(IMG_DIR, `${name}.webp`);
  if (existsSync(avif) && existsSync(webp)) {
    return false;
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${url}: ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const resized = sharp(buf).resize(IMAGE_SIZE, IMAGE_SIZE, { fit: 'cover' });
  await Promise.all([
    resized.clone().avif({ quality: 60 }).toFile(avif),
    resized.clone().webp({ quality: 86 }).toFile(webp),
  ]);
  return true;
};

const main = async () => {
  const res = await fetch(STATS_URL);
  if (!res.ok) {
    throw new Error(`${STATS_URL}: ${res.status}`);
  }
  const stats = (await res.json()) as ApiStats;

  const data: SpotifyData = {
    fetchedAt: new Date().toISOString(),
    tracks: { short: [], medium: [], long: [] },
    artists: { short: [], medium: [], long: [] },
  };
  for (const tf of TIMEFRAMES) {
    data.tracks[tf] = stats.tracks[tf].slice(0, ITEMS_PER_TIMEFRAME).map(toTrack);
    data.artists[tf] = stats.artists[tf].slice(0, ITEMS_PER_TIMEFRAME).map(toArtist);
  }

  await fs.mkdir(IMG_DIR, { recursive: true });
  let fetched = 0;
  for (const [name, url] of imageJobs) {
    if (await processImage(name, url)) {
      fetched += 1;
    }
  }
  for (const file of await fs.readdir(IMG_DIR)) {
    if (!imageJobs.has(path.parse(file).name)) {
      await fs.rm(path.join(IMG_DIR, file));
    }
  }

  await fs.writeFile(OUT_JSON, JSON.stringify(data, null, 2));
  console.log(`spotify: ${imageJobs.size} images (${fetched} fetched), wrote ${OUT_JSON}`);
};

try {
  await main();
} catch (err) {
  if (existsSync(OUT_JSON)) {
    console.warn(`spotify: fetch failed, keeping existing ${OUT_JSON}:`, err);
  } else {
    throw err;
  }
}
