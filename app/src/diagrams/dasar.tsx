import { useState } from 'react'
import { Fig, Box, Arrow, T, Device, Rows } from './primitives'
import { useInView } from '../lib/useInView'

/* 1 — Apa itu jaringan: dua host → switch → router → internet */
export function DgJaringan() {
  return (
    <Fig title="Anatomi jaringan paling sederhana" sub="Host → perangkat penghubung → gateway → internet" w={820} h={230}>
      <Device cx={70} cy={70} kind="pc" label="PC-A" />
      <Device cx={70} cy={170} kind="laptop" label="PC-B" />
      <Arrow d="M100 70 H210" /><Arrow d="M100 170 H210 V96" />
      <Device cx={245} cy={90} kind="switch" label="Switch (LAN)" />
      <Arrow d="M280 90 H370" label="frame" lx={325} ly={80} />
      <Device cx={410} cy={90} kind="router" label="Router / Gateway" />
      <Arrow d="M440 90 H560" tone="a" label="paket" lx={500} ly={80} />
      <Device cx={620} cy={90} kind="cloud" label="Internet" s={1.5} />
      <Arrow d="M680 90 H750" tone="a" />
      <Device cx={775} cy={90} kind="server" label="Server" s={0.85} />
      <T x={245} y={205} cls="dg-note">Domain broadcast yang sama: bicara pakai MAC</T>
      <T x={620} y={205} cls="dg-note">Beda jaringan: bicara pakai IP</T>
      <path d="M30 30 H320 V200 H30 Z" className="dg-region" />
      <T x={175} y={22} cls="dg-region-lb" size={11}>LAN: jaringan lokal</T>
    </Fig>
  )
}

/* 2 — Empat topologi */
export function DgTopologi() {
  const cx = (i: number) => 105 + i * 205
  return (
    <Fig title="Empat topologi dasar" sub="Bentuk hubungan menentukan biaya, ketahanan, dan titik gagal" w={820} h={260}>
      {['Bus', 'Star', 'Ring', 'Mesh'].map((n, i) => <T key={n} x={cx(i)} y={228} cls="dg-cap-in">{n}</T>)}
      {[0, 1, 2, 3].map(i => <T key={i} x={cx(i)} y={248} cls="dg-note" size={10}>
        {['1 kabel putus = mati semua', 'Hub gagal = mati semua', 'Token berputar 1 arah', 'n(n-1)/2 jalur, paling tahan'][i]}
      </T>)}
      {/* Bus */}
      <path d="M25 120 H185" className="dg-bus" />
      {[0, 1, 2, 3].map(i => <g key={i}><path d={`M${45 + i * 40} 120 V${i % 2 ? 155 : 85}`} className="dg-lnk" /><circle cx={45 + i * 40} cy={i % 2 ? 163 : 77} r={9} className="dg-node" /></g>)}
      {/* Star */}
      <circle cx={cx(1)} cy={120} r={13} className="dg-hub" />
      {[0, 1, 2, 3, 4].map(i => { const a = (i / 5) * Math.PI * 2 - Math.PI / 2, X = cx(1) + Math.cos(a) * 62, Y = 120 + Math.sin(a) * 62
        return <g key={i}><path d={`M${cx(1)} 120 L${X} ${Y}`} className="dg-lnk" /><circle cx={X} cy={Y} r={9} className="dg-node" /></g> })}
      {/* Ring */}
      <circle cx={cx(2)} cy={120} r={58} className="dg-ring" />
      {[0, 1, 2, 3, 4, 5].map(i => { const a = (i / 6) * Math.PI * 2 - Math.PI / 2
        return <circle key={i} cx={cx(2) + Math.cos(a) * 58} cy={120 + Math.sin(a) * 58} r={9} className="dg-node" /> })}
      <path d={`M${cx(2) + 58} 112 l6 8 -6 8`} className="dg-dir" />
      {/* Mesh */}
      {(() => { const pts = [0, 1, 2, 3, 4].map(i => { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; return [cx(3) + Math.cos(a) * 58, 120 + Math.sin(a) * 58] as const })
        const lines: any[] = []
        for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++)
          lines.push(<path key={`${i}-${j}`} d={`M${pts[i][0]} ${pts[i][1]} L${pts[j][0]} ${pts[j][1]}`} className="dg-lnk" />)
        return <>{lines}{pts.map(([X, Y], i) => <circle key={i} cx={X} cy={Y} r={9} className="dg-node" />)}</> })()}
    </Fig>
  )
}

