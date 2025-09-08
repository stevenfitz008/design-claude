import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Test configuration for running StoreTestApp on port 3002
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@types': path.resolve(__dirname, './src/types'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@styles': path.resolve(__dirname, './src/styles'),
    },
  },
  define: {
    __REACT_DEVTOOLS_GLOBAL_HOOK__: 'window.__REACT_DEVTOOLS_GLOBAL_HOOK__',
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  server: {
    port: 3002,
    open: false,
  },
  preview: {
    port: 4174,
  },
});