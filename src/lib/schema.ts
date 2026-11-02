import { site } from '../site.config';
import { absoluteUrl } from './content';

const ORG_ID = `${site.url}/#organization`;

export function organizationSchema() {
  const b = site.business;
  return {
    '@type': b.type,
    '@id': ORG_ID,
    name: site.name,
    legalName: b.legalName,
    url: site.url,
    logo: absoluteUrl(site.logo),
    image: absoluteUrl(site.defaultOgImage),
    telephone: b.phone,
    email: b.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: b.address.street,
      addressLocality: b.address.city,
      addressRegion: b.address.region,
      postalCode: b.address.postalCode,
      addressCountry: b.address.country,
    },
    areaServed: b.areaServed,
    sameAs: b.sameAs,
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.url),
    })),
  };
}

export function faqSchema(faq: { q: string; a: string }[]) {
  if (!faq.length) return null;
  return {
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function articleSchema(opts: {
  type: string;
  url: string;
  headline: string;
  description: string;
  image: string;
  publishDate: Date;
  updatedDate?: Date;
  author?: { name: string; url?: string; sameAs?: string[] };
  keywords?: string[];
  section?: string;
  wordCount?: number;
}) {
  return {
    '@type': opts.type,
    '@id': `${absoluteUrl(opts.url)}#article`,
    mainEntityOfPage: absoluteUrl(opts.url),
    headline: opts.headline,
    description: opts.description,
    image: absoluteUrl(opts.image),
    datePublished: opts.publishDate.toISOString(),
    dateModified: (opts.updatedDate ?? opts.publishDate).toISOString(),
    author: opts.author
      ? {
          '@type': 'Person',
          name: opts.author.name,
          url: opts.author.url ? absoluteUrl(opts.author.url) : undefined,
          sameAs: opts.author.sameAs,
        }
      : { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    keywords: opts.keywords?.join(', '),
    articleSection: opts.section,
    wordCount: opts.wordCount,
  };
}