/* 3 — Bobot bit dalam 1 byte (interaktif ringan: klik untuk nyalakan bit) */
export function DgByte() {
  const [bits, setBits] = useState([1, 1, 0, 0, 0, 0, 0, 0])
  const val = bits.reduce((a, b, i) => a + (b ? 128 >> i : 0), 0)
  return (
    <Fig title="Satu byte = 8 bit" sub="Klik kotaknya: lihat nilai desimalnya berubah" w={820} h={200}>
      {bits.map((b, i) => (
        <g key={i} onClick={() => setBits(p => p.map((v, j) => j === i ? (v ? 0 : 1) : v))} className="dg-click">
          <rect x={70 + i * 84} y={50} width={68} height={62} rx={12} className={`dg-bit ${b ? 'on' : ''}`} />
          <text x={104 + i * 84} y={90} className="dg-bit-tx">{b}</text>
          <text x={104 + i * 84} y={132} className="dg-sb">{128 >> i}</text>
          <text x={104 + i * 84} y={38} className="dg-note" style={{ fontSize: 10 }}>bit {7 - i}</text>
        </g>
      ))}
      <T x={410} y={172} cls="dg-big">{bits.join('')} = {val} desimal = 0x{val.toString(16).toUpperCase().padStart(2, '0')}</T>
    </Fig>
  )
}

/* 4 — Bandwidth vs latency: lebar pipa vs panjang pipa */
export function DgBandwidthLatency() {
  return (
    <Fig title="Bandwidth ≠ latency" sub="Lebar pipa vs panjang pipa, dua hal yang sering tertukar" w={820} h={250}>
      <T x={205} y={30} cls="dg-cap-in">Bandwidth besar, latency tinggi</T>
      <path d="M60 60 H350 V120 H60 Z" className="dg-pipe" />
      {[0, 1, 2, 3, 4].map(i => <circle key={i} cx={80 + i * 62} cy={90} r={13} className="dg-pkt dg-flow-x" style={{ animationDelay: `${i * 0.28}s` }} />)}
      <T x={205} y={143} cls="dg-note">Banyak data sekaligus, tapi tiap paket lama sampai. Cocok: unduh file besar</T>

      <T x={615} y={30} cls="dg-cap-in">Bandwidth kecil, latency rendah</T>
      <path d="M480 68 H750 V112 H480 Z" className="dg-pipe" />
      {[0, 1].map(i => <circle key={i} cx={500 + i * 60} cy={90} r={9} className="dg-pkt2 dg-flow-x" style={{ animationDelay: `${i * 0.2}s`, animationDuration: '1.1s' }} />)}
      <T x={615} y={143} cls="dg-note">Sedikit data, tapi balasan instan. Cocok: game online, VoIP</T>

      <path d="M60 185 H750" className="dg-axis" />
      <T x={60} y={210} cls="dg-sb" anchor="start">Throughput = data yang benar-benar sampai / waktu</T>
      <T x={750} y={210} cls="dg-sb" anchor="end">RTT = waktu pulang-pergi</T>
      <T x={405} y={235} cls="dg-note">Menambah bandwidth tidak menurunkan latency. Jarak dan antrean yang menentukan latency.</T>
    </Fig>
  )
}

