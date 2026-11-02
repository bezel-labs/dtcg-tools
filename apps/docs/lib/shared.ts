import { createGetUrl } from 'fumadocs-core/source';

export const appName = 'Open Design Tokens';
/** Pages live at the app root; Next's basePath adds the /docs prefix. */
export const docsRoute = '/';
export const docsContentRoute = '/llms.mdx';
/** The playground and API reference live on the same domain, outside the docs base path. */
export const siteUrl = 'https://opendesigntokens.com';
export const gitConfig = {
  user: 'bezel-labs',
  repo: 'open-design-tokens',
  branch: 'main',
};

const getContentUrl = createGetUrl(docsContentRoute);

export function getPageMarkdownUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'content.md'];
  return { segments, url: getContentUrl(segments, page.locale) };
}
