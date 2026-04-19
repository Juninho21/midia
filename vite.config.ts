import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'not IE 11', 'chrome >= 47', 'safari >= 9'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    })
  ],
})