/* 5 — Encoding sinyal: NRZ vs Manchester */
export function DgEncoding() {
  const bits = [1, 0, 1, 1, 0, 0, 1, 0]
  const W = 78, X0 = 90
  const nrz = bits.map((b, i) => `${i === 0 ? 'M' : 'L'}${X0 + i * W} ${b ? 70 : 110} L${X0 + (i + 1) * W} ${b ? 70 : 110}`).join(' ')
  const man = bits.map((b, i) => { const x = X0 + i * W, m = x + W / 2
    return `M${x} ${b ? 190 : 150} L${m} ${b ? 190 : 150} L${m} ${b ? 150 : 190} L${x + W} ${b ? 150 : 190}` }).join(' ')
  return (
    <Fig title="Bit → sinyal listrik" sub="Aturan encoding menentukan cara penerima membaca ulang bit" w={820} h={235}>
      {bits.map((b, i) => (<g key={i}>
        <text x={X0 + i * W + W / 2} y={34} className="dg-bit-tx" style={{ fontSize: 15 }}>{b}</text>
        <path d={`M${X0 + i * W} 44 V200`} className="dg-grid" />
      </g>))}
      <path d={`M${X0 + bits.length * W} 44 V200`} className="dg-grid" />
      <path d={nrz} className="dg-sig sig-p" />
      <path d={man} className="dg-sig sig-a" />
      <T x={78} y={92} cls="dg-sb" anchor="end">NRZ</T>
      <T x={78} y={172} cls="dg-sb" anchor="end">Manchester</T>
      <T x={410} y={225} cls="dg-note">NRZ hemat bandwidth tapi rawan hilang sinkronisasi. Manchester selalu ada transisi di tengah bit → clock ikut terkirim.</T>
    </Fig>
  )
}

/* 6 — Tumpukan OSI 7 layer (interaktif: sorot layer) */
const OSI = [
  { n: 7, name: 'Application', task: 'Antarmuka ke aplikasi', pdu: 'Data', ex: 'HTTP, DNS, SMTP' },
  { n: 6, name: 'Presentation', task: 'Format, enkripsi, kompresi', pdu: 'Data', ex: 'TLS, JPEG, UTF-8' },
  { n: 5, name: 'Session', task: 'Buka/tutup/kelola sesi', pdu: 'Data', ex: 'NetBIOS, RPC' },
  { n: 4, name: 'Transport', task: 'Keandalan, port, segmentasi', pdu: 'Segment', ex: 'TCP, UDP, QUIC' },
  { n: 3, name: 'Network', task: 'Alamat logis & routing', pdu: 'Packet', ex: 'IP, ICMP, OSPF' },
  { n: 2, name: 'Data Link', task: 'Alamat fisik & akses media', pdu: 'Frame', ex: 'Ethernet, ARP, VLAN' },
  { n: 1, name: 'Physical', task: 'Bit menjadi sinyal', pdu: 'Bit', ex: 'UTP, fiber, RJ45' },
]
export function DgOsiStack() {
  const [sel, setSel] = useState(-1)
  return (
    <Fig title="Tumpukan OSI" sub="Klik layer untuk melihat contoh nyatanya" w={820} h={360}>
      {OSI.map((l, i) => (
        <g key={l.n} onClick={() => setSel(sel === i ? -1 : i)} className="dg-click">
          <rect x={56} y={20 + i * 47} width={490} height={40} rx={9} className={`dg-osi l${l.n} ${sel === i ? 'on' : ''}`} />
          <text x={86} y={45 + i * 47} className="dg-osi-n">{l.n}</text>
          <text x={112} y={45 + i * 47} className="dg-lb" style={{ textAnchor: 'start' }}>{l.name}</text>
          <text x={248} y={45 + i * 47} className="dg-sb" style={{ textAnchor: 'start' }}>{l.task}</text>
          <rect x={556} y={26 + i * 47} width={94} height={28} rx={8} className="dg-pdu" />
          <text x={603} y={45 + i * 47} className="dg-pdu-tx">{l.pdu}</text>
        </g>
      ))}
      <path d="M672 24 V330" className="dg-axis2" />
      <T x={726} y={16} cls="dg-note" size={11}>perangkat khas</T>
      {[[7, 'Aplikasi'], [4, 'Firewall L4'], [3, 'Router'], [2, 'Switch'], [1, 'Hub, kabel']].map(([n, d], i) => {
        const idx = OSI.findIndex(o => o.n === n)
        return <text key={i} x={686} y={45 + idx * 47} className="dg-sb" style={{ textAnchor: 'start' }}>{d as string}</text>
      })}
      {sel >= 0 && <>
        <rect x={56} y={335} width={594} height={22} rx={8} className="dg-hint" />
        <text x={353} y={350} className="dg-sb">Contoh: {OSI[sel].ex}</text>
      </>}
    </Fig>
  )
}

