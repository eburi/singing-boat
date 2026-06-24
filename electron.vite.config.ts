import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  main: {
    build: {
      outDir: 'dist/main',
    },
    resolve: {
      alias: {
        '@main': resolve(__dirname, 'src/main'),
      },
    },
  },
  preload: {
    build: {
      outDir: 'dist/preload',
    },
  },
  renderer: {
    root: 'src/renderer',
    build: {
      outDir: 'dist/renderer',
    },
    resolve: {
      alias: {
        '@renderer': resolve(__dirname, 'src/renderer'),
      },
    },
    plugins: [react()],
  },
});
