import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Deploy to Vercel by default or use node standalone if ASTRO_ADAPTER=node
const isNodeStandalone = process.env.ASTRO_ADAPTER === 'node';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: isNodeStandalone ? node({ mode: 'standalone' }) : vercel(),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
        'lucide-react': path.resolve(__dirname, './src/lib/hugeicons.tsx'),
      },
    },
    ssr: {
      noExternal: ['lucide-react', 'hugeicons-react', 'gsap', '@gsap/react'],
    },
  },
});
