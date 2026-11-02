import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts, postUrl } from '../lib/content';
import { site } from '../site.config';

export async function GET(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: `${site.name} Blog`,
    description: site.defaultDescription,
    site: context.site ?? site.url,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.excerpt,
      pubDate: p.data.publishDate,
      link: postUrl(p),
    })),
  });
}
