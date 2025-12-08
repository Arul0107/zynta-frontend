// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  
  build: {
    chunkSizeWarningLimit: 1600,   // remove 500kb warning safely

    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          antd: ['antd'],
          icons: ['@ant-design/icons'],
          utils: ['lodash', 'dayjs'], // optional but useful
        },
      },
    },
  },
});
