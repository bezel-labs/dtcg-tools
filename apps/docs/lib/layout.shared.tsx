import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, gitConfig, siteUrl } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: appName,
      url: '/',
    },
    links: [
      { text: 'Playground', url: `${siteUrl}/playground/`, external: true },
      { text: 'API reference', url: `${siteUrl}/api/`, external: true },
      {
        text: 'Discussions',
        url: 'https://github.com/bezel-labs/open-design-tokens/discussions',
        external: true,
      },
      { text: 'npm', url: 'https://www.npmjs.com/package/open-design-tokens', external: true },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
