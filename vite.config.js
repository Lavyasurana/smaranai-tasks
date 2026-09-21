import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@task1': path.resolve(__dirname, './task-1/frontend/src'),
      '@task2': path.resolve(__dirname, './task-2/frontend/src'),
      '@task3': path.resolve(__dirname, './task-3/frontend/src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
});
