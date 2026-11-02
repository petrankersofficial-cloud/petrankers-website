// © 2026 Orrnob Mahmud. All rights reserved. Proprietary, see LICENSE. Build sbs-ebbd6a56dd25
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

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    url: site.url,
    name: site.name,
    publisher: { '@id': ORG_ID },
    ...(site.search.enabled
      ? {
          potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: `${site.url}/search/?q={search_term_string}` },
            'query-input': 'required name=search_term_string',
          },
        }
      : {}),
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

/** Service schema for service pages and service-in-city pages. */
export function serviceSchema(opts: {
  url: string;
  name: string;
  description: string;
  image?: string;
  serviceType?: string;
  priceRange?: string;
  area?: { city: string; state: string; zips: string[] } | string[];
}) {
  const area = Array.isArray(opts.area)
    ? opts.area.map((n) => ({ '@type': 'City', name: n }))
    : opts.area
      ? {
          '@type': 'City',
          name: `${opts.area.city}, ${opts.area.state}`,
          containedInPlace: { '@type': 'State', name: opts.area.state },
          address: {
            '@type': 'PostalAddress',
            addressLocality: opts.area.city,
            addressRegion: opts.area.state,
            postalCode: opts.area.zips[0],
            addressCountry: site.business.address.country,
          },
        }
      : undefined;
  return {
    '@type': 'Service',
    '@id': `${absoluteUrl(opts.url)}#service`,
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.url),
    image: opts.image ? absoluteUrl(opts.image) : undefined,
    serviceType: opts.serviceType ?? opts.name,
    provider: { '@id': ORG_ID },
    areaServed: area,
    ...(opts.priceRange ? { offers: { '@type': 'Offer', description: opts.priceRange } } : {}),
  };
}

export function webPageSchema(url: string, name: string, description: string) {
  return {
    '@type': 'WebPage',
    '@id': `${absoluteUrl(url)}#webpage`,
    url: absoluteUrl(url),
    name,
    description,
    isPartOf: { '@id': `${site.url}/#website` },
    about: { '@id': ORG_ID },
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
