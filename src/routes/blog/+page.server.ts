import { listFeedEntries } from '$lib/server/posts';

export const load = () => ({ posts: listFeedEntries() });