/* 7 — Pemetaan OSI ↔ TCP/IP */
export function DgOsiTcpip() {
  const map = [
    { osi: ['Application', 'Presentation', 'Session'], tcp: 'Application', ex: 'HTTP, DNS, TLS' },
    { osi: ['Transport'], tcp: 'Transport', ex: 'TCP, UDP' },
    { osi: ['Network'], tcp: 'Internet', ex: 'IP, ICMP' },
    { osi: ['Data Link', 'Physical'], tcp: 'Network Access', ex: 'Ethernet, Wi-Fi' },
  ]
  let y = 24
  return (
    <Fig title="OSI (7 layer) ↔ TCP/IP (4 layer)" sub="Model yang dipakai di dunia nyata adalah TCP/IP; OSI dipakai untuk berpikir" w={820} h={360}>
      <T x={185} y={16} cls="dg-cap-in">OSI</T><T x={500} y={16} cls="dg-cap-in">TCP/IP</T><T x={710} y={16} cls="dg-cap-in">Contoh</T>
      {map.map((m, gi) => {
        const gh = m.osi.length * 44 + (m.osi.length - 1) * 6
        const top = y; y += gh + 12
        return (
          <g key={gi}>
            {m.osi.map((o, i) => <Box key={o} x={60} y={top + i * 50} w={250} h={44} label={o} tone="n" />)}
            <Box x={390} y={top} w={190} h={gh} label={m.tcp} tone="grad" />
            <Arrow d={`M316 ${top + gh / 2} H384`} tone="a" />
            <text x={620} y={top + gh / 2 + 4} className="dg-sb" style={{ textAnchor: 'start' }}>{m.ex}</text>
          </g>
        )
      })}
    </Fig>
  )
}

/* 8 — Enkapsulasi: header membungkus data */
export function DgEnkapsulasi() {
  const { ref, inView } = useInView<HTMLDivElement>()
  const layers = [
    { lb: 'Data', tone: 'grad', w: 240 },
    { lb: 'TCP header', tone: 'p', w: 130, pdu: 'Segment' },
    { lb: 'IP header', tone: 'a', w: 120, pdu: 'Packet' },
    { lb: 'Ethernet header', tone: 'ok', w: 150, pdu: 'Frame', tail: 'FCS' },
  ]
  let x = 290, W = 240
  const rows: any[] = []
  layers.forEach((l, i) => {
    if (i === 0) { rows.push({ y: 40, x, w: W, parts: [{ lb: 'Data', tone: 'grad', w: W }], pdu: 'Data' }); return }
    x -= l.w; W += l.w + (l.tail ? 60 : 0)
    rows.push({ y: 40 + i * 66, x, w: W, parts: [{ lb: l.lb, tone: l.tone, w: l.w }, { lb: 'muatan sebelumnya', tone: 'n', w: W - l.w - (l.tail ? 60 : 0) }, ...(l.tail ? [{ lb: l.tail, tone: l.tone, w: 60 }] : [])], pdu: l.pdu })
  })
  return (
    <div ref={ref}>
      <Fig title="Enkapsulasi: tiap layer menambah amplopnya sendiri" sub="Turun = membungkus (encapsulation) · Naik = membuka (de-encapsulation)" w={820} h={330}>
        {rows.map((r, i) => {
          let cx = r.x
          return (
            <g key={i} className={inView ? 'dg-pop' : 'dg-hidden'} style={{ animationDelay: `${i * 0.16}s` }}>
              {r.parts.map((p: any, j: number) => { const el = <Box key={j} x={cx} y={r.y} w={p.w} h={44} label={p.lb} tone={p.tone} fs={p.w < 90 ? 9 : 11} />; cx += p.w; return el })}
              <text x={r.x - 14} y={r.y + 27} className="dg-sb" style={{ textAnchor: 'end' }}>{r.pdu}</text>
              <text x={r.x + r.w + 14} y={r.y + 27} className="dg-note" style={{ textAnchor: 'start' }}>L{4 - i === 4 ? 7 : [7, 4, 3, 2][i]}</text>
            </g>
          )
        })}
        <Arrow d="M40 50 V290" tone="p" label="" />
        <T x={26} y={175} cls="dg-sb">kirim</T>
        <Arrow d="M780 290 V50" tone="a" />
        <T x={798} y={175} cls="dg-sb">terima</T>
      </Fig>
    </div>
  )
}

