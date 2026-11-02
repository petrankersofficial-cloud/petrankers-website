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
  loader: glob({ pattern: '**/index.{md,mdx}', base: './src/content/blog' }),
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
  loader: glob({ pattern: '**/index.{md,mdx}', base: './src/content/case-studies' }),
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

export const collections = { blog, caseStudies, authors, categories };
