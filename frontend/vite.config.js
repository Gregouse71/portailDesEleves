import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    outDir: 'build',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-quill-new')) {
              return 'quill';
            }
            if (id.includes('katex') || id.includes('react-katex')) {
              return 'katex';
            }
            if (id.includes('bootstrap') || id.includes('react-bootstrap') || id.includes('react-bootstrap-icons')) {
              return 'bootstrap';
            }
            return 'vendor';
          }
        },
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Supprimer "Undefined mixin": 
        additionalData: `
          @import "bootstrap/scss/functions";
          @import "bootstrap/scss/variables";
          @import "bootstrap/scss/mixins";
        `,
        // Supprimer "Deprecation Warning"
        quietDeps: true,
        silenceDeprecations: ['color-functions', 'import'],
      },
    },
  },
})