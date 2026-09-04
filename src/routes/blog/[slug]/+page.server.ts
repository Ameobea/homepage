import { error } from '@sveltejs/kit';
import { getPost, listPosts, postHead } from '$lib/server/posts';

export const entries = () => listPosts().map(({ slug }) => ({ slug }));

export const load = async ({ params }) => {
  const post = await getPost(params.slug);
  if (!post) {
    error(404, 'Post not found');
  }
  return { post, head: postHead(post.frontmatter) };
};
