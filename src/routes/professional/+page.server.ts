import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from '$lib/server/paths';

export interface WorkExperience {
  company: string;
  website: string | null;
  location: string;
  title: string;
  startDate: string;
  endDate: string;
  descriptions: string[] | null;
}

export const load = () => ({
  workExperience: JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, 'content/workExperience.json'), 'utf8')
  ) as WorkExperience[],
});
