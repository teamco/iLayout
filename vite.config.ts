import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import Terminal from 'vite-plugin-terminal';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), Terminal()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
});
