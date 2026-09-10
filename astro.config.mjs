import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://gradinatermala.ro',
  // Panoul de administrare e o unealta interna: nu are ce cauta in sitemap.
  integrations: [sitemap({ filter: (page) => !page.includes('/admin') })],
  i18n: {
    defaultLocale: 'ro',
    locales: ['ro', 'hu'],
    routing: { prefixDefaultLocale: false },
  },
  build: { inlineStylesheets: 'auto' },
});
