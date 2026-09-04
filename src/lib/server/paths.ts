import path from 'node:path';

export const REPO_ROOT = process.cwd();
export const POSTS_DIR = path.join(REPO_ROOT, 'content/blog');
export const NOTES_MANIFEST = path.join(REPO_ROOT, 'content/noteBlogPosts.json');
export const IMAGE_MANIFEST = path.resolve(process.cwd(), '.image-manifest.json');
export const SPOTIFY_DATA = path.resolve(process.cwd(), '.spotify.json');
