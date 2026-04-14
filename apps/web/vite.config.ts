import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Get variant from environment
const APP_VARIANT = process.env.VITE_APP_VARIANT || 'perfex-full';

// Define which features are enabled for each variant
const VARIANT_FEATURES: Record<string, Record<string, boolean>> = {
  'perfex-full': {
    bakery: true,
    dialyse: true,
    cardiology: true,
    ophthalmology: true,
    crm: true,
    finance: true,
    hr: true,
    inventory: true,
    projects: true,
    sales: true,
    procurement: true,
    manufacturing: true,
    workflows: true,
    audit: true,
    ai: true,
    clinicalAi: true,
    rpm: true,
    patientPortal: true,
  },
  'perfex-bakery': {
    bakery: true,
    finance: true,
    hr: true,
    inventory: true,
    // Disabled for bakery
    dialyse: false,
    cardiology: false,
    ophthalmology: false,
    crm: false,
    projects: false,
    sales: false,
    procurement: false,
    manufacturing: false,
    workflows: false,
    audit: false,
    ai: false,
    clinicalAi: false,
    rpm: false,
    patientPortal: false,
  },
  'perfex-health': {
    dialyse: true,
    cardiology: true,
    ophthalmology: true,
    clinicalAi: true,
    rpm: true,
    patientPortal: true,
    finance: true,
    hr: true,
    inventory: true,
    // Disabled for health
    bakery: false,
    crm: false,
    projects: false,
    sales: false,
    procurement: false,
    manufacturing: false,
    workflows: false,
    audit: false,
    ai: false,
  },
};

const features = VARIANT_FEATURES[APP_VARIANT] || VARIANT_FEATURES['perfex-full'];

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    // Compile-time feature flags for tree-shaking
    '__FEATURE_BAKERY__': JSON.stringify(features.bakery),
    '__FEATURE_DIALYSE__': JSON.stringify(features.dialyse),
    '__FEATURE_CARDIOLOGY__': JSON.stringify(features.cardiology),
    '__FEATURE_OPHTHALMOLOGY__': JSON.stringify(features.ophthalmology),
    '__FEATURE_CRM__': JSON.stringify(features.crm),
    '__FEATURE_FINANCE__': JSON.stringify(features.finance),
    '__FEATURE_HR__': JSON.stringify(features.hr),
    '__FEATURE_INVENTORY__': JSON.stringify(features.inventory),
    '__FEATURE_PROJECTS__': JSON.stringify(features.projects),
    '__FEATURE_SALES__': JSON.stringify(features.sales),
    '__FEATURE_PROCUREMENT__': JSON.stringify(features.procurement),
    '__FEATURE_MANUFACTURING__': JSON.stringify(features.manufacturing),
    '__FEATURE_WORKFLOWS__': JSON.stringify(features.workflows),
    '__FEATURE_AUDIT__': JSON.stringify(features.audit),
    '__FEATURE_AI__': JSON.stringify(features.ai),
    '__FEATURE_CLINICAL_AI__': JSON.stringify(features.clinicalAi),
    '__FEATURE_RPM__': JSON.stringify(features.rpm),
    '__FEATURE_PATIENT_PORTAL__': JSON.stringify(features.patientPortal),
  },
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

          // Feature chunks based on file path - only create chunk if feature is enabled
          if (id.includes('/pages/finance/') && features.finance) {
            return 'feature-finance';
          }
          if (id.includes('/pages/crm/') && features.crm) {
            return 'feature-crm';
          }
          if ((id.includes('/pages/ai/') || id.includes('/components/ai/')) && features.ai) {
            return 'feature-ai';
          }
          if (id.includes('/pages/hr/') && features.hr) {
            return 'feature-hr';
          }
          if (id.includes('/pages/inventory/') && features.inventory) {
            return 'feature-inventory';
          }
          if (id.includes('/pages/projects/') && features.projects) {
            return 'feature-projects';
          }
          if (id.includes('/pages/workflows/') && features.workflows) {
            return 'feature-workflows';
          }
          if (id.includes('/pages/audit/') && features.audit) {
            return 'feature-audit';
          }
          // Healthcare modules
          if ((id.includes('/pages/dialyse/') || id.includes('/components/healthcare/')) && features.dialyse) {
            return 'feature-dialyse';
          }
          if (id.includes('/pages/cardiology/') && features.cardiology) {
            return 'feature-cardiology';
          }
          if (id.includes('/pages/ophthalmology/') && features.ophthalmology) {
            return 'feature-ophthalmology';
          }
          // Bakery module
          if ((id.includes('/pages/bakery/') || id.includes('/pages/recipes/') || id.includes('/pages/pos/')) && features.bakery) {
            return 'feature-bakery';
          }
          // Sales and procurement
          if (id.includes('/pages/sales/') && features.sales) {
            return 'feature-sales';
          }
          if (id.includes('/pages/procurement/') && features.procurement) {
            return 'feature-procurement';
          }
          if (id.includes('/pages/manufacturing/') && features.manufacturing) {
            return 'feature-manufacturing';
          }
          // Clinical AI & RPM
          if (id.includes('/pages/clinical-ai/') && features.clinicalAi) {
            return 'feature-clinical-ai';
          }
          if (id.includes('/pages/rpm/') && features.rpm) {
            return 'feature-rpm';
          }
          if (id.includes('/pages/patient-portal/') && features.patientPortal) {
            return 'feature-patient-portal';
          }
        },
      },
    },
  },
}));
