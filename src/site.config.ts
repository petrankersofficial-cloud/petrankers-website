// © 2026 Orrnob Mahmud. All rights reserved. Proprietary, see LICENSE. Build sbs-ebbd6a56dd25
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

  // Tracking + verification. Leave '' to disable. Nothing loads unless an ID is set.
  analytics: {
    gtmId: '', // 'GTM-XXXXXXX' (if set, add GA4 inside GTM and leave ga4Id empty)
    ga4Id: '', // 'G-XXXXXXXXXX' (direct GA4, used only when gtmId is empty)
    cloudflareToken: '', // Cloudflare Web Analytics beacon token (free, cookieless)
    clarityId: '', // Microsoft Clarity project id
    googleVerification: '', // Search Console HTML-tag value (or verify by DNS and leave empty)
    bingVerification: '', // Bing Webmaster msvalidate.01 value
  },

  // Contact form backend (static sites need a free form service)
  //   'netlify'   -> Netlify Forms (only works when hosted on Netlify; Akismet spam filter built in)
  //   'web3forms' -> free, works on any host (use this on Cloudflare Pages): access key from web3forms.com
  //   'formspree' -> free tier, works on any host: form id from formspree.io
  // Spam: every form has a honeypot field; each provider adds its own filtering.
  forms: {
    provider: 'netlify' as 'netlify' | 'web3forms' | 'formspree',
    web3formsKey: '',
    formspreeId: '',
    successPath: '/thank-you/',
    services: ['General inquiry', 'Free estimate', 'Emergency service'], // dropdown options
  },

  // IndexNow (Bing, Yandex, Seznam; Bing feeds ChatGPT search). Any random 32-character hex string.
  // Generate one: node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
  indexNowKey: '',

  // Legal pages (/privacy-policy/, /terms/). Review with the client before launch.
  legal: {
    effectiveDate: '2026-11-03',
    jurisdiction: 'the State of ST, United States',
  },

  // Site search (Pagefind, free, built at deploy time)
  search: {
    enabled: true,
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
