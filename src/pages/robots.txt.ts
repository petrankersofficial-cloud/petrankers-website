// © 2026 Orrnob Mahmud. All rights reserved. Proprietary, see LICENSE. Build sbs-ebbd6a56dd25
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('sitemap-index.xml', site).toString();
  const body = [
    'User-agent: *',
    'Allow: /',
    // Carried over from the live site's robots.txt
    'Disallow: /_backup/',
    'Disallow: /old/',
    'Disallow: /uploads/',
    // Content-system routes that should not be crawled
    'Disallow: /admin/',
    '',
    `Sitemap: ${sitemap}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
