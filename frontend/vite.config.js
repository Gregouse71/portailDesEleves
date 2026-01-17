import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    outDir: 'build',
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