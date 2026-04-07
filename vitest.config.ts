import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'virtual-terminal',
      resolveId(id: string) {
        if (id === 'virtual:terminal') {
          return id;
        }
      },
      load(id: string) {
        if (id === 'virtual:terminal') {
          return `export const terminal = {
            log: () => {},
            error: () => {},
            warn: () => {},
            info: () => {},
            debug: () => {}
          };`;
        }
      },
    },
  ],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    passWithNoTests: true,
  },
});
