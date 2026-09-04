export type Timeframe = 'short' | 'medium' | 'long';

export const TIMEFRAMES: Timeframe[] = ['short', 'medium', 'long'];

export interface SpotifyTrack {
  id: string;
  title: string;
  album: string;
  previewUrl: string | null;
  artists: { name: string; url: string }[];
  /** Local image path without extension; `.avif` and `.webp` variants exist */
  image: string | null;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  url: string;
  genres: string[];
  image: string | null;
}

export interface SpotifyData {
  fetchedAt: string;
  tracks: Record<Timeframe, SpotifyTrack[]>;
  artists: Record<Timeframe, SpotifyArtist[]>;
}
