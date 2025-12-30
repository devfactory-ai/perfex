import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: mode === 'development',
    minify: mode === 'development' ? false : 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks - React and React-dependent libraries must be bundled together
          if (id.includes('node_modules')) {
            // Bundle React core, React Query, and other React dependencies together
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router') ||
              id.includes('/scheduler/') ||
              id.includes('@tanstack/react-query') ||
              id.includes('use-sync-external-store')
            ) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
          }
          // Feature chunks based on file path
          if (id.includes('/pages/finance/')) {
            return 'feature-finance';
          }
          if (id.includes('/pages/crm/')) {
            return 'feature-crm';
          }
          if (id.includes('/pages/ai/') || id.includes('/components/ai/')) {
            return 'feature-ai';
          }
          if (id.includes('/pages/hr/')) {
            return 'feature-hr';
          }
          if (id.includes('/pages/inventory/')) {
            return 'feature-inventory';
          }
          if (id.includes('/pages/projects/')) {
            return 'feature-projects';
          }
          if (id.includes('/pages/workflows/')) {
            return 'feature-workflows';
          }
          if (id.includes('/pages/audit/')) {
            return 'feature-audit';
          }
          // Healthcare modules - large modules that should be split
          if (id.includes('/pages/dialyse/') || id.includes('/components/healthcare/')) {
            return 'feature-dialyse';
          }
          if (id.includes('/pages/cardiology/')) {
            return 'feature-cardiology';
          }
          if (id.includes('/pages/ophthalmology/')) {
            return 'feature-ophthalmology';
          }
          // Sales and procurement
          if (id.includes('/pages/sales/')) {
            return 'feature-sales';
          }
          if (id.includes('/pages/procurement/')) {
            return 'feature-procurement';
          }
          if (id.includes('/pages/manufacturing/')) {
            return 'feature-manufacturing';
          }
        },
      },
    },
  },
}));
