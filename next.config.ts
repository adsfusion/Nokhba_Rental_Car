import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      canvg: './src/lib/empty-module.ts',
      html2canvas: './src/lib/empty-module.ts',
      dompurify: './src/lib/empty-module.ts',
    },
  },
};

export default withNextIntl(nextConfig);
