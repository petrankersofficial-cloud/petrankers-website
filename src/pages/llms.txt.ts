/**
 * /llms.txt: a plain-text map of the site for AI assistants and answer engines (llmstxt.org format).
 * Generated on every build, so new posts and pages appear automatically.
 */
import type { APIRoute } from 'astro';
import { getCaseStudies, getLocations, getPosts, getServices, absoluteUrl, postUrl, caseStudyUrl, serviceUrl, locationUrl } from '../lib/content';
import { site } from '../site.config';

export const GET: APIRoute = async () => {
  const [services, locations, posts, studies] = await Promise.all([getServices(), getLocations(), getPosts(), getCaseStudies()]);
  const b = site.business;
  const a = b.address;
  const line = (title: string, url: string, desc?: string) => `- [${title}](${absoluteUrl(url)})${desc ? `: ${desc}` : ''}`;
  const noindex = <T extends { data: { noindex: boolean } }>(x: T) => !x.data.noindex;

  const out = [
    `# ${site.name}`,
    '',
    `> ${site.defaultDescription}`,
    '',
    `${b.legalName} is a ${b.type.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()} located at ${a.street}, ${a.city}, ${a.region} ${a.postalCode}. Phone: ${b.phone}. Email: ${b.email}. Areas served: ${b.areaServed.join(', ')}.`,
    '',
    '## Key pages',
    line('Home', '/'),
    line('Services', '/services/'),
    line('Service areas', '/service-areas/'),
    line('Case studies', '/case-studies/'),
    line('Blog', '/blog/'),
    line('Contact', '/contact/', `Call ${b.phone} or send a message for a free estimate`),
  ];
  if (services.length) out.push('', '## Services', ...services.filter(noindex).map((s) => line(s.data.serviceName, serviceUrl(s), s.data.excerpt)));
  if (locations.length) out.push('', '## Service areas', ...locations.filter(noindex).map((l) => line(l.data.title, locationUrl(l), l.data.excerpt)));
  if (studies.length) out.push('', '## Case studies', ...studies.filter(noindex).map((c) => line(c.data.title, caseStudyUrl(c), c.data.excerpt)));
  if (posts.length) out.push('', '## Articles', ...posts.filter(noindex).map((p) => line(p.data.title, postUrl(p), p.data.excerpt)));
  out.push('', '## Optional', line('Sitemap', '/sitemap-index.xml'), line('RSS feed', '/rss.xml'), '');

  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
