import { Fig, Box, Arrow, T } from './primitives'

/* RPO dan RTO pada garis waktu insiden */
export function DgO6MetrikPemulihan() {
  return (
    <Fig title="RPO dan RTO pada garis waktu insiden" sub="RPO mengukur data yang hilang, RTO mengukur lamanya layanan mati" w={820} h={300}>
      <path d="M40 110 H780" className="dg-lnk" />
      <Box x={90} y={60} w={150} h={44} label="Backup terakhir" sub="titik data aman" tone="ok" />
      <Box x={330} y={60} w={150} h={44} label="Insiden" sub="layanan mati" tone="no" />
      <Box x={580} y={60} w={150} h={44} label="Layanan pulih" sub="uji, serah ke pengguna" tone="ok" />
      <path d="M165 125 V150 H405 V125" className="dg-lnk" />
      <T x={285} y={172} cls="dg-cap-in">RPO</T>
      <T x={285} y={190} cls="dg-note">data hilang paling banyak</T>
      <path d="M405 125 V150 H655 V125" className="dg-lnk" />
      <T x={530} y={172} cls="dg-cap-in">RTO</T>
      <T x={530} y={190} cls="dg-note">waktu mati paling lama</T>
      <T x={410} y={232} cls="dg-note">MTTR: rata-rata waktu perbaikan (deteksi, diagnosis, perbaikan, uji)</T>
      <T x={410} y={252} cls="dg-note">MTBF: rata-rata waktu antar kegagalan pada sistem yang bisa diperbaiki</T>
      <T x={410} y={278} cls="dg-note">Availability = MTBF / (MTBF + MTTR)</T>
    </Fig>
  )
}

/* Hot, warm, cold site dan DR cloud */
export function DgO6JenisSite() {
  const kol = [
    { x: 20, tone: 'no' as const, l: 'Hot site', s: 'siaga penuh', t: ['Perangkat dan data selalu hidup', 'Replikasi kontinu ke primer', 'RTO menit sampai detik', 'Biaya tertinggi'] },
    { x: 290, tone: 'warn' as const, l: 'Warm site', s: 'siaga sebagian', t: ['Perangkat ada, data tertinggal', 'Replikasi berkala, perlu aktivasi', 'RTO jam', 'Biaya menengah'] },
    { x: 560, tone: 'a' as const, l: 'Cold site', s: 'ruang kosong', t: ['Ruang, daya, rak, pendingin', 'Perangkat dan data dibawa', 'RTO hari sampai minggu', 'Biaya terendah'] },
  ]
  return (
    <Fig title="Jenis site pemulihan: hot, warm, cold, dan cloud" sub="Makin cepat pulih, makin mahal" w={820} h={330}>
      {kol.map(k => (
        <g key={k.l}>
          <Box x={k.x} y={20} w={240} h={50} label={k.l} sub={k.s} tone={k.tone} />
          {k.t.map((s, i) => <T key={i} x={k.x + 120} y={100 + i * 24} cls="dg-note" size={11}>{s}</T>)}
        </g>
      ))}
      <Box x={20} y={225} w={780} h={50} label="DR di cloud" sub="sumber daya disewa saat dibutuhkan" tone="p" />
      <T x={410} y={298} cls="dg-note" size={11}>Pola: pilot light (inti minimal), warm standby (skala kecil), atau hot lewat replikasi penuh</T>
      <T x={410} y={316} cls="dg-note" size={11}>Biaya mengikuti pemakaian, tetapi uji failover tetap wajib</T>
    </Fig>
  )
}

/* Full, incremental, differential */
export function DgO6BackupTipe() {
  const hari = ['Minggu (full)', 'Senin', 'Selasa', 'Rabu']
  const xs = [190, 335, 480, 625]
  const baris = [
    { y: 60, nama: 'Full', isi: ['500 GB', '500 GB', '500 GB', '500 GB'], tone: 'a' as const, cat: 'Pulih Rabu: 1 set terbaru. Ruang dan waktu backup terbesar.' },
    { y: 150, nama: 'Incremental', isi: ['500 GB', '+20 GB', '+20 GB', '+20 GB'], tone: 'p' as const, cat: 'Pulih Rabu: full + Senin + Selasa + Rabu. Backup tercepat, restore paling rumit.' },
    { y: 240, nama: 'Differential', isi: ['500 GB', '+20 GB', '+40 GB', '+60 GB'], tone: 'warn' as const, cat: 'Pulih Rabu: full + Rabu saja. Makin hari makin besar.' },
  ]
  return (
    <Fig title="Tiga jenis backup dalam satu pekan (perubahan harian 20 GB)" sub="Incremental menyalin perubahan sejak backup terakhir, differential sejak full terakhir" w={820} h={340}>
      {hari.map((h, i) => <T key={h} x={xs[i] + 65} y={40} cls="dg-sb">{h}</T>)}
      {baris.map(b => (
        <g key={b.nama}>
          <Box x={20} y={b.y} w={150} h={46} label={b.nama} tone="n" />
          {b.isi.map((s, i) => <Box key={i} x={xs[i]} y={b.y} w={130} h={46} label={s} tone={i === 0 ? 'a' : b.tone} />)}
          <T x={190} y={b.y + 66} anchor="start" cls="dg-note" size={11}>{b.cat}</T>
        </g>
      ))}
    </Fig>
  )
}

/* Alur manajemen perubahan */
export function DgO6AlurPerubahan() {
  const st = [
    ['Permintaan', 'RFC'], ['Nilai risiko', 'dampak'], ['Persetujuan', 'CAB'], ['Jadwal + MOP', 'window'],
    ['Eksekusi', 'pre-check'], ['Post-check', 'verifikasi'], ['Tutup + review', 'catat'],
  ]
  return (
    <Fig title="Alur change management dengan titik rollback" sub="Kriteria rollback ditetapkan sebelum eksekusi, bukan saat panik" w={820} h={330}>
      {st.map((s, i) => (
        <g key={s[0]}>
          <Box x={13 + i * 116} y={40} w={98} h={50} label={s[0]} sub={s[1]} tone={i === 4 ? 'p' : 'n'} fs={11} />
          {i < 6 && <Arrow d={`M${111 + i * 116} 65 H${129 + i * 116}`} tone="n" />}
        </g>
      ))}
      <Box x={494} y={140} w={180} h={44} label="Rollback" sub="kembali ke konfigurasi lama" tone="no" fs={11} />
      <Arrow d="M526 90 L550 140" tone="no" />
      <Arrow d="M642 90 L618 140" tone="no" />
      <T x={410} y={214} cls="dg-note" size={11}>Gagal pada pre-check atau post-check, atau melewati batas waktu window: jalankan rollback</T>
      <Box x={20} y={245} w={240} h={56} label="Standard" sub="risiko rendah, pra-disetujui" tone="ok" fs={12} />
      <Box x={285} y={245} w={240} h={56} label="Normal" sub="lewat penilaian dan CAB" tone="p" fs={12} />
      <Box x={550} y={245} w={240} h={56} label="Emergency" sub="darurat, review sesudahnya" tone="warn" fs={12} />
    </Fig>
  )
}
