import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' agar bundel statik jalan dari path mana pun (buka lokal / server statik)
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: { host: true, port: 5173, proxy: { '/api': 'http://localhost:4000' } },
  build: { outDir: 'dist', chunkSizeWarningLimit: 1500 },
})