/* 9 — Media transmisi: penampang UTP / coax / fiber */
export function DgMedia() {
  return (
    <Fig title="Tiga keluarga media kabel" sub="Penampang melintang: apa yang sebenarnya ada di dalam kabel" w={820} h={250}>
      {/* UTP */}
      <T x={140} y={26} cls="dg-cap-in">UTP / STP: tembaga berpilin</T>
      <circle cx={140} cy={120} r={62} className="dg-jacket" />
      {[0, 1, 2, 3].map(i => { const a = (i / 4) * Math.PI * 2 + 0.4
        return [0, 1].map(k => <circle key={`${i}${k}`} cx={140 + Math.cos(a + k * 0.42) * 32} cy={120 + Math.sin(a + k * 0.42) * 32} r={13} className={`dg-wire w${i}`} />) })}
      <T x={140} y={205} cls="dg-note" size={10}>4 pasang dipilin: pilinan meredam crosstalk & EMI</T>
      <T x={140} y={222} cls="dg-note" size={10}>maks 100 m · murah · rentan interferensi</T>
      {/* Coax */}
      <T x={410} y={26} cls="dg-cap-in">Coaxial</T>
      <circle cx={410} cy={120} r={62} className="dg-jacket" />
      <circle cx={410} cy={120} r={48} className="dg-shield" />
      <circle cx={410} cy={120} r={32} className="dg-diel" />
      <circle cx={410} cy={120} r={11} className="dg-core" />
      <T x={410} y={205} cls="dg-note" size={10}>inti · dielektrik · anyaman pelindung · jaket</T>
      <T x={410} y={222} cls="dg-note" size={10}>tahan EMI · dipakai TV kabel / DOCSIS</T>
      {/* Fiber */}
      <T x={680} y={26} cls="dg-cap-in">Fiber optik</T>
      <circle cx={680} cy={120} r={62} className="dg-jacket" />
      <circle cx={680} cy={120} r={44} className="dg-buffer" />
      <circle cx={680} cy={120} r={26} className="dg-clad" />
      <circle cx={680} cy={120} r={9} className="dg-fcore" />
      <T x={680} y={205} cls="dg-note" size={10}>core · cladding · buffer · jaket</T>
      <T x={680} y={222} cls="dg-note" size={10}>kebal EMI · puluhan km · bandwidth terbesar</T>
    </Fig>
  )
}

/* 10 — Pinout T568A vs T568B */
const T568B = ['Putih-Oranye', 'Oranye', 'Putih-Hijau', 'Biru', 'Putih-Biru', 'Hijau', 'Putih-Coklat', 'Coklat']
const T568A = ['Putih-Hijau', 'Hijau', 'Putih-Oranye', 'Biru', 'Putih-Biru', 'Oranye', 'Putih-Coklat', 'Coklat']
const COLOR: Record<string, string> = { Oranye: '#f97316', Hijau: '#22c55e', Biru: '#3b82f6', Coklat: '#92400e' }
function pinFill(n: string) { const base = n.replace('Putih-', ''); return COLOR[base] || '#888' }
export function DgPinout() {
  return (
    <Fig title="Urutan kabel RJ45: T568A vs T568B" sub="Sama-sama sah; yang haram adalah beda standar di dua ujung tanpa sadar" w={820} h={300}>
      {[{ t: 'T568B (paling umum di Indonesia)', arr: T568B, x: 60 }, { t: 'T568A', arr: T568A, x: 440 }].map(({ t, arr, x }) => (
        <g key={t}>
          <T x={x + 160} y={26} cls="dg-cap-in">{t}</T>
          <path d={`M${x} 40 h320 v34 h-320 z`} className="dg-plug" />
          {arr.map((c, i) => (<g key={i}>
            <rect x={x + 8 + i * 39} y={44} width={30} height={26} rx={4} fill={pinFill(c)} opacity={c.startsWith('Putih') ? 0.45 : 1} stroke="var(--border-strong)" />
            <text x={x + 23 + i * 39} y={90} className="dg-sb">{i + 1}</text>
            <text x={x + 23 + i * 39} y={112} className="dg-note" style={{ fontSize: 8.5 }} transform={`rotate(-52 ${x + 23 + i * 39} 112)`}>{c}</text>
          </g>))}
        </g>
      ))}
      <path d="M60 190 h700 v92 h-700 z" className="dg-region" />
      <T x={410} y={212} cls="dg-cap-in">Kapan pakai yang mana</T>
      <T x={200} y={238} cls="dg-sb">Straight-through</T><T x={200} y={258} cls="dg-note" size={10}>B–B atau A–A · PC↔switch, switch↔router</T>
      <T x={620} y={238} cls="dg-sb">Crossover</T><T x={620} y={258} cls="dg-note" size={10}>A–B · PC↔PC, switch↔switch (lawas)</T>
      <T x={410} y={276} cls="dg-note" size={10}>Perangkat modern punya Auto-MDI/MDIX: crossover jarang dibutuhkan lagi.</T>
    </Fig>
  )
}

