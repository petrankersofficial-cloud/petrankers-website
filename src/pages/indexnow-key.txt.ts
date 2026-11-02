// © 2026 Orrnob Mahmud. All rights reserved. Proprietary, see LICENSE. Build sbs-ebbd6a56dd25
/** IndexNow key file. Search engines fetch this to confirm the pings come from the site owner. */
import type { APIRoute } from 'astro';
import { site } from '../site.config';

export const GET: APIRoute = () =>
  new Response(site.indexNowKey, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
