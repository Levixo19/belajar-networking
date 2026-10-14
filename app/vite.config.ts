import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' agar bundel statik jalan dari path mana pun (buka lokal / server statik)
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  // Hanya loopback: server API tanpa autentikasi, dan proxy ini meneruskan mutasi ke sana.
  // Target 127.0.0.1, bukan localhost: Node 17+ bisa menerjemahkan localhost ke ::1
  // sementara API cuma mendengar di 127.0.0.1, dan hasilnya ECONNREFUSED.
  server: { host: '127.0.0.1', port: 5173, strictPort: true, proxy: { '/api': 'http://127.0.0.1:4000' } },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true, proxy: { '/api': 'http://127.0.0.1:4000' } },
  build: { outDir: 'dist', chunkSizeWarningLimit: 1500 },
})
