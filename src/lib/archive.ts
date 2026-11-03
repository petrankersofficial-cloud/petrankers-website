// © 2026 Orrnob Mahmud. All rights reserved. Proprietary, see LICENSE. Build sbs-ebbd6a56dd25
import { getCollection } from 'astro:content';
import { site } from '../site.config';
import { getPosts, type Post } from './content';

export function chunk<T>(arr: T[], size = site.blog.postsPerPage): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out.length ? out : [[]];
}

export async function blogArchive() {
  const posts = await getPosts();
  const usedCategories = [...new Set(posts.map((p) => p.data.category.id))];
  return { posts, pages: chunk(posts), usedCategories };
}

export async function categoryArchives() {
  const posts = await getPosts();
  const cats = await getCollection('categories');
  const usedCategories = [...new Set(posts.map((p) => p.data.category.id))];
  return cats
    .map((c) => {
      const list: Post[] = posts.filter((p) => p.data.category.id === c.id);
      return { category: c, pages: chunk(list), count: list.length, usedCategories };
    })
    .filter((c) => c.count > 0); // no empty (thin) category pages
}
