import mongoose from 'mongoose'

const URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/belajar_networking'

export async function connectDB() {
  mongoose.set('strictQuery', true)
  let tries = 0
  while (true) {
    try {
      await mongoose.connect(URI, { serverSelectionTimeoutMS: 3000 })
      console.log('✅ MongoDB terhubung:', URI.replace(/\/\/[^@]*@/, '//***@'))
      return
    } catch (e) {
      tries++
      if (tries === 1) {
        console.error('⏳ Menunggu MongoDB di', URI)
        console.error('   Pastikan MongoDB jalan — jalankan:  npm run db:up   (butuh Docker)')
      }
      if (tries > 20) { console.error('❌ Gagal konek MongoDB:', e.message); process.exit(1) }
      await new Promise(r => setTimeout(r, 2000))
    }
  }
}
