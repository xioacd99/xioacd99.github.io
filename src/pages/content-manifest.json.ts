import { getPosts, postSlug } from '../lib/posts';
export async function GET() {
  const posts = [...await getPosts('en'), ...await getPosts('zh')];
  return new Response(JSON.stringify(posts.map((post) => ({ id: postSlug(post), demo: post.data.demo, lang: post.data.lang }))), { headers: { 'Content-Type': 'application/json' } });
}
