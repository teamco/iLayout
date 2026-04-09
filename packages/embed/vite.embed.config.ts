import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  envDir: resolve(__dirname, '../..'),
  build: {
    lib: {
      entry: resolve(__dirname, 'src/embed.ts'),
      formats: ['iife'],
      name: 'AntHillLayout',
      fileName: () => 'embed.js',
    },
    cssCodeSplit: false,
    sourcemap: true,
    emptyOutDir: false,
    outDir: 'dist',
  },
});
