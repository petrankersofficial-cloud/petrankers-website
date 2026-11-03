// © 2026 Orrnob Mahmud. All rights reserved. Proprietary, see LICENSE. Build sbs-ebbd6a56dd25
import { getCollection, type CollectionEntry } from 'astro:content';
import { site } from '../site.config';

export type Post = CollectionEntry<'blog'>;
export type CaseStudy = CollectionEntry<'caseStudies'>;

const isLive = (data: { draft: boolean; publishDate: Date }) =>
  !data.draft && (import.meta.env.DEV || data.publishDate.valueOf() <= Date.now());

const byDateDesc = (a: { data: { publishDate: Date } }, b: { data: { publishDate: Date } }) =>
  b.data.publishDate.valueOf() - a.data.publishDate.valueOf();

/** Published posts only: drafts and future-dated (scheduled) posts are excluded from production builds. */
export async function getPosts(): Promise<Post[]> {
  return (await getCollection('blog', ({ data }) => isLive(data))).sort(byDateDesc);
}

export async function getCaseStudies(): Promise<CaseStudy[]> {
  return (await getCollection('caseStudies', ({ data }) => isLive(data))).sort(byDateDesc);
}

export type Service = CollectionEntry<'services'>;
export type Location = CollectionEntry<'locations'>;

export async function getServices(): Promise<Service[]> {
  return (await getCollection('services', ({ data }) => isLive(data))).sort(
    (a, b) => a.data.order - b.data.order || a.data.serviceName.localeCompare(b.data.serviceName),
  );
}

export async function getLocations(): Promise<Location[]> {
  return (await getCollection('locations', ({ data }) => isLive(data))).sort(
    (a, b) => a.data.city.localeCompare(b.data.city) || a.data.title.localeCompare(b.data.title),
  );
}

export const postUrl = (p: Post) => `/blog/${p.data.slug}/`;
export const caseStudyUrl = (c: CaseStudy) => `/case-studies/${c.data.slug}/`;
export const serviceUrl = (s: Service) => `/services/${s.data.slug}/`;
export const locationUrl = (l: Location) => `/service-areas/${l.data.slug}/`;
export const categoryUrl = (id: string) => `/blog/category/${id}/`;

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return new URL(path, site.url).toString();
}

export function readingTime(body = ''): number {
  const words = body.replace(/```[\s\S]*?```/g, '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 225));
}

/** Related posts: same category first, then shared tags, then most recent. */
export function relatedPosts(current: Post, all: Post[], limit = site.blog.relatedPosts): Post[] {
  const score = (p: Post) =>
    (p.data.category.id === current.data.category.id ? 10 : 0) +
    p.data.tags.filter((t) => current.data.tags.includes(t)).length;
  return all
    .filter((p) => p.id !== current.id)
    .map((p) => ({ p, s: score(p) }))
    .sort((a, b) => b.s - a.s || byDateDesc(a.p, b.p))
    .slice(0, limit)
    .map(({ p }) => p);
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

export function buildTitle(metaTitle: string): string {
  return metaTitle.toLowerCase().includes(site.name.toLowerCase())
    ? metaTitle
    : site.titleTemplate.replace('%s', metaTitle);
}
