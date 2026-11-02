/**
 * CONTENT SCHEMAS = the "SEO plugin" of this site.
 * Every post must pass these rules or the build FAILS and nothing deploys.
 * This is what keeps agent-published content consistent.
 */
import { defineCollection, reference } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase-kebab-case');

const faq = z
  .array(z.object({ q: z.string().min(5), a: z.string().min(10) }))
  .default([]);

const cta = z
  .object({
    heading: z.string(),
    text: z.string(),
    buttonLabel: z.string(),
    buttonHref: z.string(),
  })
  .optional();

/** Shared SEO fields for every long-form content type */
const seoFields = {
  title: z.string().min(10).max(110), // visible H1
  metaTitle: z.string().min(10).max(70), // <title> (lint warns above 60)
  metaDescription: z.string().min(70).max(170), // lint warns outside 120-160
  slug,
  canonical: z.url().optional(), // only when content is syndicated from elsewhere
  noindex: z.boolean().default(false),
  publishDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  draft: z.boolean().default(false),
  focusKeyword: z.string().optional(),
  secondaryKeywords: z.array(z.string()).default([]),
};

const blog = defineCollection({
  // One folder per post: src/content/blog/<slug>/index.md + its images
  loader: glob({ pattern: '**/index.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      ...seoFields,
      excerpt: z.string().min(40).max(300),
      author: reference('authors'),
      category: reference('categories'),
      tags: z.array(z.string()).default([]),
      featuredImage: image(),
      featuredImageAlt: z.string().min(5),
      faq,
      cta,
      schemaType: z.enum(['BlogPosting', 'Article', 'HowTo']).default('BlogPosting'),
    }),
});

const caseStudies = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/case-studies' }),
  schema: ({ image }) =>
    z.object({
      ...seoFields,
      excerpt: z.string().min(40).max(300),
      client: z.string(), // can be anonymized: "Plumbing company in Vernon Hills, IL"
      industry: z.string(),
      location: z.string().optional(),
      services: z.array(z.string()).min(1),
      duration: z.string().optional(), // "6 months"
      // Stat cards at the top of the page. Lead with data.
      results: z
        .array(
          z.object({
            metric: z.string(), // "Organic calls"
            before: z.string().optional(), // "42/mo"
            after: z.string(), // "187/mo"
            change: z.string().optional(), // "+345%"
          }),
        )
        .min(1)
        .max(6),
      featuredImage: image(),
      featuredImageAlt: z.string().min(5),
      testimonial: z
        .object({ quote: z.string(), name: z.string(), role: z.string().optional() })
        .optional(),
      author: reference('authors').optional(),
      faq,
      cta,
    }),
});

const authors = defineCollection({
  loader: file('./src/content/authors.json'),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    bio: z.string(),
    avatar: z.string().optional(), // path under /public
    url: z.string().optional(),
    sameAs: z.array(z.url()).default([]),
  }),
});

const categories = defineCollection({
  loader: file('./src/content/categories.json'),
  schema: z.object({
    name: z.string(),
    description: z.string(),
  }),
});

/**
 * SERVICE PAGES: /services/<slug>/
 * One entry per core service. The body is the main sales copy.
 */
const services = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/services' }),
  schema: ({ image }) =>
    z.object({
      ...seoFields,
      serviceName: z.string(), // name used in Service schema + cards: "Emergency Plumbing"
      serviceType: z.string().optional(), // schema.org serviceType, e.g. "Plumbing repair"
      excerpt: z.string().min(40).max(300),
      featuredImage: image(),
      featuredImageAlt: z.string().min(5),
      benefits: z.array(z.string()).default([]), // check-list cards
      process: z.array(z.object({ title: z.string(), text: z.string() })).default([]), // numbered steps
      priceRange: z.string().optional(), // only if the client gave real prices: "$150 to $400"
      order: z.number().default(100), // sort order on /services/
      faq,
      cta,
    }),
});

/**
 * LOCATION PAGES: /service-areas/<slug>/
 * Either a city hub ("Plumber in Vernon Hills, IL 60061") or, when `service` is set,
 * a service-in-city page ("Vernon Hills Emergency Plumber 60061"). City + ZIP formula applies.
 */
const locations = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/locations' }),
  schema: ({ image }) =>
    z.object({
      ...seoFields,
      city: z.string(),
      state: z.string().length(2), // "IL"
      zips: z.array(z.string().regex(/^\d{5}$/)).min(1), // primary ZIP first
      county: z.string().optional(),
      service: reference('services').optional(), // set for service-in-city pages
      excerpt: z.string().min(40).max(300),
      featuredImage: image().optional(), // falls back to the service image, then the site default
      featuredImageAlt: z.string().optional(),
      neighborhoods: z.array(z.string()).default([]),
      nearby: z.array(reference('locations')).default([]), // nearby location pages to interlink
      landmarks: z.array(z.string()).default([]), // real local references, only if true
      geo: z.object({ lat: z.number(), lng: z.number() }).optional(),
      showMap: z.boolean().default(true),
      faq,
      cta,
    }),
});

export const collections = { blog, caseStudies, authors, categories, services, locations };
