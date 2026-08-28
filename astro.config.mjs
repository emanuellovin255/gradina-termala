import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://gradinatermala.ro',
  integrations: [sitemap()],
  i18n: {
    defaultLocale: 'ro',
    locales: ['ro', 'hu'],
    routing: { prefixDefaultLocale: false },
  },
  build: { inlineStylesheets: 'auto' },
});
