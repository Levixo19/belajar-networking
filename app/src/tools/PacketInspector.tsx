import { useMemo, useState } from 'react'

interface Field { id: string; name: string; from: number; len: number; val: string; note: string; layer: 2 | 3 | 4 | 7 }

/* Satu frame contoh: Ethernet II + IPv4 + TCP + potongan HTTP */
const BYTES: number[] = [
  // Ethernet (14)
  0x00, 0x1a, 0x2b, 0x3c, 0x4d, 0x5e, 0xaa, 0xbb, 0xcc, 0x11, 0x22, 0x33, 0x08, 0x00,
  // IPv4 (20)
  0x45, 0x00, 0x00, 0x3c, 0x1c, 0x46, 0x40, 0x00, 0x40, 0x06, 0xb1, 0xe6,
  0xc0, 0xa8, 0x01, 0x32, 0x5d, 0xb8, 0xd8, 0x22,
  // TCP (20)
  0xc7, 0x69, 0x01, 0xbb, 0x00, 0x00, 0x0a, 0x1c, 0x00, 0x00, 0x00, 0x00,
  0x50, 0x02, 0x72, 0x10, 0x1b, 0x3a, 0x00, 0x00,
  // Payload
  0x47, 0x45, 0x54, 0x20, 0x2f, 0x20, 0x48, 0x54, 0x54, 0x50, 0x2f, 0x31, 0x2e, 0x31, 0x0d, 0x0a,
]

const FIELDS: Field[] = [
  { id: 'dmac', name: 'MAC Tujuan', from: 0, len: 6, val: '00:1a:2b:3c:4d:5e', note: 'Alamat fisik hop berikutnya, berubah tiap kali melewati router.', layer: 2 },
  { id: 'smac', name: 'MAC Sumber', from: 6, len: 6, val: 'aa:bb:cc:11:22:33', note: 'MAC perangkat yang mengirim frame ini, bukan pengirim asli paket.', layer: 2 },
  { id: 'etype', name: 'EtherType', from: 12, len: 2, val: '0x0800 (IPv4)', note: 'Memberi tahu penerima isi payload harus diserahkan ke tumpukan mana.', layer: 2 },
  { id: 'ver', name: 'Version + IHL', from: 14, len: 1, val: '4, 5 word (20 byte)', note: 'Nibble atas = versi IP, nibble bawah = panjang header dalam 32-bit word.', layer: 3 },
  { id: 'tlen', name: 'Total Length', from: 16, len: 2, val: '60 byte', note: 'Panjang header IP + seluruh payload.', layer: 3 },
  { id: 'flags', name: 'Flags + Fragment Offset', from: 20, len: 2, val: "0x4000 (Don't Fragment)", note: 'DF diset → kalau paket kebesaran, router membuangnya dan mengirim ICMP, bukan memecahnya. Ini dasar Path MTU Discovery.', layer: 3 },
  { id: 'ttl', name: 'TTL', from: 22, len: 1, val: '64', note: 'Dikurangi 1 tiap hop. Nilai awal 64 = Linux, 128 = Windows, 255 = perangkat jaringan.', layer: 3 },
  { id: 'proto', name: 'Protocol', from: 23, len: 1, val: '6 (TCP)', note: '1 = ICMP, 6 = TCP, 17 = UDP.', layer: 3 },
  { id: 'sip', name: 'IP Sumber', from: 26, len: 4, val: '192.168.1.50', note: 'Alamat logis pengirim asli, tetap sama sepanjang jalur (kecuali kena NAT).', layer: 3 },
  { id: 'dip', name: 'IP Tujuan', from: 30, len: 4, val: '93.184.216.34', note: 'Inilah yang dipakai router untuk longest prefix match.', layer: 3 },
  { id: 'sport', name: 'Port Sumber', from: 34, len: 2, val: '51049', note: 'Ephemeral port yang dipilih acak oleh OS klien.', layer: 4 },
  { id: 'dport', name: 'Port Tujuan', from: 36, len: 2, val: '443 (HTTPS)', note: 'Menentukan aplikasi mana di server yang menerima data.', layer: 4 },
  { id: 'seq', name: 'Sequence Number', from: 38, len: 4, val: '2588', note: 'Nomor byte pertama pada segmen ini, inti dari pengurutan ulang TCP.', layer: 4 },
  { id: 'tflags', name: 'Data Offset + Flags', from: 46, len: 2, val: '0x5002 (SYN)', note: 'Hanya SYN yang menyala: ini paket pertama pembuka koneksi.', layer: 4 },
  { id: 'win', name: 'Window Size', from: 48, len: 2, val: '29200', note: 'Berapa byte yang sanggup ditampung penerima. Inilah mesin kendali aliran.', layer: 4 },
  { id: 'pl', name: 'Payload', from: 54, len: 16, val: 'GET / HTTP/1.1', note: 'Data aplikasi. Di sinilah HTTP, DNS, atau apa pun sebenarnya berada.', layer: 7 },
]

const LAYER_LB: Record<number, string> = { 2: 'L2 Ethernet', 3: 'L3 IPv4', 4: 'L4 TCP', 7: 'L7 Aplikasi' }

export default function PacketInspector() {
  const [sel, setSel] = useState<string | null>('ttl')
  const owner = useMemo(() => {
    const m: Record<number, Field> = {}
    FIELDS.forEach(f => { for (let i = f.from; i < f.from + f.len; i++) m[i] = f })
    return m
  }, [])
  const f = FIELDS.find(x => x.id === sel)

  return (
    <div className="pi">
      <div className="pi-head">
        <div className="pi-title">Pembedah paket</div>
        <div className="pi-desc">Frame nyata dalam heksadesimal. Klik byte-nya atau nama kolomnya, keduanya saling menyorot.</div>
      </div>
      <div className="pi-grid">
        <div className="pi-hex">
          {Array.from({ length: Math.ceil(BYTES.length / 16) }, (_, r) => (
            <div key={r} className="pi-row">
              <span className="pi-off">{(r * 16).toString(16).padStart(4, '0')}</span>
              <span className="pi-bytes">
                {BYTES.slice(r * 16, r * 16 + 16).map((b, c) => {
                  const i = r * 16 + c, o = owner[i]
                  return <button key={c} onClick={() => o && setSel(o.id)}
                    className={`pi-b ${o ? `l${o.layer}` : ''} ${o && o.id === sel ? 'on' : ''}`}
                    title={o?.name}>{b.toString(16).padStart(2, '0')}</button>
                })}
              </span>
              <span className="pi-ascii">
                {BYTES.slice(r * 16, r * 16 + 16).map((b, c) => {
                  const i = r * 16 + c, o = owner[i]
                  return <i key={c} className={o && o.id === sel ? 'on' : ''}>{b >= 32 && b < 127 ? String.fromCharCode(b) : '·'}</i>
                })}
              </span>
            </div>
          ))}
        </div>
        <div className="pi-side">
          {[2, 3, 4, 7].map(L => (
            <div key={L} className="pi-group">
              <div className={`pi-glb l${L}`}>{LAYER_LB[L]}</div>
              {FIELDS.filter(x => x.layer === L).map(x => (
                <button key={x.id} onClick={() => setSel(x.id)} className={`pi-f l${L} ${sel === x.id ? 'on' : ''}`}>
                  <span>{x.name}</span><em>{x.val}</em>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      {f && <div className={`pi-note l${f.layer} fade-in`}><b>{f.name}</b>. Offset {f.from}, {f.len} byte. {f.note}</div>}
    </div>
  )
}
