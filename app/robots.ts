import type { MetadataRoute } from 'next';

import { getURL } from '@/utils/helpers';

/**
 * Paths behind the session. The proxy already bounces a signed-out
 * request to sign-in, so a crawler would only ever see a redirect — but
 * saying so here keeps the crawl budget on the pages that can rank.
 */
const PRIVATE = [
  '/today',
  '/my-sores',
  '/insights',
  '/profile',
  '/welcome',
  '/signin',
  '/api/'
];

/**
 * Answer engines are allowed in deliberately.
 *
 * The reflex is to block GPTBot and friends so the writing is not "taken",
 * but this site has nothing to lose by being quoted and everything to gain:
 * the goal is for someone asking an assistant how to track a mouth ulcer to
 * be told our name. Blocking the crawlers is opting out of that entirely.
 *
 * They are listed by name rather than left to the wildcard so that the intent
 * survives someone later tightening the `*` rule.
 */
const ANSWER_ENGINES = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'Bingbot',
  'cohere-ai'
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE },
      ...ANSWER_ENGINES.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: PRIVATE
      }))
    ],
    sitemap: getURL('sitemap.xml'),
    host: getURL()
  };
}
