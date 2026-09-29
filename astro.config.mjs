import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
        'next/link': path.resolve(__dirname, './src/shims/next-link.tsx'),
        'next/image': path.resolve(__dirname, './src/shims/next-image.tsx'),
        'next/navigation': path.resolve(__dirname, './src/shims/next-navigation.tsx'),
        'next/headers': path.resolve(__dirname, './src/shims/next-headers.ts'),
        'next/server': path.resolve(__dirname, './src/shims/next-server.ts'),
      },
    },
    ssr: {
      noExternal: ['lucide-react'],
    },
  },
});
