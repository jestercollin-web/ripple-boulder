import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: ['es2015', 'safari13'],
    outDir: 'dist',
  },
  esbuild: {
    target: 'es2015',
  },
})
