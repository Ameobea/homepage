import fs from 'node:fs';
import path from 'node:path';
import { imagesUnder } from '$lib/server/images';
import { REPO_ROOT } from '$lib/server/paths';
import type { ImageEntry } from '$lib/images';

interface Project {
  name: string;
  description: string;
  projectUrl: string | null;
  srcUrl: string | null;
  videoUrl?: string | null;
  technologies: string[];
  pageUrl: string | null;
  image: string | null;
  imageAlt?: string;
  startDate: string;
  endDate: string | null;
}

const withTrailingSlash = (url: string | null) =>
  url && url.startsWith('/') && !url.endsWith('/') ? `${url}/` : url;

// The manifest names images by bare filename; most sit directly in content/images/projects but a
// few live in per-project subdirectories, and top-level files win when both exist.
const imagesByFilename = () => {
  const entries = Object.entries(imagesUnder('content/images/projects/')).sort(
    ([a], [b]) => a.split('/').length - b.split('/').length
  );
  const byName = new Map<string, ImageEntry>();
  for (const [key, entry] of entries) {
    if (!byName.has(path.basename(key))) {
      byName.set(path.basename(key), entry);
    }
  }
  return byName;
};

export const load = () => {
  const projects = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, 'content/projectManifest.json'), 'utf8')
  ) as Project[];
  const images = imagesByFilename();
  return {
    projects: projects.map((p) => {
      const imageEntry = p.image ? images.get(p.image) : null;
      if (p.image && !imageEntry) {
        throw new Error(`portfolio image not found for ${p.name}: ${p.image}`);
      }
      return { ...p, pageUrl: withTrailingSlash(p.pageUrl), imageEntry: imageEntry ?? null };
    }),
  };
};
