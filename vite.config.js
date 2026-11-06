import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

const repositoryRoot = fileURLToPath(new URL('.', import.meta.url))
const frontendRoot = fileURLToPath(new URL('./career-compass', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  root: frontendRoot,
  envDir: repositoryRoot,
  publicDir: fileURLToPath(new URL('./public', import.meta.url)),
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
  },
})
