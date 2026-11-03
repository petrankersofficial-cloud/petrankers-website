// © 2026 Orrnob Mahmud. All rights reserved. Proprietary, see LICENSE. Build sbs-ebbd6a56dd25
/**
 * SITE CONFIG: the only file you edit per client (plus the design layer).
 * Everything SEO-wide (title suffix, default OG image, organization schema,
 * NAP, nav, CTA) is read from here by the templates.
 */
export const site = {
  name: 'Pet Rankers',
  url: 'https://petrankers.com', // production URL, no trailing slash (single source of truth)
  titleTemplate: '%s | Pet Rankers', // %s = page metaTitle (skipped if metaTitle already contains the brand)
  defaultDescription: 'Pet Rankers helps groomers, sitters, boarders and vet clinics rank #1 on Google Maps and in AI search. Get a free 48-hour audit and start booking more calls.',
  locale: 'en_US',
  lang: 'en',

  // Used for social cards when a post has no featured image. Put the file in /public.
  defaultOgImage: '/images/pet-business-seo-agency-google-maps-bookings.webp',
  logo: '/images/Petrankers.svg',
  favicon: '/images/cropped-Pet-Rankers-Icon-192x192.png',

  // Organization / LocalBusiness schema (rendered on every page)
  business: {
    type: 'Organization',
    legalName: 'Pet Rankers',
    phone: '',
    email: 'seo@petrankers.com',
    // Pet Rankers is a remote agency: no street address is published on the live site.
    address: {
      street: '',
      city: '',
      region: '',
      postalCode: '',
      country: '',
    },
    areaServed: [] as string[],
    sameAs: [
      'https://www.facebook.com/petrankers/',
      'https://www.instagram.com/petrankers/',
      'https://www.linkedin.com/company/pet-rankers/',
    ],
  },

  // The header/footer markup lives in src/design/ (ported from the live site); nav is used by templates and llms.txt.
  nav: [
    { label: 'SEO Services', href: '/seo-services/' },
    { label: 'Website Development', href: '/website-development/' },
    { label: 'About Us', href: '/about-us/' },
    { label: 'Contact', href: '/contact/' },
  ],

  // Default CTA block at the end of every post (a post can override with `cta` in frontmatter)
  cta: {
    heading: 'Get ahead on AI visibility',
    text: 'We’re already building AI visibility for pet groomers. Your competitors almost certainly aren’t. This is your window to get ahead.',
    buttonLabel: 'Schedule a Call',
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
    successPath: '/thank-you/', // unused: the live site books calls through the Google Calendar embed on /contact/
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
    enabled: false, // the live site has no search page (13 pages); turn on and restore src/pages/search.astro if the blog grows
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
