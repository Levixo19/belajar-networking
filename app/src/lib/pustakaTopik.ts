// Kosakata topik Pustaka dan pemetaannya ke tahap kurikulum. SATU-SATUNYA tempat
// pemetaan ini ditulis: butir pustaka cuma membawa topik, dan tahap terkaitnya
// dihitung dari tabel ini saat dimuat. Menambah tahap baru berarti menambah satu
// baris di sini, tanpa memanen ulang dan tanpa menyunting ratusan butir.
//
// Berkas ini sengaja tanpa impor: dibaca Vite (UI), skrip build (validasi), dan
// node:test sekaligus.

export const TOPIK: Record<string, string> = {
  fondasi: 'Dasar jaringan',
  fisik: 'Layer fisik & kabel',
  l2: 'Switching & VLAN',
  routing: 'Routing',
  transport: 'TCP & UDP',
  aplikasi: 'DNS, HTTP & layanan',
  ipv6: 'IPv6',
  'firewall-nat': 'NAT, ACL & firewall',
  wireless: 'Wireless',
  'wan-vpn': 'WAN & VPN',
  keamanan: 'Keamanan',
  linux: 'Linux',
  monitoring: 'Monitoring & troubleshooting',
  'analisis-paket': 'Analisis paket',
  otomasi: 'Otomasi',
  cloud: 'Cloud',
  container: 'Container & Kubernetes',
  datacenter: 'Data center & SDN',
  desain: 'Desain & arsitektur',
  karier: 'Karier',
  sertifikasi: 'Sertifikasi',
  mikrotik: 'MikroTik',
  cisco: 'Cisco',
  juniper: 'Juniper',
  provider: 'Service provider & internet',
  lab: 'Lab & emulator',
  'pemrograman-jaringan': 'Pemrograman jaringan',
  standar: 'Standar & RFC',
}

/** Topik -> tahap kurikulum (id folder di materi/). Urutan = urutan relevansi. */
export const TOPIK_TAHAP: Record<string, string[]> = {
  fondasi: ['00-fondasi', '01-model-referensi'],
  fisik: ['02-layer-fisik'],
  l2: ['03-data-link'],
  routing: ['04-network-layer', '07-routing-lanjutan'],
  transport: ['05-transport'],
  aplikasi: ['06-aplikasi'],
  ipv6: ['08-ipv6'],
  'firewall-nat': ['09-nat-acl-firewall'],
  wireless: ['10-wireless'],
  'wan-vpn': ['11-wan-vpn'],
  keamanan: ['12-keamanan', '09-nat-acl-firewall'],
  linux: ['13-linux-networking'],
  monitoring: ['14-monitoring-troubleshooting'],
  'analisis-paket': ['14-monitoring-troubleshooting', '05-transport'],
  otomasi: ['15-otomasi'],
  cloud: ['16-datacenter-cloud-sdn'],
  container: ['16-datacenter-cloud-sdn', '13-linux-networking'],
  datacenter: ['16-datacenter-cloud-sdn'],
  desain: ['17-desain-arsitektur', '20-proyek-akhir'],
  karier: ['18-karier-sertifikasi', '21-ekosistem-profesi'],
  sertifikasi: ['18-karier-sertifikasi'],
  mikrotik: ['19-mikrotik'],
  cisco: ['18-karier-sertifikasi', 'lab'],
  juniper: ['22-service-provider'],
  provider: ['22-service-provider', '07-routing-lanjutan'],
  lab: ['lab', '20-proyek-akhir'],
  'pemrograman-jaringan': ['05-transport', '15-otomasi'],
  standar: ['referensi'],
}

/**
 * Topik untuk tautan yang dipanen dari materi sendiri: asal modulnya sudah
 * diketahui, jadi topiknya diturunkan dari TOPIK_TAHAP, bukan ditebak. Diambil
 * topik yang menyebut tahap itu sebagai tahap UTAMA-nya (elemen pertama); kalau
 * tidak ada, topik pertama yang menyebutnya sama sekali. Panduan dan proyek akhir
 * tidak mendapat topik.
 */
export function topikUntukTahap(tahap: string): string[] {
  const utama = Object.entries(TOPIK_TAHAP).filter(([, t]) => t[0] === tahap).map(([k]) => k)
  if (utama.length) return utama
  return Object.entries(TOPIK_TAHAP).filter(([, t]) => t.includes(tahap)).map(([k]) => k).slice(0, 1)
}

/** Jenis butir pustaka. */
export const JENIS: Record<string, string> = {
  buku: 'Buku', kursus: 'Kursus', video: 'Video', dokumentasi: 'Dokumentasi',
  standar: 'Standar', alat: 'Alat', lab: 'Lab', daftar: 'Daftar kurasi', artikel: 'Artikel',
}
