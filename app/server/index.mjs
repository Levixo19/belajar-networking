import { connectDB } from './db.mjs'
import { buatApp } from './app.mjs'

// Lapis 1 dari tiga (lihat kepala app.mjs): bind LOOPBACK, bukan semua antarmuka.
// `app.listen(PORT)` tanpa host mendengar di 0.0.0.0/::, dan karena server ini tidak
// punya autentikasi, siapa pun di Wi-Fi yang sama bisa menghapus profil belajar.
// Host sengaja tidak bisa diatur lewat env: tidak ada kebutuhan sah untuk membukanya.
const HOST = '127.0.0.1'
const PORT = Number(process.env.PORT) || 4000

// Port API ikut daftar Host/Origin yang sah; kalau PORT diganti, penjagaannya ikut.
const app = buatApp({ ports: [...new Set([PORT, 5173, 4173])] })
connectDB().then(() => {
  app.listen(PORT, HOST, () => console.log(`API Belajar Networking di http://${HOST}:${PORT} (hanya laptop ini)`))
})
