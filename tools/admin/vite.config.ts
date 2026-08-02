/**
 * Dev server for the data editor. Local tool — never built, never deployed.
 *
 * The write API is mounted as middleware rather than run as a second process,
 * so `npm run admin` is one command on one origin with no proxy to configure.
 * It is the same handler `node tools/data-server.ts` exposes, so the editor and
 * any script talk to identical code.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { dataApi } from '../data-server.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');

export default defineConfig({
  root: here,
  // Icons come straight from the site's public/, so the editor shows exactly
  // what the site will.
  publicDir: path.join(repo, 'public'),
  resolve: {
    alias: { '@': path.join(repo, 'src') },
  },
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
    // Fails loudly rather than silently editing through a second instance.
    open: false,
    fs: { allow: [repo] },
  },
  plugins: [
    react(),
    {
      name: 'evolutionpath-data-api',
      configureServer(server) {
        server.middlewares.use(dataApi);
      },
    },
  ],
});
