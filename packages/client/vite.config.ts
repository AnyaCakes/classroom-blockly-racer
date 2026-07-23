import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves this app from a subpath (username.github.io/repo-name/),
// not the domain root. VITE_BASE_PATH is set by the deploy workflow to
// match the actual repo name; local dev never sets it, so `base`
// defaults to '/' and nothing changes for `npm run dev`.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH ?? '/',
  server: {
    port: 5173,
  },
});
