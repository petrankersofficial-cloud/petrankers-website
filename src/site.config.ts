/**
 * SITE CONFIG: the only file you edit per client (plus the design layer).
 * Everything SEO-wide (title suffix, default OG image, organization schema,
 * NAP, nav, CTA) is read from here by the templates.
 */
export const site = {
  name: 'Client Business Name',
  url: 'https://www.example.com', // production URL, no trailing slash (single source of truth)
  titleTemplate: '%s | Client Business Name', // %s = page metaTitle (skipped if metaTitle already contains the brand)
  defaultDescription: 'Short default meta description for pages that do not set one.',
  locale: 'en_US',
  lang: 'en',

  // Used for social cards when a post has no featured image. Put the file in /public.
  defaultOgImage: '/og-default.jpg',
  logo: '/logo.svg',
  favicon: '/favicon.svg',

  // Organization / LocalBusiness schema (rendered on every page)
  business: {
    type: 'LocalBusiness', // e.g. Plumber, Dentist, RoofingContractor, LocalBusiness, Organization
    legalName: 'Client Business Name LLC',
    phone: '(000) 000-0000',
    email: 'hello@example.com',
    address: {
      street: '123 Main St',
      city: 'City',
      region: 'ST',
      postalCode: '00000',
      country: 'US',
    },
    areaServed: ['City', 'Nearby City'],
    sameAs: [
      // 'https://www.facebook.com/...',
      // 'https://www.google.com/maps?cid=...',
    ],
  },

  nav: [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services/' },
    { label: 'Case Studies', href: '/case-studies/' },
    { label: 'Blog', href: '/blog/' },
    { label: 'Contact', href: '/contact/' },
  ],

  // Default CTA block at the end of every post (a post can override with `cta` in frontmatter)
  cta: {
    heading: 'Need help with this?',
    text: 'Talk to our team today and get a free estimate.',
    buttonLabel: 'Get a Free Quote',
    buttonHref: '/contact/',
  },

  blog: {
    postsPerPage: 12,
    relatedPosts: 3,
  },

  // Content rules enforced by `npm run lint:content`
  rules: {
    metaTitleMax: 60,
    metaDescriptionMin: 120,
    metaDescriptionMax: 160,
    minInternalLinks: 2,
    banEmDash: true,
  },
} as const;

export type SiteConfig = typeof site;
