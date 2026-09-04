import { imagesUnder } from '$lib/server/images';

export const load = () => ({ images: imagesUnder('content/images/projects/') });