/* 11 — Single-mode vs multimode: jalur cahaya */
export function DgFiberMode() {
  return (
    <Fig title="Single-mode vs multimode" sub="Diameter core menentukan berapa banyak 'jalur' cahaya yang muat" w={820} h={260}>
      <T x={410} y={22} cls="dg-cap-in">Multimode (OM3/OM4): core 50 µm</T>
      <path d="M120 44 h580 v56 h-580 z" className="dg-clad2" />
      <path d="M120 56 h580 v32 h-580 z" className="dg-fcore2" />
      {[0, 1, 2].map(i => {
        const amp = [0, 12, 16][i]
        let d = 'M120 72'
        for (let x = 120; x < 700; x += 58) d += ` L${x + 29} ${72 - amp} L${x + 58} ${72 + amp}`
        return <path key={i} d={d} className={`dg-ray r${i}`} />
      })}
      <T x={410} y={118} cls="dg-note" size={10}>Banyak sudut pantul → tiba tidak bersamaan (modal dispersion) → jarak terbatas ±400 m, sumber LED/VCSEL, murah</T>

      <T x={410} y={160} cls="dg-cap-in">Single-mode (OS2): core 9 µm</T>
      <path d="M120 178 h580 v56 h-580 z" className="dg-clad2" />
      <path d="M120 199 h580 v14 h-580 z" className="dg-fcore2" />
      <path d="M120 206 h580" className="dg-ray r0" />
      <T x={410} y={252} cls="dg-note" size={10}>Satu jalur lurus → nyaris tanpa dispersi → puluhan sampai ratusan km, sumber laser, lebih mahal</T>
    </Fig>
  )
}

/* 12 — Domain tabrakan vs domain broadcast */
export function DgDomain() {
  return (
    <Fig title="Domain tabrakan vs domain broadcast" sub="Hub, switch, dan router memecah domain yang berbeda" w={820} h={280}>
      <Device cx={430} cy={60} kind="router" label="Router" />
      <Arrow d="M430 92 V125" /><Arrow d="M430 92 V125" />
      <path d="M400 40 H760 V250 H400 Z" className="dg-region r-b" />
      <path d="M60 40 H395 V250 H60 Z" className="dg-region r-b" />
      <T x={228} y={32} cls="dg-region-lb">Domain broadcast 1 (VLAN 10)</T>
      <T x={580} y={32} cls="dg-region-lb">Domain broadcast 2 (VLAN 20)</T>
      <path d="M300 60 H180" /><Arrow d="M400 60 H300 V125" tone="a" /><Arrow d="M460 60 H560 V125" tone="a" />
      <Device cx={230} cy={150} kind="switch" label="Switch" />
      <Device cx={590} cy={150} kind="switch" label="Switch" />
      {[0, 1, 2].map(i => (<g key={i}>
        <path d={`M${180 + i * 50} 165 V210`} className="dg-lnk" />
        <Device cx={180 + i * 50} cy={228} kind="pc" s={0.5} />
        <path d={`M${540 + i * 50} 165 V210`} className="dg-lnk" />
        <Device cx={540 + i * 50} cy={228} kind="pc" s={0.5} />
        <circle cx={180 + i * 50} cy={190} r={16} className="dg-cd" />
        <circle cx={540 + i * 50} cy={190} r={16} className="dg-cd" />
      </g>))}
      <T x={410} y={268} cls="dg-note">Tiap port switch = 1 domain tabrakan (lingkaran putus-putus) · Tiap interface router = batas domain broadcast</T>
    </Fig>
  )
}
